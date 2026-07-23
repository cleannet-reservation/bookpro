const getBase = () => {
  const url = (process.env.SUPABASE_URL || "").replace(/\/rest\/v1\/?$/, "");
  return `${url}/rest/v1/clients`;
};

const headers = () => ({
  "Content-Type": "application/json",
  "apikey": process.env.SUPABASE_ANON_KEY,
  "Authorization": `Bearer ${process.env.SUPABASE_ANON_KEY}`,
});

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const base = getBase();

  // GET — récupérer un client par slug
  if (req.method === "GET") {
    const { slug } = req.query;
    if (!slug) return res.status(400).json({ error: "slug required" });
    const r = await fetch(`${base}?slug=eq.${slug}&select=*`, { headers: headers() });
    const data = await r.json();
    if (!Array.isArray(data) || data.length === 0) return res.status(404).json({ error: "Client not found" });
    return res.status(200).json(data[0]);
  }

  // POST — créer un nouveau client
  if (req.method === "POST") {
    const { nom, entreprise, email, telephone, mot_de_passe } = req.body;
    if (!nom || !email) return res.status(400).json({ error: "nom et email requis" });

    // Générer un slug unique
    const slug = entreprise
      ? entreprise.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").slice(0, 30)
      : email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "-");

    const config = {
      company: {
        name: entreprise || nom,
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
    };

    const r = await fetch(base, {
      method: "POST",
      headers: { ...headers(), "Prefer": "return=representation" },
      body: JSON.stringify({ nom, entreprise, email, telephone, slug, mot_de_passe, config }),
    });

    const data = await r.json();
    if (!r.ok) return res.status(400).json({ error: data.message || "Erreur création compte" });
    return res.status(201).json(Array.isArray(data) ? data[0] : data);
  }

  // PATCH — mettre à jour la config
  if (req.method === "PATCH") {
    const { slug, ...updates } = req.body;
    const r = await fetch(`${base}?slug=eq.${slug}`, {
      method: "PATCH",
      headers: { ...headers(), "Prefer": "return=representation" },
      body: JSON.stringify(updates),
    });
    const data = await r.json();
    return res.status(200).json(data);
  }

  return res.status(405).json({ error: "Method not allowed" });
}
