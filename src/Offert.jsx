import { useState, useEffect } from "react";

const C = { navy: "#0A1628", cyan: "#00D4FF", white: "#F0F6FF", muted: "#8899BB" };

export default function Offert() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token") || "";
  const planFromUrl = params.get("plan") || "starter";

  const [tokenData, setTokenData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ nom: "", entreprise: "", email: "", telephone: "", slug: "", mot_de_passe: "", confirm: "" });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) { setError("Lien invalide — token manquant."); setLoading(false); return; }
    fetch(`/api/tokens?token=${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          // Si Supabase échoue, utiliser le plan depuis l'URL
          setTokenData({ plan: planFromUrl });
          return;
        }
        setTokenData(data);
      })
      .catch(() => setTokenData({ plan: planFromUrl }))
      .finally(() => setLoading(false));
  }, [token]);

  // Auto-générer le slug depuis l'entreprise
  const handleEntreprise = (val) => {
    setForm(p => ({
      ...p,
      entreprise: val,
      slug: val.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "")
    }));
  };

  const handleSubmit = async () => {
    if (!form.nom || !form.email || !form.slug || !form.mot_de_passe) { setError("Remplissez tous les champs obligatoires"); return; }
    if (form.mot_de_passe !== form.confirm) { setError("Les mots de passe ne correspondent pas"); return; }
    if (form.mot_de_passe.length < 6) { setError("Mot de passe minimum 6 caractères"); return; }
    setSubmitting(true); setError(null);
    try {
      // Créer le compte
      const r = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": "TOKEN_OFFERT" },
        body: JSON.stringify({
          action: "create",
          nom: form.nom,
          entreprise: form.entreprise || form.nom,
          email: form.email,
          telephone: form.telephone,
          slug: form.slug,
          mot_de_passe: form.mot_de_passe,
          plan: tokenData?.plan || "starter",
          statut: "active",
        }),
      });
      const data = await r.json();
      if (!r.ok) { setError(data.error || "Erreur lors de la création"); return; }
      // Marquer le token comme utilisé
      await fetch("/api/tokens", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
      setDone(true);
    } catch(e) { setError("Erreur de connexion"); }
    finally { setSubmitting(false); }
  };

  const planLabel = tokenData?.plan === "pro" ? "⭐ Pro 30€/mois" : "⚡ Starter 15€/mois";

  if (loading) return (
    <div style={{ minHeight: "100vh", background: C.navy, display: "flex", alignItems: "center", justifyContent: "center", color: C.white, fontFamily: "Inter,sans-serif" }}>
      ⏳ Vérification du lien...
    </div>
  );

  if (done) return (
    <div style={{ minHeight: "100vh", background: C.navy, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter,sans-serif", padding: 20 }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: "40px 32px", maxWidth: 460, width: "100%", textAlign: "center" }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>🎉</div>
        <h2 style={{ fontSize: 22, fontWeight: 900, margin: "0 0 12px", color: "#1A1F36" }}>Votre compte est prêt !</h2>
        <p style={{ color: "#6B7280", fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>
          Bienvenue sur BookPro ! Vous recevrez un email de confirmation sous peu.
        </p>
        <div style={{ background: "#EEF3FF", borderRadius: 12, padding: "16px", marginBottom: 20, textAlign: "left", fontSize: 13 }}>
          <div style={{ marginBottom: 8 }}>🔗 <strong>Votre page :</strong><br/>
            <a href={`/booking/${form.slug}`} style={{ color: "#0057FF" }}>bookpro-iota.vercel.app/booking/{form.slug}</a>
          </div>
          <div style={{ marginBottom: 8 }}>📊 <strong>Tableau de bord :</strong><br/>
            <a href="/dashboard" style={{ color: "#0057FF" }}>bookpro-iota.vercel.app/dashboard</a>
          </div>
          <div>👤 <strong>Identifiant :</strong> {form.slug}</div>
        </div>
        <a href="/dashboard" style={{ display: "block", background: "#0057FF", color: "#fff", textDecoration: "none", borderRadius: 10, padding: "13px", fontWeight: 800, fontSize: 15 }}>
          Accéder à mon tableau de bord →
        </a>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: C.navy, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter,sans-serif", padding: 20 }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: "36px 32px", maxWidth: 460, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#0057FF", marginBottom: 4 }}>⬡ BookPro</div>
          {tokenData && (
            <div style={{ display: "inline-block", background: tokenData.plan === "pro" ? "#7C3AED15" : "#0057FF15", color: tokenData.plan === "pro" ? "#7C3AED" : "#0057FF", fontSize: 13, fontWeight: 700, padding: "4px 14px", borderRadius: 20, marginBottom: 8 }}>
              🎁 Compte offert — {planLabel}
            </div>
          )}
          <h2 style={{ fontSize: 20, fontWeight: 900, margin: "8px 0 4px", color: "#1A1F36" }}>Créez votre compte</h2>
          <p style={{ fontSize: 13, color: "#6B7280", margin: 0 }}>Votre page de réservation sera prête en 2 minutes</p>
        </div>

        {error && <div style={{ background: "#FEF2F2", border: "1.5px solid #FCA5A5", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#DC2626", fontWeight: 600, marginBottom: 16 }}>⚠️ {error}</div>}

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            { label: "Votre nom *", key: "nom", ph: "Marie Dupont" },
            { label: "Nom de votre entreprise", key: "entreprise", ph: "CleanPro Nice", onChange: handleEntreprise },
            { label: "Email *", key: "email", ph: "marie@exemple.fr", type: "email" },
            { label: "Téléphone", key: "telephone", ph: "06 12 34 56 78" },
          ].map(f => (
            <div key={f.key}>
              <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 4 }}>{f.label}</label>
              <input type={f.type || "text"} value={form[f.key]} placeholder={f.ph}
                onChange={e => f.onChange ? f.onChange(e.target.value) : setForm(p => ({ ...p, [f.key]: e.target.value }))}
                style={{ border: "1.5px solid #E5E7EB", borderRadius: 8, padding: "10px 12px", fontSize: 15, width: "100%", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
            </div>
          ))}

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 4 }}>Identifiant unique *</label>
            <input value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") }))}
              placeholder="cleanpro-nice"
              style={{ border: "1.5px solid #E5E7EB", borderRadius: 8, padding: "10px 12px", fontSize: 15, width: "100%", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
            {form.slug && <p style={{ fontSize: 11, color: "#6B7280", margin: "4px 0 0" }}>🔗 Votre page : bookpro-iota.vercel.app/booking/{form.slug}</p>}
          </div>

          {[
            { label: "Mot de passe * (min. 6 caractères)", key: "mot_de_passe", ph: "••••••••" },
            { label: "Confirmer le mot de passe *", key: "confirm", ph: "••••••••" },
          ].map(f => (
            <div key={f.key}>
              <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 4 }}>{f.label}</label>
              <input type="password" value={form[f.key]} placeholder={f.ph}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                style={{ border: "1.5px solid #E5E7EB", borderRadius: 8, padding: "10px 12px", fontSize: 15, width: "100%", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
            </div>
          ))}

          <button onClick={handleSubmit} disabled={submitting}
            style={{ background: submitting ? "#E5E7EB" : "#0057FF", color: submitting ? "#9CA3AF" : "#fff", border: "none", borderRadius: 10, padding: "14px", fontSize: 15, fontWeight: 800, cursor: submitting ? "not-allowed" : "pointer", marginTop: 4 }}>
            {submitting ? "⏳ Création..." : "Créer mon compte →"}
          </button>

          <p style={{ fontSize: 11, color: "#9CA3AF", textAlign: "center", margin: 0 }}>
            ⬡ BookPro · Compte offert · Sans engagement
          </p>
        </div>
      </div>
    </div>
  );
}
