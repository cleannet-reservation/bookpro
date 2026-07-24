export default async function handler(req, res) {
  const supabaseUrl = (process.env.SUPABASE_URL || "").replace(/\/rest\/v1\/?$/, "");
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  const brevoKey = process.env.BREVO_API_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: "Supabase not configured" });
  }

  // Date de demain
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  const headers = {
    "apikey": supabaseKey,
    "Authorization": `Bearer ${supabaseKey}`,
    "Content-Type": "application/json",
  };

  try {
    // 1. Récupérer tous les clients Pro actifs
    const clientsRes = await fetch(
      `${supabaseUrl}/rest/v1/clients?plan=eq.pro&statut=eq.active&select=*`,
      { headers }
    );
    const clients = await clientsRes.json();

    if (!Array.isArray(clients) || clients.length === 0) {
      return res.status(200).json({ success: true, message: "Aucun client Pro actif", date: tomorrowStr });
    }

    let totalReminders = 0;
    let totalClients = 0;

    // 2. Pour chaque client Pro, chercher les réservations de demain
    for (const client of clients) {
      const rvRes = await fetch(
        `${supabaseUrl}/rest/v1/reservations_clients?slug_client=eq.${client.slug}&date=eq.${tomorrowStr}&statut=neq.annule&select=*`,
        { headers }
      );
      const reservations = await rvRes.json();

      if (!Array.isArray(reservations) || reservations.length === 0) continue;

      const config = client.config || {};
      const company = config.company || {};
      const senderEmail = process.env.SENDER_EMAIL || "contact@bookpro.fr";
      const ownerEmail = company.email || client.email;
      const companyName = company.name || client.entreprise;

      const sendEmail = async (to, toName, subject, html) => {
        if (!brevoKey) return false;
        const r = await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: { "Content-Type": "application/json", "api-key": brevoKey },
          body: JSON.stringify({
            sender: { name: companyName, email: senderEmail },
            to: [{ email: to, name: toName }],
            subject, htmlContent: html,
          }),
        });
        return r.ok;
      };

      const sendSMS = async (telephone, text) => {
        if (!brevoKey || !telephone) return false;
        let tel = telephone.replace(/\s/g, "").replace(/\./g, "");
        if (tel.startsWith("0")) tel = "+33" + tel.slice(1);
        if (!tel.startsWith("+")) tel = "+33" + tel;
        try {
          const r = await fetch("https://api.brevo.com/v3/transactionalSMS/sms", {
            method: "POST",
            headers: { "Content-Type": "application/json", "api-key": brevoKey },
            body: JSON.stringify({ sender: companyName.slice(0, 11), recipient: tel, content: text, type: "transactional" }),
          });
          return r.ok;
        } catch (e) { return false; }
      };

      // Email récap au propriétaire (client Pro)
      if (ownerEmail) {
        const ownerHtml = `
          <div style="font-family:Inter,system-ui,sans-serif;max-width:600px;margin:0 auto;background:#F7F8FC;padding:24px;">
            <div style="background:#0057FF;color:#fff;padding:20px 24px;border-radius:12px 12px 0 0;">
              <h1 style="margin:0;font-size:20px;">📅 Vos rendez-vous de demain</h1>
              <p style="margin:6px 0 0;opacity:0.85;font-size:14px;">${tomorrowStr} — ${reservations.length} intervention(s) · ${companyName}</p>
            </div>
            <div style="background:#fff;padding:24px;border-radius:0 0 12px 12px;">
              ${reservations.map(r => `
                <div style="border:1.5px solid #E5E7EB;border-radius:10px;padding:14px 18px;margin-bottom:14px;">
                  <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
                    <strong style="font-size:15px;color:#1A1F36;">${r.prenom} ${r.nom}</strong>
                    <span style="color:#0057FF;font-weight:700;">${r.creneau || ""}</span>
                  </div>
                  <div style="font-size:13px;color:#6B7280;line-height:1.8;">
                    🧹 ${r.service} — ${r.option || ""}<br/>
                    📍 ${r.adresse || ""}<br/>
                    📞 ${r.telephone || ""}<br/>
                    💶 Total : ${r.total || ""}€
                  </div>
                </div>
              `).join("")}
              <p style="font-size:12px;color:#9CA3AF;text-align:center;margin-top:16px;">
                ${companyName} · Rappel automatique BookPro
              </p>
            </div>
          </div>`;

        await sendEmail(
          ownerEmail,
          companyName,
          `📅 ${reservations.length} rendez-vous demain — ${tomorrowStr} · ${companyName}`,
          ownerHtml
        );
        totalClients++;
      }

      // Email rappel à chaque client final
      for (const r of reservations) {
        if (!r.email) continue;

        const clientHtml = `
          <div style="font-family:Inter,system-ui,sans-serif;max-width:600px;margin:0 auto;background:#F7F8FC;padding:24px;">
            <div style="background:#0057FF;color:#fff;padding:20px 24px;border-radius:12px 12px 0 0;">
              <h1 style="margin:0;font-size:20px;">⏰ Rappel — Votre rendez-vous est demain !</h1>
              <p style="margin:6px 0 0;opacity:0.85;font-size:14px;">${companyName}</p>
            </div>
            <div style="background:#fff;padding:24px;border-radius:0 0 12px 12px;">
              <p style="font-size:15px;color:#1A1F36;line-height:1.7;">
                Bonjour <strong>${r.prenom}</strong>,<br><br>
                Nous vous rappelons votre rendez-vous prévu <strong>demain</strong> :
              </p>
              <div style="background:#EEF3FF;border:1.5px solid #0057FF;border-radius:10px;padding:16px 20px;margin:16px 0;">
                <table style="width:100%;border-collapse:collapse;font-size:14px;">
                  <tr><td style="padding:6px 0;color:#6B7280;width:120px;">Service</td><td style="font-weight:700;color:#1A1F36;">${r.service} — ${r.option || ""}</td></tr>
                  <tr><td style="padding:6px 0;color:#6B7280;">Date</td><td style="font-weight:700;color:#1A1F36;">${r.date}</td></tr>
                  <tr><td style="padding:6px 0;color:#6B7280;">Créneau</td><td style="font-weight:700;color:#1A1F36;">${r.creneau || ""}</td></tr>
                  <tr><td style="padding:6px 0;color:#6B7280;">Adresse</td><td style="font-weight:700;color:#1A1F36;">${r.adresse || ""}</td></tr>
                </table>
              </div>
              <p style="font-size:14px;color:#6B7280;line-height:1.6;">
                Une question ? Contactez-nous :<br>
                📞 <strong>${company.phone || ""}</strong>
              </p>
              <p style="font-size:12px;color:#9CA3AF;text-align:center;margin-top:20px;">
                ${companyName} · Powered by BookPro
              </p>
            </div>
          </div>`;

        await sendEmail(
          r.email,
          `${r.prenom} ${r.nom}`,
          `⏰ Rappel — Votre rendez-vous ${companyName} est demain à ${r.creneau || ""}`,
          clientHtml
        );

        // SMS rappel au client final
        if (r.telephone) {
          const smsText = `${companyName}\n⏰ Rappel rdv demain !\n🧹 ${r.service}\n📅 ${r.date} à ${r.creneau?.split(" → ")[0] || ""}\n📍 ${r.adresse || ""}\n📞 ${company.phone || ""}`;
          await sendSMS(r.telephone, smsText);
        }

        totalReminders++;
      }
    }

    return res.status(200).json({
      success: true,
      date: tomorrowStr,
      clientsPro: totalClients,
      remindersEnvoyes: totalReminders,
    });

  } catch (error) {
    console.error("Reminder error:", error.message);
    return res.status(500).json({ error: error.message });
  }
}
