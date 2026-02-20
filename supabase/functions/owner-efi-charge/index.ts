import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import forge from "npm:node-forge@1.3.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function getEfiBaseUrl(isSandbox: boolean): string {
  return isSandbox
    ? "https://pix-h.api.efipay.com.br"
    : "https://pix.api.efipay.com.br";
}

function convertP12ToPem(p12Base64: string, passphrase = ""): { certPem: string; keyPem: string } {
  // Clean base64: remove whitespace, newlines, and any non-base64 chars
  const cleanB64 = p12Base64.replace(/[\s\r\n]+/g, "").trim();
  const p12Der = forge.util.decode64(cleanB64);
  const p12Asn1 = forge.asn1.fromDer(p12Der, { strict: false } as any);
  const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, passphrase);

  // Extract certificates
  const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
  const certs = certBags[forge.pki.oids.certBag] || [];
  if (certs.length === 0) {
    throw new Error("Nenhum certificado encontrado no P12");
  }
  const certPem = certs
    .map((bag: any) => forge.pki.certificateToPem(bag.cert))
    .join("\n");

  // Extract private key
  const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
  const keys = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag] || [];
  if (keys.length === 0) {
    throw new Error("Nenhuma chave privada encontrada no P12");
  }
  const keyPem = forge.pki.privateKeyToPem(keys[0].key);

  console.log(`[EFI] Extracted ${certs.length} cert(s) and key from P12`);
  return { certPem, keyPem };
}

function createMtlsClient(certPem: string, keyPem: string): Deno.HttpClient {
  return Deno.createHttpClient({
    cert: certPem,
    key: keyPem,
  } as any);
}

async function getEfiToken(
  clientId: string,
  clientSecret: string,
  isSandbox: boolean,
  httpClient?: Deno.HttpClient
): Promise<string> {
  const baseUrl = getEfiBaseUrl(isSandbox);
  const credentials = btoa(`${clientId}:${clientSecret}`);

  const fetchOptions: RequestInit & { client?: Deno.HttpClient } = {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ grant_type: "client_credentials" }),
  };

  if (httpClient) {
    (fetchOptions as any).client = httpClient;
  }

  const res = await fetch(`${baseUrl}/oauth/token`, fetchOptions);

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Efí auth failed: ${res.status} - ${body}`);
  }

  const data = await res.json();
  return data.access_token;
}

async function efiFetch(
  url: string,
  options: RequestInit,
  httpClient?: Deno.HttpClient
): Promise<Response> {
  if (httpClient) {
    (options as any).client = httpClient;
  }
  return fetch(url, options);
}

async function getOwnerSetting(supabase: any, key: string): Promise<string> {
  const { data } = await supabase
    .from("owner_settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  return data?.value || "";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Verify the caller is an owner
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authErr } = await anonClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "owner");
    if (!roleData || roleData.length === 0) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action } = body;

    // Load Efí credentials
    const clientId = Deno.env.get("EFI_CLIENT_ID") || "";
    const clientSecret = Deno.env.get("EFI_CLIENT_SECRET") || "";
    const pixKey = Deno.env.get("EFI_PIX_KEY") || "";
    const certP12B64 = Deno.env.get("EFI_CERT_P12_B64") || "";
    const environment = await getOwnerSetting(supabase, "efi_environment");
    const isSandbox = environment !== "production";

    if (!clientId || !clientSecret) {
      return new Response(
        JSON.stringify({ error: "Credenciais Efí não configuradas", success: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Setup mTLS client if cert is available and in production
    let httpClient: Deno.HttpClient | undefined;
    if (certP12B64 && !isSandbox) {
      try {
        const { certPem, keyPem } = convertP12ToPem(certP12B64);
        httpClient = createMtlsClient(certPem, keyPem);
      } catch (e: any) {
        return new Response(
          JSON.stringify({ error: `Erro ao processar certificado: ${e.message}`, success: false }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const baseUrl = getEfiBaseUrl(isSandbox);

    // Test connection
    if (action === "test_connection") {
      try {
        await getEfiToken(clientId, clientSecret, isSandbox, httpClient);
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e: any) {
        return new Response(JSON.stringify({ success: false, error: e.message }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Create PIX charge
    if (action === "create_charge") {
      const { amount, description, invoice_id } = body;
      const token = await getEfiToken(clientId, clientSecret, isSandbox, httpClient);

      const expSeconds = 3600;
      const chargeRes = await efiFetch(`${baseUrl}/v2/cob`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          calendario: { expiracao: expSeconds },
          valor: { original: Number(amount).toFixed(2) },
          chave: pixKey,
          infoAdicionais: [{ nome: "Fatura", valor: description || "Assinatura" }],
        }),
      }, httpClient);

      if (!chargeRes.ok) {
        const errBody = await chargeRes.text();
        throw new Error(`Efí charge failed: ${chargeRes.status} - ${errBody}`);
      }

      const chargeData = await chargeRes.json();

      // Get QR code
      const locId = chargeData.loc?.id;
      let qrCode = null;
      let qrImage = null;
      if (locId) {
        const qrRes = await efiFetch(`${baseUrl}/v2/loc/${locId}/qrcode`, {
          headers: { Authorization: `Bearer ${token}` },
        }, httpClient);
        if (qrRes.ok) {
          const qrData = await qrRes.json();
          qrCode = qrData.qrcode;
          qrImage = qrData.imagemQrcode;
        }
      }

      // Update invoice with charge data
      if (invoice_id) {
        await supabase
          .from("owner_invoices")
          .update({
            gateway_charge_id: chargeData.txid,
            pix_copy_paste: qrCode || chargeData.pixCopiaECola,
            pix_qrcode: qrImage,
            status: "pending",
          })
          .eq("id", invoice_id);
      }

      // Audit log
      await supabase.from("owner_audit_logs").insert({
        action: "CREATE_PIX_CHARGE",
        actor_type: "owner",
        meta_json: { amount, invoice_id, txid: chargeData.txid },
      });

      return new Response(
        JSON.stringify({
          success: true,
          txid: chargeData.txid,
          qr_code: qrCode || chargeData.pixCopiaECola,
          qr_image: qrImage,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Suspend system
    if (action === "suspend_system") {
      await supabase
        .from("owner_subscription")
        .update({ status: "suspended", updated_at: new Date().toISOString() })
        .neq("status", "suspended");

      await supabase.from("owner_audit_logs").insert({
        action: "SUSPEND_SYSTEM",
        actor_type: "owner",
        meta_json: { reason: body.reason || "Manual suspension" },
      });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Reactivate system
    if (action === "reactivate_system") {
      await supabase
        .from("owner_subscription")
        .update({
          status: "active",
          updated_at: new Date().toISOString(),
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq("status", "suspended");

      await supabase.from("owner_audit_logs").insert({
        action: "REACTIVATE_SYSTEM",
        actor_type: "owner",
      });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate invoice
    if (action === "generate_invoice") {
      const { amount: invAmount } = body;

      const { data: subData } = await supabase
        .from("owner_subscription")
        .select("id")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const { data: invoice, error: invErr } = await supabase
        .from("owner_invoices")
        .insert({
          subscription_id: subData?.id || null,
          amount: invAmount || 0,
          status: "pending",
          gateway: "efi",
          payment_method: "pix",
        })
        .select()
        .single();

      if (invErr) throw invErr;

      await supabase.from("owner_audit_logs").insert({
        action: "GENERATE_INVOICE",
        actor_type: "owner",
        meta_json: { invoice_id: invoice.id, amount: invAmount },
      });

      return new Response(JSON.stringify({ success: true, invoice }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
