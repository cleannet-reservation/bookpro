import { useState, useEffect } from "react";

const C = {
  navy: "#0A1628", navyMid: "#112240", navyLt: "#1D3461",
  cyan: "#00D4FF", white: "#F0F6FF", muted: "#8899BB",
  border: "#1D3461", green: "#00E5A0",
};

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: "15€/mois",
    priceId: "price_1TrldQ2fqq0knYo0XhiceHkE",
    features: ["Réservation en ligne", "Acompte Stripe", "Notifications WhatsApp", "Tableau de bord"],
  },
  {
    id: "pro",
    name: "Pro",
    price: "30€/mois",
    priceId: "price_1TrmUA2fqq0knYo06JJ5oM7R",
    features: ["Tout le Starter", "Google Agenda", "Pipeline Kanban", "Rappels automatiques", "Upsells"],
    recommended: true,
  },
];

const inputStyle = {
  width: "100%", background: "#0A1628", border: "1.5px solid #1D3461",
  borderRadius: 8, padding: "11px 14px", fontSize: 14, color: "#F0F6FF",
  outline: "none", fontFamily: "inherit", boxSizing: "border-box",
};

function SuccessPage() {
  const [status, setStatus] = useState("loading");
  const [slug, setSlug] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    const slugParam = params.get("slug");
    setSlug(slugParam || "");
    if (!sessionId) { setStatus("error"); return; }
    fetch("/api/subscription-success", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId }),
    })
      .then(r => r.json())
      .then(data => setStatus(data.success ? "success" : "error"))
      .catch(() => setStatus("error"));
  }, []);

  if (status === "loading") return (
    <div style={{ minHeight: "100vh", background: C.navy, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter,sans-serif" }}>
      <div style={{ textAlign: "center", color: C.white }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
        <p>Activation de votre compte...</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: C.navy, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter,sans-serif", padding: 24 }}>
      <div style={{ background: C.navyMid, border: `1px solid ${C.border}`, borderRadius: 20, padding: "40px 36px", maxWidth: 460, width: "100%", textAlign: "center" }}>
        {status === "success" ? (
          <>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: C.white, margin: "0 0 12px" }}>Compte activé !</h1>
            <p style={{ fontSize: 15, color: C.muted, lineHeight: 1.7, marginBottom: 28 }}>Votre abonnement BookPro est actif.<br/>Votre page de réservation est prête !</p>
            <div style={{ background: C.navy, border: `1.5px solid ${C.cyan}`, borderRadius: 12, padding: "16px 20px", marginBottom: 28 }}>
              <div style={{ fontSize: 12, color: C.cyan, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Votre lien de réservation</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.white, wordBreak: "break-all" }}>{window.location.origin}/booking/{slug}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <a href={`/booking/${slug}`} style={{ display: "block", background: C.cyan, color: C.navy, textDecoration: "none", borderRadius: 10, padding: "13px", fontWeight: 800, fontSize: 15 }}>Voir ma page →</a>
              <a href={`/dashboard?slug=${slug}`} style={{ display: "block", background: "transparent", color: C.white, textDecoration: "none", borderRadius: 10, padding: "13px", fontWeight: 700, fontSize: 14, border: `1.5px solid ${C.border}` }}>Accéder à mon tableau de bord</a>
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: C.white, margin: "0 0 8px" }}>Une erreur s'est produite</h1>
            <p style={{ color: C.muted, marginBottom: 20 }}>Contactez-nous si votre paiement a été accepté.</p>
            <a href="/inscription" style={{ color: C.cyan, fontSize: 14 }}>← Retour à l'inscription</a>
          </>
        )}
      </div>
    </div>
  );
}

