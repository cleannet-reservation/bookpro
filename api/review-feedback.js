export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { note, feedback, reservationId, slug } = req.body;
  const brevoKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.SENDER_EMAIL || "contact@bookpro.fr";

  if (!brevoKey) return res.status(500).json({ error: "Brevo not configured" });

  // Récupérer l'email du propriétaire depuis Supabase
  let ownerEmail = senderEmail;
  let companyName = "BookPro";
  if (slug) {
    try {
      const supabaseUrl = (process.env.SUPABASE_URL || "").replace(/\/rest\/v1\/?$/, "");
      const r = await fetch(`${supabaseUrl}/rest/v1/clients?slug=eq.${slug}&select=*`, {
        headers: { "apikey": process.env.SUPABASE_ANON_KEY, "Authorization": `Bearer ${process.env.SUPABASE_ANON_KEY}` }
      });
      const clients = await r.json();
      if (Array.isArray(clients) && clients[0]) {
        const config = clients[0].config || {};
        ownerEmail = config.company?.email || clients[0].email || senderEmail;
        companyName = config.company?.name || clients[0].entreprise || "BookPro";
      }
    } catch(_) {}
  }

  const stars = "⭐".repeat(note) + "☆".repeat(5 - note);
  const html = `
    <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#FEF2F2;padding:24px;border-radius:12px;">
      <h2 style="color:#DC2626;">⚠️ Avis négatif reçu — ${companyName}</h2>
      <div style="font-size:24px;margin:12px 0;">${stars}</div>
      <p style="color:#6B7280;">Note : <strong>${note}/5</strong></p>
      <blockquote style="background:#fff;padding:16px;border-radius:8px;border-left:4px solid #DC2626;font-style:italic;color:#1A1F36;">"${feedback}"</blockquote>
      <p style="font-size:12px;color:#9CA3AF;">Réservation : ${reservationId || "N/A"} · Propulsé par BookPro</p>
    </div>`;

  try {
    await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "Content-Type": "application/json", "api-key": brevoKey },
      body: JSON.stringify({
        sender: { name: "BookPro Avis", email: senderEmail },
        to: [{ email: ownerEmail }],
        subject: `⚠️ Avis négatif ${stars} — ${companyName}`,
        htmlContent: html,
      }),
    });
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
