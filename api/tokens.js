const getBase = () => (process.env.SUPABASE_URL || "").replace(/\/rest\/v1\/?$/, "");
const headers = () => ({
  "Content-Type": "application/json",
  "apikey": process.env.SUPABASE_ANON_KEY,
  "Authorization": `Bearer ${process.env.SUPABASE_ANON_KEY}`,
});

export default async function handler(req, res) {
  const base = getBase();

  // GET — vérifier un token
  if (req.method === "GET") {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: "Token manquant" });
    const r = await fetch(`${base}/rest/v1/tokens?token=eq.${token}&used=eq.false&select=*`, { headers: headers() });
    const data = await r.json();
    if (!Array.isArray(data) || data.length === 0) return res.status(404).json({ error: "Token invalide ou déjà utilisé" });
    return res.status(200).json(data[0]);
  }

  // POST — créer un token (Super Admin)
  if (req.method === "POST") {
    const { plan } = req.body;
    const token = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
    const r = await fetch(`${base}/rest/v1/tokens`, {
      method: "POST",
      headers: { ...headers(), "Prefer": "return=representation" },
      body: JSON.stringify({ token, plan: plan || "starter", used: false, created_at: new Date().toISOString() }),
    });
    const data = await r.json();
    console.log("Token créé:", JSON.stringify(data));
    return res.status(201).json(Array.isArray(data) ? data[0] : data);
  }

  // PATCH — marquer token comme utilisé
  if (req.method === "PATCH") {
    const { token } = req.body;
    await fetch(`${base}/rest/v1/tokens?token=eq.${token}`, {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify({ used: true }),
    });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
