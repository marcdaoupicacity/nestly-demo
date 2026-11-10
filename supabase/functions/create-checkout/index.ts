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

    const { listing_id, check_in, check_out, guests, origin } = await req.json();
    if (!listing_id || !check_in || !check_out || !origin) return json({ error: "Missing fields" }, 400);

    const nights = Math.round((Date.parse(check_out) - Date.parse(check_in)) / 86400000);
    if (!Number.isFinite(nights) || nights < 1) return json({ error: "Invalid dates" }, 400);

    const { data: listing, error: lErr } = await admin.from("listings")
      .select("id,title,price_per_night,guests,images").eq("id", listing_id).single();
    if (lErr || !listing) return json({ error: "Listing not found" }, 404);
    const g = Math.max(1, Number(guests) || 1);
    if (listing.guests && g > listing.guests) return json({ error: "Too many guests" }, 400);

    const subtotal = nights * listing.price_per_night;
    const total = subtotal + Math.round(subtotal * 0.1);

    const { data: booking, error: bErr } = await admin.from("bookings").insert({
      listing_id, user_id: user.id, check_in, check_out, guests: g, total_price: total, status: "pending",
    }).select().single();
    if (bErr) return json({ error: bErr.message }, 500);

    const p = new URLSearchParams();
    p.set("mode", "payment");
    p.set("success_url", `${origin}/trips?success=1&booking=${booking.id}`);
    p.set("cancel_url", `${origin}/trips?canceled=1`);
    p.set("client_reference_id", booking.id);
    if (user.email) p.set("customer_email", user.email);
    p.set("metadata[booking_id]", booking.id);
    p.set("line_items[0][quantity]", "1");
    p.set("line_items[0][price_data][currency]", "usd");
    p.set("line_items[0][price_data][unit_amount]", String(total * 100));
    p.set("line_items[0][price_data][product_data][name]", listing.title);
    p.set("line_items[0][price_data][product_data][description]",
      `${nights} night${nights > 1 ? "s" : ""} · ${check_in} to ${check_out} · ${g} guest${g > 1 ? "s" : ""} (incl. 10% service fee)`);
    if (listing.images?.[0]) p.set("line_items[0][price_data][product_data][images][0]", listing.images[0]);

    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: { Authorization: `Bearer ${stripeKey}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: p,
    });
    const session = await res.json();
    if (!res.ok) {
      await admin.from("bookings").update({ status: "cancelled" }).eq("id", booking.id);
      return json({ error: session?.error?.message ?? "Stripe error" }, 502);
    }
    await admin.from("bookings").update({ stripe_session_id: session.id }).eq("id", booking.id);
    return json({ url: session.url });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