export default function Signup() {
  const isSuccess = window.location.pathname.includes("/success");
  if (isSuccess) return <SuccessPage />;

  const cancelled = new URLSearchParams(window.location.search).get("cancelled");
  const planFromUrl = new URLSearchParams(window.location.search).get("plan");
  const [plan, setPlan] = useState(planFromUrl === "starter" ? "starter" : "pro");
  const [form, setForm] = useState({ nom: "", entreprise: "", email: "", telephone: "", mot_de_passe: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(cancelled ? "Paiement annulé. Vous pouvez réessayer." : null);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const selectedPlan = PLANS.find(p => p.id === plan);

  const handleSubmit = async () => {
    if (!form.nom || !form.email || !form.mot_de_passe) {
      setError("Veuillez remplir tous les champs obligatoires (*).");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, priceId: selectedPlan.priceId, planName: selectedPlan.name }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Erreur");
      if (data.url) window.location.href = data.url;
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: C.navy, fontFamily: "Inter,system-ui,sans-serif", display: "flex", flexDirection: "column" }}>
      <nav style={{ padding: "16px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 8 }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <span style={{ fontSize: 20, color: C.cyan }}>⬡</span>
          <span style={{ fontWeight: 800, fontSize: 18, color: C.white }}>BookPro</span>
        </a>
      </nav>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ width: "100%", maxWidth: 520 }}>
          <div style={{ background: C.navyMid, border: `1px solid ${C.border}`, borderRadius: 20, padding: "36px" }}>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: C.white, margin: "0 0 4px" }}>Créer mon compte</h1>
            <p style={{ fontSize: 14, color: C.muted, margin: "0 0 24px" }}>14 jours gratuits · Sans engagement</p>

            {/* Plan selector */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: C.muted, display: "block", marginBottom: 10 }}>Choisissez votre formule</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {PLANS.map(p => (
                  <button key={p.id} onClick={() => setPlan(p.id)} style={{
                    border: `2px solid ${plan === p.id ? C.cyan : C.border}`,
                    background: plan === p.id ? C.cyan + "15" : "transparent",
                    borderRadius: 12, padding: "14px 12px", cursor: "pointer", textAlign: "left", position: "relative",
                  }}>
                    {p.recommended && <span style={{ position: "absolute", top: -8, right: 8, background: C.cyan, color: C.navy, fontSize: 9, fontWeight: 800, padding: "2px 8px", borderRadius: 10 }}>RECOMMANDÉ</span>}
                    <div style={{ fontWeight: 800, fontSize: 15, color: C.white, marginBottom: 2 }}>{p.name}</div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: plan === p.id ? C.cyan : C.muted }}>{p.price}</div>
                    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 3 }}>
                      {p.features.map(f => <div key={f} style={{ fontSize: 11, color: plan === p.id ? C.white : C.muted }}>✓ {f}</div>)}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { id: "nom", label: "Votre nom *", ph: "Marie Dupont" },
                { id: "entreprise", label: "Nom de votre entreprise", ph: "CleanPro Nice" },
                { id: "email", label: "Email *", ph: "marie@cleanpro.fr", type: "email" },
                { id: "telephone", label: "WhatsApp", ph: "06 12 34 56 78", type: "tel" },
                { id: "mot_de_passe", label: "Mot de passe *", ph: "••••••••", type: "password" },
              ].map(f => (
                <div key={f.id}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>{f.label}</label>
                  <input type={f.type || "text"} placeholder={f.ph} value={form[f.id]} onChange={e => set(f.id, e.target.value)} style={inputStyle} onKeyDown={e => e.key === "Enter" && handleSubmit()} />
                </div>
              ))}

              {error && <div style={{ background: "#FEF2F2", border: "1.5px solid #FCA5A5", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#DC2626" }}>⚠️ {error}</div>}

              <button onClick={handleSubmit} disabled={loading} style={{ background: loading ? C.muted : C.cyan, color: C.navy, border: "none", borderRadius: 10, padding: "14px", fontSize: 15, fontWeight: 800, cursor: loading ? "not-allowed" : "pointer", marginTop: 4 }}>
                {loading ? "⏳ Redirection vers Stripe..." : `Continuer — ${selectedPlan.price} →`}
              </button>

              <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
                {["🔒 Paiement sécurisé", "✓ Sans engagement", "✓ Annulation en 1 clic"].map(t => (
                  <span key={t} style={{ fontSize: 12, color: C.muted }}>{t}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
