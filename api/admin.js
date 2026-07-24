const getBase = () => {
  const url = (process.env.SUPABASE_URL || "").replace(/\/rest\/v1\/?$/, "");
  return `${url}/rest/v1`;
};

const headers = () => ({
  "Content-Type": "application/json",
  "apikey": process.env.SUPABASE_ANON_KEY,
  "Authorization": `Bearer ${process.env.SUPABASE_ANON_KEY}`,
});

export default async function handler(req, res) {
  // Vérification mot de passe admin
  const adminPwd = req.headers["x-admin-password"];
  if (adminPwd !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: "Non autorisé" });
  }

  const base = getBase();
  res.setHeader("Cache-Control", "no-store");

  // GET — tous les clients
  if (req.method === "GET") {
    const r = await fetch(`${base}/clients?order=created_at.desc&select=*`, { headers: headers() });
    const clients = await r.json();

    // Stats par client
    const withStats = await Promise.all((Array.isArray(clients) ? clients : []).map(async (c) => {
      const rv = await fetch(`${base}/reservations_clients?slug_client=eq.${c.slug}&select=id,total,statut`, { headers: headers() });
      const reservations = await rv.json();
      const total_resa = Array.isArray(reservations) ? reservations.length : 0;
      const ca = Array.isArray(reservations) ? reservations.filter(r => r.statut !== "annule").reduce((s, r) => s + (parseFloat(r.total) || 0), 0) : 0;
      return { ...c, total_resa, ca };
    }));

    return res.status(200).json(withStats);
  }

  // PATCH — suspendre/activer un client
  if (req.method === "PATCH") {
    const { id, statut } = req.body;
    const r = await fetch(`${base}/clients?id=eq.${id}`, {
      method: "PATCH",
      headers: { ...headers(), "Prefer": "return=representation" },
      body: JSON.stringify({ statut }),
    });
    const data = await r.json();
    return res.status(200).json(data);
  }

  return res.status(405).json({ error: "Method not allowed" });
}
