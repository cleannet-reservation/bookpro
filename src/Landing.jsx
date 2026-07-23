import { useState, useEffect, useRef } from "react";

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
// Deep navy + electric cyan + warm white — clean B2B SaaS feel
// Signature: animated booking preview card that floats in the hero

const C = {
  navy:    "#0A1628",
  navyMid: "#112240",
  navyLt:  "#1D3461",
  cyan:    "#00D4FF",
  cyanDim: "#00A8CC",
  white:   "#F0F6FF",
  muted:   "#8899BB",
  border:  "#1D3461",
  green:   "#00E5A0",
  orange:  "#FF6B35",
};

// ─── DATA ─────────────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: "📅",
    title: "Réservation en ligne 24h/24",
    desc: "Vos clients réservent directement depuis votre page, même quand vous dormez.",
  },
  {
    icon: "💳",
    title: "Acompte Stripe intégré",
    desc: "Bloquez les créneaux avec un acompte de 30%. Zéro impayé, zéro no-show.",
  },
  {
    icon: "📲",
    title: "Alerte WhatsApp instantanée",
    desc: "Chaque réservation vous est envoyée sur WhatsApp avec tous les détails.",
  },
  {
    icon: "🗓️",
    title: "Sync Google Agenda",
    desc: "Les rendez-vous s'ajoutent automatiquement dans votre agenda Google.",
  },
  {
    icon: "⏰",
    title: "Rappels automatiques",
    desc: "Un email de rappel envoyé au client 24h avant. Fini les oublis.",
  },
  {
    icon: "📊",
    title: "Pipeline commercial",
    desc: "Suivez vos devis et contrats dans un tableau Kanban visuel.",
  },
];

const STEPS = [
  { n: "1", title: "Créez votre compte", desc: "Inscription en 2 minutes. Votre page de réservation est prête immédiatement." },
  { n: "2", title: "Configurez vos services", desc: "Ajoutez vos prestations, prix, durées et disponibilités depuis votre admin." },
  { n: "3", title: "Partagez votre lien", desc: "Envoyez votre URL à vos clients. Ils réservent, vous recevez l'alerte WhatsApp." },
];

const TESTIMONIALS = [
  {
    name: "Sophie M.",
    role: "Nettoyage résidentiel, Nice",
    text: "J'ai arrêté de répondre aux messages WhatsApp pour prendre des rdv. Mes clients réservent seuls, je reçois juste la notification.",
    stars: 5,
  },
  {
    name: "Karim B.",
    role: "Nettoyage auto, Antibes",
    text: "L'acompte Stripe a changé ma vie. Plus un seul no-show depuis que je l'ai mis en place.",
    stars: 5,
  },
  {
    name: "Marie-Claire D.",
    role: "Entreprise de nettoyage, Cannes",
    text: "Mon agenda Google se remplit tout seul. Je n'ai plus à faire la saisie manuelle.",
    stars: 5,
  },
];

const FAQS = [
  { q: "Est-ce que je dois avoir des connaissances techniques ?", a: "Non. Tout se configure depuis un panneau admin visuel. Aucune ligne de code à écrire." },
  { q: "Combien de temps pour être opérationnel ?", a: "Moins de 30 minutes. Vous créez votre compte, configurez vos services et partagez votre lien." },
  { q: "Et si j'ai besoin d'aide ?", a: "Un support par WhatsApp est inclus. Vous répondez à vos clients, on s'occupe de vous." },
  { q: "Puis-je annuler quand je veux ?", a: "Oui. Aucun engagement. Vous annulez en un clic depuis votre espace client." },
  { q: "Stripe prend-il une commission ?", a: "Stripe prélève ~1,5% + 0,25€ par transaction. C'est prélevé directement sur l'acompte, sans frais supplémentaire de notre part." },
];

// ─── COMPONENTS ───────────────────────────────────────────────────────────────
function Star() {
  return <span style={{ color: "#FFD700", fontSize: 14 }}>★</span>;
}

