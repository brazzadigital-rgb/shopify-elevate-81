import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function getOwnerSetting(supabase: any, key: string): Promise<string> {
  const { data } = await supabase
    .from("owner_settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  return data?.value || "";
}

async function getEfiToken(clientId: string, clientSecret: string, isSandbox: boolean): Promise<string> {
  const baseUrl = isSandbox
    ? "https://pix-h.api.efipay.com.br"
    : "https://pix.api.efipay.com.br";

  const credentials = btoa(`${clientId}:${clientSecret}`);
  const res = await fetch(`${baseUrl}/oauth/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ grant_type: "client_credentials" }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Efí auth failed: ${res.status} - ${body}`);
  }

  const data = await res.json();
  return data.access_token;
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

    // Load Efí credentials from secrets (env vars)
    const clientId = Deno.env.get("EFI_CLIENT_ID") || "";
    const clientSecret = Deno.env.get("EFI_CLIENT_SECRET") || "";
    const environment = await getOwnerSetting(supabase, "efi_environment");
    const isSandbox = environment !== "production";

    if (!clientId || !clientSecret) {
      return new Response(
        JSON.stringify({ error: "Credenciais Efí não configuradas", success: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Test connection
    if (action === "test_connection") {
      try {
        await getEfiToken(clientId, clientSecret, isSandbox);
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
      const token = await getEfiToken(clientId, clientSecret, isSandbox);

      const baseUrl = isSandbox
        ? "https://pix-h.api.efipay.com.br"
        : "https://pix.api.efipay.com.br";

      // Create immediate charge (cob)
      const expSeconds = 3600; // 1 hour
      const chargeRes = await fetch(`${baseUrl}/v2/cob`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          calendario: { expiracao: expSeconds },
          valor: { original: Number(amount).toFixed(2) },
          chave: Deno.env.get("EFI_PIX_KEY") || "",
          infoAdicionais: [{ nome: "Fatura", valor: description || "Assinatura" }],
        }),
      });

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
        const qrRes = await fetch(`${baseUrl}/v2/loc/${locId}/qrcode`, {
          headers: { Authorization: `Bearer ${token}` },
        });
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
      const { amount: invAmount, description: invDesc } = body;

      // Get active subscription
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
