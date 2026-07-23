const SUPABASE_URL = process.env.BOOKPRO_SUPABASE_URL?.replace(/\/rest\/v1\/?$/, "");
const SUPABASE_KEY = process.env.BOOKPRO_SUPABASE_KEY;

function slugify(str) {
  return str.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 30);
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { nom, entreprise, email, telephone } = req.body;
  if (!nom || !email || !entreprise) return res.status(400).json({ error: "Champs manquants" });

  const headers = {
    "Content-Type": "application/json",
    "apikey": SUPABASE_KEY,
    "Authorization": `Bearer ${SUPABASE_KEY}`,
    "Prefer": "return=representation",
  };

  // Générer un slug unique
  let slug = slugify(entreprise);
  const check = await fetch(`${SUPABASE_URL}/rest/v1/clients?slug=eq.${slug}`, { headers });
  const existing = await check.json();
  if (existing.length > 0) slug = `${slug}-${Date.now().toString().slice(-4)}`;

  // Config par défaut
  const defaultConfig = {
    company: {
      name: entreprise,
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
          { id: "c3", label: "Canapé d'angle", price: 139, duration: 120 },
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
    },
  };

  // Créer le client
  const r = await fetch(`${SUPABASE_URL}/rest/v1/clients`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      nom, entreprise, email, telephone, slug,
      mot_de_passe: Math.random().toString(36).slice(2, 10),
      statut: "trial",
      config: defaultConfig,
    }),
  });

  const data = await r.json();
  if (!r.ok) return res.status(500).json({ error: data });

  const client = Array.isArray(data) ? data[0] : data;
  return res.status(201).json({
    success: true,
    slug: client.slug,
    bookingUrl: `${req.headers.origin}/booking/${client.slug}`,
    password: client.mot_de_passe,
  });
}