function FloatingCard() {
  const [step, setStep] = useState(0);
  const steps = [
    { label: "Service sélectionné", value: "🛋️ Nettoyage Canapé — 3 places", done: true },
    { label: "Créneau choisi", value: "Mardi 15 juillet · 09:00 → 10:30", done: true },
    { label: "Acompte réglé", value: "32,70 € via Stripe ✓", done: step >= 1 },
    { label: "WhatsApp envoyé", value: "Notification reçue 🔔", done: step >= 2 },
    { label: "Agenda mis à jour", value: "Google Agenda synchronisé 📅", done: step >= 3 },
  ];

  useEffect(() => {
    const t = setInterval(() => setStep(s => (s + 1) % 4), 1800);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{
      background: C.navyMid, border: `1px solid ${C.border}`,
      borderRadius: 16, padding: "20px 24px", width: 320,
      boxShadow: `0 0 60px ${C.cyan}22, 0 20px 60px rgba(0,0,0,0.4)`,
    }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: C.cyan, letterSpacing: 2, marginBottom: 14, textTransform: "uppercase" }}>
        Réservation en cours…
      </div>
      {steps.map((s, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, opacity: s.done ? 1 : 0.3, transition: "opacity 0.4s" }}>
          <div style={{
            width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
            background: s.done ? C.green : C.border,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 10, color: C.navy, fontWeight: 800, transition: "background 0.4s",
          }}>
            {s.done ? "✓" : ""}
          </div>
          <div>
            <div style={{ fontSize: 11, color: C.muted }}>{s.label}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.white }}>{s.value}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function NavBar({ onCTA }) {
  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      background: `${C.navy}EE`, backdropFilter: "blur(12px)",
      borderBottom: `1px solid ${C.border}`,
      padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 20, color: C.cyan }}>⬡</span>
        <span style={{ fontWeight: 800, fontSize: 18, color: C.white, letterSpacing: "-0.5px" }}>BookPro</span>
      </div>
      <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
        {["Fonctionnalités", "Tarifs", "FAQ"].map(l => (
          <a key={l} href={`#${l.toLowerCase()}`} style={{ color: C.muted, fontSize: 14, textDecoration: "none", fontWeight: 500 }}>{l}</a>
        ))}
        <button onClick={() => window.location.href="/inscription"} style={{
          background: C.cyan, color: C.navy, border: "none",
          borderRadius: 8, padding: "9px 18px", fontWeight: 800, fontSize: 14, cursor: "pointer",
        }}>
          Démarrer →
        </button>
      </div>
    </nav>
  );
}

function Section({ id, children, style = {} }) {
  return (
    <section id={id} style={{ padding: "80px 24px", maxWidth: 1100, margin: "0 auto", ...style }}>
      {children}
    </section>
  );
}

function Badge({ children }) {
  return (
    <div style={{
      display: "inline-block", background: `${C.cyan}15`, color: C.cyan,
      border: `1px solid ${C.cyan}33`, borderRadius: 20,
      padding: "5px 14px", fontSize: 12, fontWeight: 700,
      letterSpacing: 1, textTransform: "uppercase", marginBottom: 16,
    }}>
      {children}
    </div>
  );
}

function Heading({ children, size = 42, style = {} }) {
  return (
    <h2 style={{
      fontSize: size, fontWeight: 900, color: C.white,
      letterSpacing: "-1px", lineHeight: 1.1, margin: "0 0 16px",
      ...style,
    }}>
      {children}
    </h2>
  );
}

function CTAButton({ children, onClick, variant = "primary", style = {} }) {
  const base = {
    border: "none", borderRadius: 10, padding: "15px 28px",
    fontSize: 15, fontWeight: 800, cursor: "pointer",
    transition: "all 0.15s", ...style,
  };
  if (variant === "primary") return (
    <button onClick={onClick} style={{ ...base, background: C.cyan, color: C.navy }}>
      {children}
    </button>
  );
  return (
    <button onClick={onClick} style={{ ...base, background: "transparent", color: C.white, border: `1.5px solid ${C.border}` }}>
      {children}
    </button>
  );
}

