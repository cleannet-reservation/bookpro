const SUPABASE_URL = process.env.BOOKPRO_SUPABASE_URL?.replace(/\/rest\/v1\/?$/, "");
const SUPABASE_KEY = process.env.BOOKPRO_SUPABASE_KEY;

export default async function handler(req, res) {
  const { slug } = req.query;
  if (!slug) return res.status(400).json({ error: "Slug manquant" });

  const headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": `Bearer ${SUPABASE_KEY}`,
  };

  const r = await fetch(`${SUPABASE_URL}/rest/v1/clients?slug=eq.${slug}&select=*`, { headers });
  const data = await r.json();

  if (!Array.isArray(data) || data.length === 0) {
    return res.status(404).json({ error: "Client introuvable" });
  }

  res.setHeader("Cache-Control", "no-store");
  return res.status(200).json(data[0]);
}
