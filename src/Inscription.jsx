import { useState } from "react";

const C = {
  navy: "#0A1628", navyMid: "#112240", cyan: "#00D4FF",
  white: "#F0F6FF", muted: "#8899BB", border: "#1D3461", green: "#00E5A0",
};

const inp = {
  width: "100%", background: "#0A1628", border: `1.5px solid #1D3461`,
  borderRadius: 8, padding: "11px 14px", fontSize: 14, color: "#F0F6FF",
  outline: "none", fontFamily: "inherit", boxSizing: "border-box",
};

export default function Inscription() {
  const [form, setForm] = useState({ nom: "", entreprise: "", email: "", telephone: "", mot_de_passe: "", confirm: "" });
  const [step, setStep] = useState("form"); // form | success | error
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!form.nom || !form.entreprise || !form.email || !form.mot_de_passe) {
      setError("Veuillez remplir tous les champs obligatoires."); return;
    }
    if (form.mot_de_passe !== form.confirm) {
      setError("Les mots de passe ne correspondent pas."); return;
    }
    if (form.mot_de_passe.length < 6) {
      setError("Le mot de passe doit faire au moins 6 caractères."); return;
    }
    setLoading(true); setError("");
    try {
      const r = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: form.nom, entreprise: form.entreprise,
          email: form.email, telephone: form.telephone,
          mot_de_passe: form.mot_de_passe,
        }),
      });
      const data = await r.json();
      if (!r.ok) { setError(data.error || "Erreur lors de l'inscription."); return; }
      setResult(data);
      setStep("success");
    } catch (_) {
      setError("Erreur réseau. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: C.navy, fontFamily: "'Inter', system-ui, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 480 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <a href="/" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 24, color: C.cyan }}>⬡</span>
            <span style={{ fontWeight: 900, fontSize: 22, color: C.white }}>BookPro</span>
          </a>
        </div>

        <div style={{ background: C.navyMid, border: `1px solid ${C.border}`, borderRadius: 20, padding: "36px 36px" }}>

          {step === "success" ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
              <h2 style={{ color: C.white, fontWeight: 800, fontSize: 24, margin: "0 0 12px" }}>Compte créé !</h2>
              <p style={{ color: C.muted, fontSize: 15, lineHeight: 1.7, marginBottom: 24 }}>
                Votre page de réservation est prête. Partagez ce lien à vos clients :
              </p>
              <div style={{ background: C.navy, border: `1.5px solid ${C.cyan}`, borderRadius: 10, padding: "14px 18px", marginBottom: 20 }}>
                <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>Votre lien de réservation</div>
                <div style={{ fontWeight: 700, color: C.cyan, fontSize: 15, wordBreak: "break-all" }}>
                  {window.location.origin}/booking/{result?.slug}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <button onClick={() => window.location.href = `/booking/${result?.slug}`}
                  style={{ background: C.cyan, color: C.navy, border: "none", borderRadius: 10, padding: 14, fontWeight: 800, fontSize: 15, cursor: "pointer" }}>
                  Voir ma page de réservation →
                </button>
                <button onClick={() => window.location.href = `/dashboard?slug=${result?.slug}`}
                  style={{ background: "transparent", color: C.white, border: `1.5px solid ${C.border}`, borderRadius: 10, padding: 14, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                  Accéder à mon tableau de bord
                </button>
              </div>
            </div>
          ) : (
            <>
              <h1 style={{ color: C.white, fontWeight: 800, fontSize: 24, margin: "0 0 4px" }}>Créer mon compte</h1>
              <p style={{ color: C.muted, fontSize: 14, margin: "0 0 24px" }}>14 jours gratuits · Sans CB · 15€/mois ensuite</p>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {[
                  { id: "nom", label: "Votre nom *", ph: "Marie Dupont" },
                  { id: "entreprise", label: "Nom de votre entreprise *", ph: "CleanPro Nice" },
                  { id: "email", label: "Email *", ph: "marie@cleanpro.fr", type: "email" },
                  { id: "telephone", label: "WhatsApp", ph: "06 12 34 56 78", type: "tel" },
                  { id: "mot_de_passe", label: "Mot de passe *", ph: "Minimum 6 caractères", type: "password" },
                  { id: "confirm", label: "Confirmer le mot de passe *", ph: "Répétez votre mot de passe", type: "password" },
                ].map(f => (
                  <div key={f.id}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: C.muted, display: "block", marginBottom: 5 }}>{f.label}</label>
                    <input type={f.type || "text"} placeholder={f.ph} value={form[f.id]}
                      onChange={e => set(f.id, e.target.value)} style={inp} />
                  </div>
                ))}

                {error && (
                  <div style={{ background: "#FEF2F2", border: "1.5px solid #FCA5A5", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#DC2626" }}>
                    ⚠️ {error}
                  </div>
                )}

                <button onClick={handleSubmit} disabled={loading}
                  style={{ background: loading ? "#1D3461" : C.cyan, color: loading ? C.muted : C.navy, border: "none", borderRadius: 10, padding: 14, fontWeight: 800, fontSize: 15, cursor: loading ? "not-allowed" : "pointer", marginTop: 4 }}>
                  {loading ? "Création en cours…" : "Créer mon compte gratuitement →"}
                </button>

                <p style={{ fontSize: 12, color: C.muted, textAlign: "center", margin: 0 }}>
                  En créant un compte vous acceptez nos conditions d'utilisation.
                </p>
              </div>
            </>
          )}
        </div>

        <p style={{ textAlign: "center", color: C.muted, fontSize: 13, marginTop: 16 }}>
          Déjà un compte ? <a href="/dashboard" style={{ color: C.cyan, fontWeight: 600 }}>Se connecter</a>
        </p>
      </div>
    </div>
  );
}
