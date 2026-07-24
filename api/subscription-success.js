import Stripe from "stripe";

const getBase = () => {
  const url = (process.env.SUPABASE_URL || "").replace(/\/rest\/v1\/?$/, "");
  return `${url}/rest/v1/clients`;
};

const headers = () => ({
  "Content-Type": "application/json",
  "apikey": process.env.SUPABASE_ANON_KEY,
  "Authorization": `Bearer ${process.env.SUPABASE_ANON_KEY}`,
  "Prefer": "return=representation",
});

const defaultConfig = (entreprise, email, telephone) => ({
  company: {
    name: entreprise || "Mon Entreprise",
    tagline: "Nettoyage professionnel à domicile",
    phone: telephone || "",
    email: email,
    zone: "France",
    acomptePercent: 30,
    accentColor: "#0057FF",
  },
  services: [
    {
      id: "canape", icon: "🛋️", name: "Nettoyage Canapé",
      description: "Nettoyage en profondeur, détachage et désodorisation",
      options: [
        { id: "c1", label: "2 places", price: 89, duration: 60 },
        { id: "c2", label: "3 places", price: 109, duration: 90 },
      ],
    },
    {
      id: "matelas", icon: "🛏️", name: "Nettoyage Matelas",
      description: "Assainissement, anti-acariens et désodorisation",
      options: [
        { id: "m1", label: "1 personne", price: 69, duration: 45 },
        { id: "m2", label: "2 personnes", price: 89, duration: 60 },
      ],
    },
  ],
  upsells: [],
  availability: {
    daySchedules: {
      0: { active: false, start: "08:00", end: "18:00" },
      1: { active: true, start: "08:00", end: "18:00" },
      2: { active: true, start: "08:00", end: "18:00" },
      3: { active: true, start: "08:00", end: "18:00" },
      4: { active: true, start: "08:00", end: "18:00" },
      5: { active: true, start: "08:00", end: "18:00" },
      6: { active: false, start: "09:00", end: "13:00" },
    },
    blockedDates: [],
    googleCalendarUrl: "",
  },
});

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const { session_id } = req.body;

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (session.payment_status !== "paid" && session.status !== "complete") {
      return res.status(400).json({ error: "Paiement non confirmé" });
    }

    const { nom, entreprise, email, telephone, slug, mot_de_passe, plan } = session.metadata;
    const planName = (plan || "starter").toLowerCase();

    // Créer le client dans Supabase
    const base = getBase();
    const r = await fetch(base, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        nom, entreprise, email, telephone, slug, mot_de_passe,
        stripe_customer_id: session.customer,
        stripe_subscription_id: session.subscription,
        statut: "active",
        plan: planName,
        config: defaultConfig(entreprise, email, telephone),
      }),
    });

    const data = await r.json();
    const clientData = Array.isArray(data) ? data[0] : data;

    // Envoyer email de bienvenue via Brevo
    if (process.env.BREVO_API_KEY) {
      const bookingUrl = `${req.headers.origin}/booking/${slug}`;
      const dashboardUrl = `${req.headers.origin}/dashboard?slug=${slug}`;

      const welcomeHtml = `
        <div style="font-family:Inter,system-ui,sans-serif;max-width:600px;margin:0 auto;background:#F0F6FF;padding:24px;">
          <div style="background:linear-gradient(135deg,#0A1628 0%,#112240 100%);color:#fff;padding:28px 32px;border-radius:16px 16px 0 0;text-align:center;">
            <div style="font-size:28px;margin-bottom:8px;">⬡</div>
            <h1 style="margin:0;font-size:24px;font-weight:900;letter-spacing:-0.5px;">Bienvenue sur BookPro !</h1>
            <p style="margin:8px 0 0;opacity:0.75;font-size:14px;">Votre système de réservation est prêt</p>
          </div>
          <div style="background:#fff;padding:28px 32px;border-radius:0 0 16px 16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
            <p style="font-size:16px;color:#1A1F36;line-height:1.7;margin:0 0 24px;">
              Bonjour <strong>${nom}</strong> 👋<br><br>
              Votre compte <strong>${entreprise || nom}</strong> est activé et votre page de réservation est en ligne !
            </p>

            <!-- Lien de réservation -->
            <div style="background:#EEF3FF;border:2px solid #00D4FF;border-radius:12px;padding:20px;margin-bottom:20px;text-align:center;">
              <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:1px;">🔗 Votre lien de réservation</p>
              <p style="margin:0 0 14px;font-size:15px;font-weight:700;color:#0A1628;word-break:break-all;">${bookingUrl}</p>
              <a href="${bookingUrl}" style="display:inline-block;background:#00D4FF;color:#0A1628;text-decoration:none;border-radius:8px;padding:10px 20px;font-weight:800;font-size:14px;">Voir ma page →</a>
            </div>

            <!-- Identifiants -->
            <div style="background:#F7F8FC;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
              <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:0.5px;">🔐 Vos identifiants</p>
              <table style="width:100%;border-collapse:collapse;font-size:14px;">
                <tr><td style="padding:5px 0;color:#6B7280;width:140px;">Identifiant</td><td style="font-weight:700;color:#1A1F36;">${slug}</td></tr>
                <tr><td style="padding:5px 0;color:#6B7280;">Mot de passe</td><td style="font-weight:700;color:#1A1F36;">${mot_de_passe}</td></tr>
                <tr><td style="padding:5px 0;color:#6B7280;">Tableau de bord</td><td><a href="${dashboardUrl}" style="color:#00D4FF;font-weight:700;">Accéder →</a></td></tr>
              </table>
            </div>

            <!-- Guide démarrage -->
            <div style="margin-bottom:24px;">
              <p style="font-size:14px;font-weight:700;color:#1A1F36;margin:0 0 12px;">🚀 Pour commencer en 3 étapes :</p>
              ${[
                ["1", "Partagez votre lien", "Envoyez votre URL à vos clients par WhatsApp ou email"],
                ["2", "Configurez vos services", "Connectez-vous au tableau de bord pour personnaliser vos prestations"],
                ["3", "Recevez vos réservations", "Vous serez notifié sur WhatsApp à chaque nouvelle réservation"],
              ].map(([n, title, desc]) => `
                <div style="display:flex;gap:12px;margin-bottom:12px;align-items:flex-start;">
                  <div style="width:28px;height:28px;border-radius:50%;background:#00D4FF;color:#0A1628;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px;flex-shrink:0;">${n}</div>
                  <div><div style="font-weight:700;font-size:14px;color:#1A1F36;">${title}</div><div style="font-size:13px;color:#6B7280;">${desc}</div></div>
                </div>
              `).join("")}
            </div>

            <p style="font-size:14px;color:#6B7280;line-height:1.6;margin:0;">
              Une question ? Répondez à cet email ou contactez-nous sur WhatsApp.<br>
              Nous sommes là pour vous aider ! 💪
            </p>

            <p style="font-size:12px;color:#9CA3AF;text-align:center;margin-top:24px;border-top:1px solid #E5E7EB;padding-top:16px;">
              ⬡ BookPro · Système de réservation pour professionnels<br>
              Abonnement : 15€/mois · <a href="#" style="color:#9CA3AF;">Gérer mon abonnement</a>
            </p>
          </div>
        </div>`;

      // SMS de notification à Mike (propriétaire BookPro)
      const ownerPhone = process.env.OWNER_PHONE || "33612922048";
      const planLabel = planName === "pro" ? "Pro 30€/mois" : "Starter 15€/mois";
      const smsText = `⬡ BookPro\n🎉 Nouveau client !\n\nEntreprise : ${entreprise || nom}\nFormule : ${planLabel}\nEmail : ${email}\n\nPage : bookpro-landing.vercel.app/booking/${slug}`;

      await fetch("https://api.brevo.com/v3/transactionalSMS/sms", {
        method: "POST",
        headers: { "Content-Type": "application/json", "api-key": process.env.BREVO_API_KEY },
        body: JSON.stringify({
          sender: "BookPro",
          recipient: `+${ownerPhone.replace(/\D/g, "")}`,
          content: smsText,
          type: "transactional",
        }),
      }).catch(e => console.error("SMS owner error:", e.message));

      // Email de bienvenue au client
      await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: { "Content-Type": "application/json", "api-key": process.env.BREVO_API_KEY },
        body: JSON.stringify({
          sender: { name: "BookPro", email: process.env.SENDER_EMAIL || "contact@bookpro.fr" },
          to: [{ email, name: nom }],
          subject: `⬡ Bienvenue sur BookPro — Votre page de réservation est prête !`,
          htmlContent: welcomeHtml,
        }),
      }).catch(e => console.error("Email error:", e.message));
    }

    return res.status(200).json({ success: true, slug, client: clientData });
  } catch (error) {
    console.error("Success error:", error.message);
    return res.status(500).json({ error: error.message });
  }
}
