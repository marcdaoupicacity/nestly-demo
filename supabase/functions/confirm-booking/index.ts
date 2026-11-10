import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) return json({ error: "STRIPE_SECRET_KEY not configured" }, 500);

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
    const { data: { user }, error: authErr } = await admin.auth.getUser(token);
    if (authErr || !user) return json({ error: "Unauthorized" }, 401);

    const { booking_id } = await req.json();
    if (!booking_id) return json({ error: "Missing booking_id" }, 400);

    const { data: booking } = await admin.from("bookings").select("*")
      .eq("id", booking_id).eq("user_id", user.id).single();
    if (!booking) return json({ error: "Booking not found" }, 404);
    if (booking.status === "paid" || !booking.stripe_session_id) return json({ booking });

    const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${booking.stripe_session_id}`, {
      headers: { Authorization: `Bearer ${stripeKey}` },
    });
    const session = await res.json();
    if (!res.ok) return json({ error: session?.error?.message ?? "Stripe error" }, 502);

    if (session.payment_status === "paid") {
      const { data: updated } = await admin.from("bookings").update({ status: "paid" })
        .eq("id", booking.id).select().single();
      return json({ booking: updated });
    }
    return json({ booking });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
