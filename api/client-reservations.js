const getBase = () => {
  const url = (process.env.SUPABASE_URL || "").replace(/\/rest\/v1\/?$/, "");
  return `${url}/rest/v1/reservations_clients`;
};

const getClientsBase = () => {
  const url = (process.env.SUPABASE_URL || "").replace(/\/rest\/v1\/?$/, "");
  return `${url}/rest/v1/clients`;
};

const headers = () => ({
  "Content-Type": "application/json",
  "apikey": process.env.SUPABASE_ANON_KEY,
  "Authorization": `Bearer ${process.env.SUPABASE_ANON_KEY}`,
});

const sendEmail = async (to, toName, subject, html, senderName, senderEmail) => {
  if (!process.env.BREVO_API_KEY) return;
  await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "Content-Type": "application/json", "api-key": process.env.BREVO_API_KEY },
    body: JSON.stringify({
      sender: { name: senderName, email: senderEmail || process.env.SENDER_EMAIL },
      to: [{ email: to, name: toName }],
      subject, htmlContent: html,
    }),
  }).catch(e => console.error("Email error:", e.message));
};

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const base = getBase();

  if (req.method === "GET") {
    const { slug } = req.query;
    if (!slug) return res.status(400).json({ error: "slug required" });
    const r = await fetch(`${base}?slug_client=eq.${slug}&order=created_at.desc`, { headers: headers() });
    const data = await r.json();
    return res.status(200).json(Array.isArray(data) ? data : []);
  }

  if (req.method === "POST") {
    const r = await fetch(base, {
      method: "POST",
      headers: { ...headers(), "Prefer": "return=representation" },
      body: JSON.stringify(req.body),
    });
    const data = await r.json();

    // Notification email Pro
    const { slug_client, prenom, nom, email, telephone, adresse, service, option, date, creneau, total } = req.body;
    if (slug_client) {
      try {
        // Récupérer le client Pro
        const cr = await fetch(`${getClientsBase()}?slug=eq.${slug_client}&select=*`, { headers: headers() });
        const clients = await cr.json();
        const client = Array.isArray(clients) ? clients[0] : null;

        if (client && client.plan === "pro") {
          const config = client.config || {};
          const company = config.company || {};
          const ownerEmail = company.email || client.email;
          const companyName = company.name || client.entreprise;
          const senderEmail = process.env.SENDER_EMAIL || "contact@bookpro.fr";

          if (ownerEmail) {
            const html = `
              <div style="font-family:Inter,system-ui,sans-serif;max-width:600px;margin:0 auto;background:#F7F8FC;padding:24px;">
                <div style="background:#0057FF;color:#fff;padding:20px 24px;border-radius:12px 12px 0 0;">
                  <h1 style="margin:0;font-size:20px;">🎉 Nouvelle réservation !</h1>
                  <p style="margin:6px 0 0;opacity:0.85;font-size:14px;">${companyName}</p>
                </div>
                <div style="background:#fff;padding:24px;border-radius:0 0 12px 12px;">
                  <div style="border:1.5px solid #E5E7EB;border-radius:10px;padding:16px 20px;margin-bottom:16px;">
                    <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
                      <strong style="font-size:16px;color:#1A1F36;">${prenom} ${nom}</strong>
                      <span style="color:#0057FF;font-weight:700;font-size:15px;">${creneau||""}</span>
                    </div>
                    <table style="width:100%;border-collapse:collapse;font-size:14px;">
                      <tr><td style="padding:5px 0;color:#6B7280;width:120px;">Service</td><td style="font-weight:700;">${service} — ${option||""}</td></tr>
                      <tr><td style="padding:5px 0;color:#6B7280;">Date</td><td style="font-weight:700;">${date}</td></tr>
                      <tr><td style="padding:5px 0;color:#6B7280;">Téléphone</td><td style="font-weight:700;">${telephone||""}</td></tr>
                      <tr><td style="padding:5px 0;color:#6B7280;">Email</td><td style="font-weight:700;">${email||""}</td></tr>
                      <tr><td style="padding:5px 0;color:#6B7280;">Adresse</td><td style="font-weight:700;">${adresse||""}</td></tr>
                      <tr><td style="padding:5px 0;color:#6B7280;">Total</td><td style="font-weight:800;color:#0057FF;">${total||""}€</td></tr>
                    </table>
                  </div>
                  <a href="${process.env.VERCEL_URL||"https://bookpro-landing.vercel.app"}/dashboard?slug=${slug_client}" style="display:block;background:#0057FF;color:#fff;text-decoration:none;borderRadius:10px;padding:13px;font-weight:800;font-size:14px;text-align:center;border-radius:10px;">
                    Voir dans mon tableau de bord →
                  </a>
                  <p style="font-size:12px;color:#9CA3AF;text-align:center;margin-top:16px;">${companyName} · Propulsé par BookPro</p>
                </div>
              </div>`;

            await sendEmail(
              ownerEmail,
              companyName,
              `🎉 Nouvelle réservation — ${prenom} ${nom} · ${date}`,
              html,
              companyName,
              senderEmail
            );
          }
        }
      } catch (e) {
        console.error("Notification error:", e.message);
      }
    }

    return res.status(201).json(data);
  }

  if (req.method === "PATCH") {
    const { id, ...updates } = req.body;
    const r = await fetch(`${base}?id=eq.${id}`, {
      method: "PATCH",
      headers: { ...headers(), "Prefer": "return=representation" },
      body: JSON.stringify(updates),
    });
    const data = await r.json();
    return res.status(200).json(data);
  }

  if (req.method === "DELETE") {
    const { id } = req.body;
    await fetch(`${base}?id=eq.${id}`, { method: "DELETE", headers: headers() });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
