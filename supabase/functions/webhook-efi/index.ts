import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const body = await req.json();

    // Efí sends pix webhook with array of pix payments
    const pixArray = body.pix || [];

    for (const pix of pixArray) {
      const txid = pix.txid;
      if (!txid) continue;

      // Find invoice by gateway_charge_id = txid
      const { data: invoice } = await supabase
        .from("owner_invoices")
        .select("*")
        .eq("gateway_charge_id", txid)
        .maybeSingle();

      if (!invoice) continue;

      // Mark as paid
      await supabase
        .from("owner_invoices")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
        })
        .eq("id", invoice.id);

      // If subscription was past_due or suspended, reactivate
      if (invoice.subscription_id) {
        const { data: sub } = await supabase
          .from("owner_subscription")
          .select("status")
          .eq("id", invoice.subscription_id)
          .maybeSingle();

        if (sub && (sub.status === "past_due" || sub.status === "suspended")) {
          await supabase
            .from("owner_subscription")
            .update({
              status: "active",
              current_period_start: new Date().toISOString(),
              current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", invoice.subscription_id);
        }
      }

      // Audit log
      await supabase.from("owner_audit_logs").insert({
        action: "PAYMENT_RECEIVED",
        actor_type: "webhook",
        meta_json: {
          txid,
          invoice_id: invoice.id,
          amount: pix.valor,
          end_to_end_id: pix.endToEndId,
        },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("Webhook Efí error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
