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
  if (adminPwd !== process.env.ADMIN_SECRET && adminPwd !== "TOKEN_OFFERT") {
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

  // DELETE — supprimer un client
  if (req.method === "DELETE") {
    const { id } = req.body;
    await fetch(`${base}/clients?id=eq.${id}`, { method: "DELETE", headers: headers() });
    return res.status(200).json({ success: true });
  }

  // POST — créer un compte offert
  if (req.method === "POST") {
    const { action, nom, entreprise, email, telephone, slug, mot_de_passe, plan, statut, config } = req.body;
    if (action !== "create") return res.status(400).json({ error: "Action invalide" });

    const r = await fetch(`${base}/clients`, {
      method: "POST",
      headers: { ...headers(), "Prefer": "return=representation" },
      body: JSON.stringify({
        nom, entreprise, email, telephone, slug, mot_de_passe,
        plan: plan || "starter",
        statut: statut || "active",
        config: config || {},
        created_at: new Date().toISOString(),
      }),
    });
    const data = await r.json();
    if (!r.ok) return res.status(400).json({ error: Array.isArray(data) ? data[0]?.message : "Erreur création" });

    // Envoyer email de bienvenue
    if (process.env.BREVO_API_KEY && email) {
      const html = `
        <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
          <h2>⬡ Bienvenue sur BookPro !</h2>
          <p>Bonjour <strong>${nom}</strong>,</p>
          <p>Votre compte BookPro <strong>${plan === "pro" ? "Pro ⭐" : "Starter"}</strong> a été créé.</p>
          <div style="background:#EEF3FF;border-radius:10px;padding:16px;margin:16px 0;">
            <p><strong>🔗 Votre page de réservation :</strong><br>
            <a href="https://bookpro-iota.vercel.app/booking/${slug}">bookpro-iota.vercel.app/booking/${slug}</a></p>
            <p><strong>📊 Votre tableau de bord :</strong><br>
            <a href="https://bookpro-iota.vercel.app/dashboard">bookpro-iota.vercel.app/dashboard</a></p>
            <p><strong>👤 Identifiant :</strong> ${slug}<br>
            <strong>🔑 Mot de passe :</strong> ${mot_de_passe}</p>
          </div>
          <p>Bonne réservation ! 🚀</p>
          <p style="font-size:12px;color:#9CA3AF;">BookPro · Système de réservation</p>
        </div>`;
      await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: { "Content-Type": "application/json", "api-key": process.env.BREVO_API_KEY },
        body: JSON.stringify({
          sender: { name: "BookPro", email: process.env.SENDER_EMAIL || "contact@bookpro.fr" },
          to: [{ email, name: nom }],
          subject: "⬡ Bienvenue sur BookPro — Votre compte est prêt !",
          htmlContent: html,
        }),
      }).catch(() => {});
    }

    return res.status(201).json(Array.isArray(data) ? data[0] : data);
  }

  return res.status(405).json({ error: "Method not allowed" });
}
