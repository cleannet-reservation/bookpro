const SUPABASE_URL = process.env.BOOKPRO_SUPABASE_URL?.replace(/\/rest\/v1\/?$/, "");
const SUPABASE_KEY = process.env.BOOKPRO_SUPABASE_KEY;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const headers = {
    "Content-Type": "application/json",
    "apikey": SUPABASE_KEY,
    "Authorization": `Bearer ${SUPABASE_KEY}`,
    "Prefer": "return=minimal",
  };

  const r = await fetch(`${SUPABASE_URL}/rest/v1/reservations_clients`, {
    method: "POST",
    headers,
    body: JSON.stringify(req.body),
  });

  if (!r.ok) return res.status(500).json({ error: "Erreur sauvegarde" });
  return res.status(201).json({ success: true });
}
