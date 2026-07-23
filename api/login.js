const SUPABASE_URL = (process.env.BOOKPRO_SUPABASE_URL || "").replace(/\/rest\/v1\/?$/, "");
const SUPABASE_KEY = process.env.BOOKPRO_SUPABASE_KEY;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { email, mot_de_passe } = req.body;
  const headers = { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` };

  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/clients?email=eq.${encodeURIComponent(email)}&mot_de_passe=eq.${encodeURIComponent(mot_de_passe)}&select=*`,
    { headers }
  );
  const data = await r.json();
  if (!data?.length) return res.status(401).json({ error: "Email ou mot de passe incorrect" });

  return res.status(200).json({ success: true, client: data[0] });
}
