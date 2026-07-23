const SUPABASE_URL = process.env.BOOKPRO_SUPABASE_URL?.replace(/\/rest\/v1\/?$/, "");
const SUPABASE_KEY = process.env.BOOKPRO_SUPABASE_KEY;

export default async function handler(req, res) {
  if (req.method !== "PATCH") return res.status(405).json({ error: "Method not allowed" });

  const { slug, password, config } = req.body;
  if (!slug || !password) return res.status(400).json({ error: "Données manquantes" });

  const headers = {
    "Content-Type": "application/json",
    "apikey": SUPABASE_KEY,
    "Authorization": `Bearer ${SUPABASE_KEY}`,
    "Prefer": "return=representation",
  };

  // Vérifier le mot de passe
  const check = await fetch(`${SUPABASE_URL}/rest/v1/clients?slug=eq.${slug}&mot_de_passe=eq.${password}`, { headers });
  const clients = await check.json();
  if (!clients.length) return res.status(401).json({ error: "Mot de passe incorrect" });

  // Sauvegarder la config
  const r = await fetch(`${SUPABASE_URL}/rest/v1/clients?slug=eq.${slug}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ config }),
  });

  return res.status(200).json({ success: true });
}