// ─── MODAL ────────────────────────────────────────────────────────────────────
function SignupModal({ onClose }) {
  const [form, setForm] = useState({ nom: "", email: "", tel: "", entreprise: "" });
  const [sent, setSent] = useState(false);

  const handleSubmit = () => {
    if (!form.nom || !form.email) return;
    setSent(true);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 200,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
      backdropFilter: "blur(4px)",
    }}>
      <div style={{
        background: C.navyMid, border: `1px solid ${C.border}`,
        borderRadius: 20, width: "100%", maxWidth: 460,
        boxShadow: `0 0 80px ${C.cyan}22`,
      }}>
        <div style={{ padding: "28px 32px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 22, color: C.white }}>Créer mon compte</div>
              <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>Starter 15€ · Pro 30€ · Sans engagement</div>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", color: C.muted, fontSize: 22, cursor: "pointer" }}>✕</button>
          </div>

          {sent ? (
            <div style={{ textAlign: "center", padding: "32px 0 40px" }}>
              <div style={{ fontSize: 52, marginBottom: 12 }}>🎉</div>
              <div style={{ fontWeight: 800, fontSize: 20, color: C.white, marginBottom: 8 }}>Demande reçue !</div>
              <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.7 }}>
                Nous vous contactons sous 24h pour configurer votre page de réservation.
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14, paddingBottom: 28 }}>
              {[
                { id: "nom", label: "Votre nom", ph: "Marie Dupont" },
                { id: "entreprise", label: "Nom de votre entreprise", ph: "CleanPro Nice" },
                { id: "email", label: "Email", ph: "marie@cleanpro.fr" },
                { id: "tel", label: "WhatsApp", ph: "06 12 34 56 78" },
              ].map(f => (
                <div key={f.id}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: C.muted, display: "block", marginBottom: 5 }}>{f.label}</label>
                  <input
                    type="text" placeholder={f.ph}
                    value={form[f.id]}
                    onChange={e => setForm(p => ({ ...p, [f.id]: e.target.value }))}
                    style={{
                      width: "100%", background: C.navy, border: `1.5px solid ${C.border}`,
                      borderRadius: 8, padding: "11px 14px", fontSize: 14, color: C.white,
                      outline: "none", fontFamily: "inherit", boxSizing: "border-box",
                    }}
                  />
                </div>
              ))}
              <button onClick={handleSubmit} style={{
                background: C.cyan, color: C.navy, border: "none", borderRadius: 10,
                padding: "14px", fontSize: 15, fontWeight: 800, cursor: "pointer", marginTop: 4,
              }}>
                Démarrer mon essai gratuit 14 jours →
              </button>
              <p style={{ fontSize: 12, color: C.muted, textAlign: "center", margin: 0 }}>
                Sans CB requise · Annulation en 1 clic
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <div style={{ background: C.navy, minHeight: "100vh", fontFamily: "'Inter', system-ui, sans-serif", color: C.white }}>
      <NavBar onCTA={() => window.location.href="/inscription"} />

      {/* ── HERO ── */}
      <div style={{ paddingTop: 100, minHeight: "100vh", display: "flex", alignItems: "center" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "60px 24px", display: "flex", alignItems: "center", gap: 60, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 300 }}>
            <Badge>Spécial entreprises de nettoyage</Badge>
            <Heading size={52}>
              Vos clients réservent.<br />
              <span style={{ color: C.cyan }}>Vous intervenez.</span>
            </Heading>
            <p style={{ fontSize: 18, color: C.muted, lineHeight: 1.7, marginBottom: 32, maxWidth: 480 }}>
              Un système de réservation en ligne complet pour votre entreprise de nettoyage. Acompte Stripe, WhatsApp, Google Agenda — tout automatisé.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <CTAButton onClick={() => window.location.href="/inscription?plan=pro"}>
                Essai gratuit 14 jours →
              </CTAButton>
              <CTAButton variant="secondary" onClick={() => window.location.href="/demo"}>
                Voir la démo
              </CTAButton>
            </div>
            <div style={{ display: "flex", gap: 24, marginTop: 32, flexWrap: "wrap" }}>
              {["✓ Sans engagement", "✓ Sans CB requise", "✓ Opérationnel en 30min"].map(t => (
                <span key={t} style={{ fontSize: 13, color: C.muted, fontWeight: 500 }}>{t}</span>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <FloatingCard />
          </div>
        </div>
      </div>

      {/* ── FEATURES ── */}
      <div style={{ background: C.navyMid, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }} id="fonctionnalités">
        <Section>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <Badge>Fonctionnalités</Badge>
            <Heading>Tout ce dont vous avez besoin,<br />rien de superflu</Heading>
            <p style={{ color: C.muted, fontSize: 16, maxWidth: 500, margin: "0 auto" }}>
              Conçu spécifiquement pour les entreprises de nettoyage. Pas un outil générique.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
            {FEATURES.map(f => (
              <div key={f.title} style={{
                background: C.navy, border: `1px solid ${C.border}`,
                borderRadius: 14, padding: "24px 28px",
                transition: "border-color 0.2s",
              }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>{f.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 16, color: C.white, marginBottom: 8 }}>{f.title}</div>
                <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* ── HOW IT WORKS ── */}
      <Section>
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <Badge>Comment ça marche</Badge>
          <Heading>Opérationnel en 30 minutes</Heading>
        </div>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "center" }}>
          {STEPS.map((s, i) => (
            <div key={i} style={{ flex: 1, minWidth: 240, maxWidth: 320, textAlign: "center" }}>
              <div style={{
                width: 56, height: 56, borderRadius: "50%",
                background: `${C.cyan}15`, border: `2px solid ${C.cyan}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 16px", fontSize: 22, fontWeight: 900, color: C.cyan,
              }}>
                {s.n}
              </div>
              <div style={{ fontWeight: 700, fontSize: 17, color: C.white, marginBottom: 8 }}>{s.title}</div>
              <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.6 }}>{s.desc}</div>
              {i < STEPS.length - 1 && (
                <div style={{ fontSize: 24, color: C.border, margin: "16px 0" }}>↓</div>
              )}
            </div>
          ))}
        </div>
      </Section>

      {/* ── TESTIMONIALS ── */}
      <div style={{ background: C.navyMid, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <Section>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <Badge>Témoignages</Badge>
            <Heading>Ils ont arrêté de gérer<br />leurs rdv à la main</Heading>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
            {TESTIMONIALS.map(t => (
              <div key={t.name} style={{
                background: C.navy, border: `1px solid ${C.border}`,
                borderRadius: 14, padding: "24px 28px",
              }}>
                <div style={{ marginBottom: 12 }}>
                  {Array(t.stars).fill(0).map((_, i) => <Star key={i} />)}
                </div>
                <p style={{ fontSize: 15, color: C.white, lineHeight: 1.7, margin: "0 0 16px", fontStyle: "italic" }}>
                  "{t.text}"
                </p>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.cyan }}>{t.name}</div>
                <div style={{ fontSize: 12, color: C.muted }}>{t.role}</div>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* ── PRICING ── */}
      <Section id="tarifs">
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <Badge>Tarifs</Badge>
          <Heading>Deux formules simples.</Heading>
          <p style={{ color: C.muted, fontSize: 16 }}>Sans surprise, sans commission cachée.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20, maxWidth: 700, margin: "0 auto" }}>

          {/* Starter */}
          <div style={{ background: C.navyMid, border: `1.5px solid ${C.border}`, borderRadius: 20, padding: "32px 32px" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.muted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>Starter</div>
            <div style={{ fontSize: 48, fontWeight: 900, color: C.white, lineHeight: 1 }}>15€</div>
            <div style={{ fontSize: 15, color: C.muted, marginBottom: 24 }}>/mois · sans engagement</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
              {[
                "Page de réservation personnalisée",
                "Gestion des réservations",
                "Modifier vos services et tarifs",
                "Tableau de bord client",
                "14 jours d'essai gratuit",
              ].map(f => (
                <div key={f} style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 14, color: C.white }}>
                  <span style={{ color: C.green, fontWeight: 700 }}>✓</span> {f}
                </div>
              ))}
            </div>
            <CTAButton onClick={() => window.location.href="/inscription?plan=starter"} variant="secondary" style={{ width: "100%", borderColor: C.cyan, color: C.cyan }}>
              Démarrer Starter →
            </CTAButton>
          </div>

          {/* Pro */}
          <div style={{ background: C.navyMid, border: `2px solid ${C.cyan}`, borderRadius: 20, padding: "32px 32px", position: "relative", boxShadow: `0 0 60px ${C.cyan}15` }}>
            <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: C.cyan, color: C.navy, fontSize: 11, fontWeight: 800, padding: "4px 14px", borderRadius: 20, whiteSpace: "nowrap" }}>
              ⭐ RECOMMANDÉ
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.cyan, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>Pro</div>
            <div style={{ fontSize: 48, fontWeight: 900, color: C.white, lineHeight: 1 }}>30€</div>
            <div style={{ fontSize: 15, color: C.muted, marginBottom: 24 }}>/mois · sans engagement</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
              {[
                "Tout le Starter inclus",
                "Acompte Stripe intégré",
                "Notifications WhatsApp",
                "Synchronisation Google Agenda",
                "Rappels automatiques clients",
                "Disponibilités avancées par jour",
                "Pipeline commercial Kanban",
                "Statistiques et CA estimé",
                "14 jours d'essai gratuit",
              ].map(f => (
                <div key={f} style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 14, color: C.white }}>
                  <span style={{ color: C.cyan, fontWeight: 700 }}>✓</span> {f}
                </div>
              ))}
            </div>
            <CTAButton onClick={() => window.location.href="/inscription?plan=pro"} style={{ width: "100%" }}>
              Démarrer Pro →
            </CTAButton>
            <p style={{ fontSize: 12, color: C.muted, textAlign: "center", marginTop: 10 }}>Sans CB · Annulation en 1 clic</p>
          </div>
        </div>
      </Section>

      {/* ── FAQ ── */}
      <div style={{ background: C.navyMid, borderTop: `1px solid ${C.border}` }} id="faq">
        <Section>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <Badge>FAQ</Badge>
            <Heading>Questions fréquentes</Heading>
          </div>
          <div style={{ maxWidth: 680, margin: "0 auto", display: "flex", flexDirection: "column", gap: 12 }}>
            {FAQS.map(f => (
              <FaqItem key={f.q} q={f.q} a={f.a} />
            ))}
          </div>
        </Section>
      </div>

      {/* ── CTA FINAL ── */}
      <Section style={{ textAlign: "center" }}>
        <Heading size={44}>Prêt à automatiser<br />vos réservations ?</Heading>
        <p style={{ color: C.muted, fontSize: 17, marginBottom: 32 }}>
          Rejoignez les entreprises de nettoyage qui ont arrêté de gérer leurs rdv à la main.
        </p>
        <CTAButton onClick={() => window.location.href="/inscription?plan=pro"}>
          Démarrer mon essai gratuit 14 jours →
        </CTAButton>
      </Section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: `1px solid ${C.border}`, padding: "24px", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 16, color: C.cyan }}>⬡</span>
          <span style={{ fontWeight: 800, color: C.white }}>BookPro</span>
        </div>
        <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>
          © 2026 BookPro · Système de réservation pour entreprises de nettoyage
        </p>
      </footer>

      {false && <SignupModal onClose={() => {}} />}
    </div>
  );
}

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      background: C.navy, border: `1px solid ${C.border}`,
      borderRadius: 12, overflow: "hidden", cursor: "pointer",
    }} onClick={() => setOpen(o => !o)}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px" }}>
        <span style={{ fontWeight: 600, fontSize: 15, color: C.white }}>{q}</span>
        <span style={{ color: C.cyan, fontSize: 18, fontWeight: 700, transition: "transform 0.2s", transform: open ? "rotate(45deg)" : "none" }}>+</span>
      </div>
      {open && (
        <div style={{ padding: "0 20px 16px", fontSize: 14, color: C.muted, lineHeight: 1.7 }}>{a}</div>
      )}
    </div>
  );
}
