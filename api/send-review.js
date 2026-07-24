export default async function handler(req, res) {
  const supabaseUrl = (process.env.SUPABASE_URL || "").replace(/\/rest\/v1\/?$/, "");
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  const brevoKey = process.env.BREVO_API_KEY;

  if (!supabaseUrl || !supabaseKey || !brevoKey) {
    return res.status(500).json({ error: "Missing configuration" });
  }

  // Chercher les interventions d'aujourd'hui pour tous les clients Pro
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  const headers = {
    "apikey": supabaseKey,
    "Authorization": `Bearer ${supabaseKey}`,
  };

  try {
    // Récupérer tous les clients Pro actifs
    const clientsRes = await fetch(
      `${supabaseUrl}/rest/v1/clients?plan=eq.pro&statut=eq.active&select=*`,
      { headers }
    );
    const clients = await clientsRes.json();

    if (!Array.isArray(clients) || clients.length === 0) {
      return res.status(200).json({ success: true, message: "Aucun client Pro actif", sent: 0 });
    }

    let totalSent = 0;

    for (const client of clients) {
      const config = client.config || {};
      const company = config.company || {};
      const companyName = company.name || client.entreprise;
      const senderName = companyName.slice(0, 11);

      // Réservations d'aujourd'hui pour ce client
      const rvRes = await fetch(
        `${supabaseUrl}/rest/v1/reservations_clients?slug_client=eq.${client.slug}&date=eq.${todayStr}&statut=neq.annule&select=*`,
        { headers }
      );
      const reservations = await rvRes.json();
      if (!Array.isArray(reservations) || reservations.length === 0) continue;

      for (const rv of reservations) {
        if (!rv.telephone) continue;

        let tel = rv.telephone.replace(/\s/g, "").replace(/\./g, "");
        if (tel.startsWith("0")) tel = "+33" + tel.slice(1);
        if (!tel.startsWith("+")) tel = "+33" + tel;

        // URL de la page d'avis BookPro
        const reviewUrl = `https://bookpro-landing.vercel.app/avis/${client.slug}/${rv.id}`;
        const smsText = `${companyName}\nBonjour ${rv.prenom} 😊\nVotre intervention de ce jour s'est bien passée ?\nDonnez-nous une note :\n${reviewUrl}\nMerci ! 🙏`;

        try {
          const smsRes = await fetch("https://api.brevo.com/v3/transactionalSMS/sms", {
            method: "POST",
            headers: { "Content-Type": "application/json", "api-key": brevoKey },
            body: JSON.stringify({ sender: senderName, recipient: tel, content: smsText, type: "transactional", tag: "review-request" }),
          });
          if (smsRes.ok) totalSent++;
        } catch (e) { console.error("SMS review error:", e.message); }
      }
    }

    return res.status(200).json({ success: true, date: todayStr, sent: totalSent });
  } catch (error) {
    console.error("Review error:", error.message);
    return res.status(500).json({ error: error.message });
  }
}
