import Stripe from "stripe";

const getSupabase = () => {
  const url = (process.env.SUPABASE_URL || "").replace(/\/rest\/v1\/?$/, "");
  return { url, key: process.env.SUPABASE_ANON_KEY };
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  if (!process.env.STRIPE_SECRET_KEY) return res.status(500).json({ error: "Stripe not configured" });

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const { nom, entreprise, email, telephone, slug, mot_de_passe, priceId, planName } = req.body;

  try {
    const customer = await stripe.customers.create({
      email, name: entreprise || nom,
      metadata: { slug, telephone, plan: planName || "starter" },
    });

    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ["card"],
      mode: "subscription",
      locale: "fr",
      line_items: [{
        price: priceId || process.env.STRIPE_PRICE_ID || "price_1TrldQ2fqq0knYo0XhiceHkE",
        quantity: 1,
      }],
      success_url: `${req.headers.origin}/inscription/success?session_id={CHECKOUT_SESSION_ID}&slug=${slug}`,
      cancel_url: `${req.headers.origin}/inscription?cancelled=1`,
      metadata: { nom, entreprise, email, telephone, slug, mot_de_passe, plan: planName || "starter" },
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error("Stripe error:", error.message);
    return res.status(500).json({ error: error.message });
  }
}
