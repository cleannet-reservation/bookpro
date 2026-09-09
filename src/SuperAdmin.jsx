import { useState, useEffect } from "react";

const C = {
  navy: "#0A1628", navyMid: "#112240", navyLt: "#1D3461",
  cyan: "#00D4FF", white: "#F0F6FF", muted: "#8899BB",
  border: "#1D3461", green: "#00E5A0", red: "#FF4757",
};

export default function SuperAdmin() {
  const [auth, setAuth] = useState(false);
  const [pwd, setPwd] = useState("");
  const [error, setError] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [tokenLink, setTokenLink] = useState(null);
  const [generatingToken, setGeneratingToken] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState(null);
  const [newClient, setNewClient] = useState({
    nom: "", entreprise: "", email: "", telephone: "", slug: "", mot_de_passe: "", plan: "starter"
  });

  const login = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin", {
        headers: { "x-admin-password": pwd },
      });
      if (r.status === 401) { setError("Mot de passe incorrect"); return; }
      const data = await r.json();
      setClients(Array.isArray(data) ? data : []);
      setAuth(true);
      localStorage.setItem("bookpro_admin_pwd", pwd);
    } catch (e) { setError("Erreur de connexion"); }
    finally { setLoading(false); }
  };

  const toggleStatut = async (id, statut) => {
    const newStatut = statut === "active" ? "suspended" : "active";
    await fetch("/api/admin", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-password": pwd },
      body: JSON.stringify({ id, statut: newStatut }),
    });
    setClients(prev => prev.map(c => c.id === id ? { ...c, statut: newStatut } : c));
  };

  const createFreeAccount = async () => {
    if (!newClient.nom || !newClient.email || !newClient.slug || !newClient.mot_de_passe) {
      setCreateMsg({ ok: false, text: "Remplissez tous les champs obligatoires" });
      return;
    }
    setCreating(true);
    try {
      const r = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": pwd },
        body: JSON.stringify({
          action: "create",
          ...newClient,
          entreprise: newClient.entreprise || newClient.nom,
          statut: "active",
          config: {},
        }),
      });
      const data = await r.json();
      if (!r.ok) { setCreateMsg({ ok: false, text: data.error || "Erreur" }); return; }
      setCreateMsg({ ok: true, text: `✅ Compte créé ! Lien : bookpro-iota.vercel.app/booking/${newClient.slug}` });
      setClients(prev => [data, ...prev]);
      setNewClient({ nom: "", entreprise: "", email: "", telephone: "", slug: "", mot_de_passe: "", plan: "starter" });
    } catch(e) { setCreateMsg({ ok: false, text: "Erreur de connexion" }); }
    finally { setCreating(false); }
  };

  const generateToken = async (plan) => {
    setGeneratingToken(true);
    try {
      // Générer un token aléatoire côté client
      const token = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
      const link = `${window.location.origin}/offert?token=${token}&plan=${plan}`;
      // Sauvegarder dans Supabase en arrière-plan
      fetch("/api/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, plan }),
      }).catch(() => {});
      setTokenLink({ link, plan });
    } catch(e) { console.error(e); }
    finally { setGeneratingToken(false); }
  };

  // Auto-login si pwd sauvegardé
  useEffect(() => {
    const saved = localStorage.getItem("bookpro_admin_pwd");
    if (saved) { setPwd(saved); }
  }, []);

  const filtered = clients
    .filter(c => filter === "all" || c.statut === filter)
    .filter(c => !search || `${c.nom} ${c.entreprise} ${c.email}`.toLowerCase().includes(search.toLowerCase()));

  const stats = {
    total: clients.length,
    active: clients.filter(c => c.statut === "active").length,
    trial: clients.filter(c => c.statut === "trial").length,
    suspended: clients.filter(c => c.statut === "suspended").length,
    mrr: clients.filter(c => c.statut === "active").length * 15,
  };

  if (!auth) return (
    <div style={{ minHeight: "100vh", background: C.navy, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter,sans-serif", padding: 24 }}>
      <div style={{ background: C.navyMid, border: `1px solid ${C.border}`, borderRadius: 20, padding: "40px 36px", maxWidth: 380, width: "100%", textAlign: "center", boxShadow: `0 0 60px ${C.cyan}11` }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>👑</div>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: C.white, margin: "0 0 4px" }}>Super Admin</h1>
        <p style={{ fontSize: 13, color: C.muted, margin: "0 0 24px" }}>BookPro · Accès restreint</p>
        <input type="password" value={pwd} onChange={e => setPwd(e.target.value)}
          onKeyDown={e => e.key === "Enter" && login()}
          placeholder="Mot de passe admin"
          style={{ width: "100%", background: C.navy, border: `1.5px solid ${C.border}`, borderRadius: 8, padding: "11px 14px", fontSize: 14, color: C.white, outline: "none", fontFamily: "inherit", boxSizing: "border-box", marginBottom: 12 }} />
        {error && <p style={{ color: "#FF4757", fontSize: 13, margin: "0 0 10px" }}>⚠️ {error}</p>}
        <button onClick={login} disabled={loading} style={{ width: "100%", background: C.cyan, color: C.navy, border: "none", borderRadius: 8, padding: "12px", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>
          {loading ? "⏳ Connexion..." : "Accéder →"}
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: C.navy, fontFamily: "Inter,system-ui,sans-serif" }}>
      {/* Header */}
      <header style={{ background: C.navyMid, borderBottom: `1px solid ${C.border}`, padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20, color: C.cyan }}>⬡</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: C.white }}>BookPro — Super Admin</div>
            <div style={{ fontSize: 11, color: C.muted }}>Vue d'ensemble de tous les clients</div>
          </div>
        </div>
        <button onClick={() => { setAuth(false); localStorage.removeItem("bookpro_admin_pwd"); }}
          style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, padding: "7px 14px", color: C.muted, fontSize: 13, cursor: "pointer" }}>
          Déconnexion
        </button>
      </header>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px" }}>

        {/* KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Total clients", val: stats.total, icon: "👥", c: C.cyan },
            { label: "Actifs", val: stats.active, icon: "✅", c: C.green },
            { label: "En essai", val: stats.trial, icon: "⏳", c: "#F59E0B" },
            { label: "Suspendus", val: stats.suspended, icon: "🚫", c: C.red },
            { label: "MRR", val: `${stats.mrr}€`, icon: "💶", c: "#A78BFA" },
          ].map(s => (
            <div key={s.label} style={{ background: C.navyMid, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 18px" }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.c }}>{s.val}</div>
              <div style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Rechercher un client..."
            style={{ flex: 1, minWidth: 200, background: C.navyMid, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 14px", fontSize: 13, color: C.white, outline: "none", fontFamily: "inherit" }} />
          <button onClick={() => { setShowCreate(true); setCreateMsg(null); }}
            style={{ background: C.cyan, color: C.navy, border: "none", borderRadius: 8, padding: "9px 16px", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>
            🎁 Compte offert
          </button>
          <button onClick={() => { setShowTokenModal(true); setTokenLink(null); }}
            style={{ background: "#7C3AED", color: "#fff", border: "none", borderRadius: 8, padding: "9px 16px", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>
            🔗 Générer un lien offert
          </button>
          {["all", "active", "trial", "suspended"].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              border: `1px solid ${filter === f ? C.cyan : C.border}`,
              background: filter === f ? C.cyan + "22" : "transparent",
              color: filter === f ? C.cyan : C.muted,
              borderRadius: 8, padding: "9px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}>
              {f === "all" ? "Tous" : f === "active" ? "Actifs" : f === "trial" ? "Essai" : "Suspendus"}
            </button>
          ))}
        </div>

        {/* Clients list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.length === 0 ? (
            <div style={{ background: C.navyMid, borderRadius: 12, padding: "40px 20px", textAlign: "center", color: C.muted, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>👥</div>
              <p style={{ margin: 0 }}>Aucun client pour l'instant.</p>
            </div>
          ) : filtered.map(c => (
            <div key={c.id} style={{ background: C.navyMid, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                {/* Statut */}
                <span style={{
                  background: c.statut === "active" ? C.green + "22" : c.statut === "trial" ? "#F59E0B22" : C.red + "22",
                  color: c.statut === "active" ? C.green : c.statut === "trial" ? "#F59E0B" : C.red,
                  fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, whiteSpace: "nowrap",
                }}>
                  {c.statut === "active" ? "✅ Actif" : c.statut === "trial" ? "⏳ Essai" : "🚫 Suspendu"}
                </span>

                {/* Infos */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: C.white }}>{c.entreprise || c.nom}</div>
                  <div style={{ fontSize: 13, color: C.muted }}>{c.email} · {c.telephone}</div>
                </div>

                {/* Stats */}
                <div style={{ display: "flex", gap: 16, fontSize: 13 }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontWeight: 700, color: C.cyan }}>{c.total_resa || 0}</div>
                    <div style={{ color: C.muted, fontSize: 11 }}>réservations</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontWeight: 700, color: C.green }}>{(c.ca || 0).toFixed(0)}€</div>
                    <div style={{ color: C.muted, fontSize: 11 }}>CA estimé</div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 8 }}>
                  <a href={`/booking/${c.slug}`} target="_blank" rel="noreferrer"
                    style={{ background: C.cyan + "22", color: C.cyan, border: "none", borderRadius: 8, padding: "7px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", textDecoration: "none" }}>
                    Voir page
                  </a>
                  <button onClick={() => toggleStatut(c.id, c.statut)}
                    style={{ background: c.statut === "suspended" ? C.green + "22" : C.red + "22", color: c.statut === "suspended" ? C.green : C.red, border: "none", borderRadius: 8, padding: "7px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                    {c.statut === "suspended" ? "Activer" : "Suspendre"}
                  </button>
                  <button onClick={async () => {
                    if (!confirm(`Supprimer le compte de ${c.entreprise} ? Cette action est irréversible.`)) return;
                    await fetch("/api/admin", {
                      method: "DELETE",
                      headers: { "Content-Type": "application/json", "x-admin-password": pwd },
                      body: JSON.stringify({ id: c.id }),
                    });
                    setClients(prev => prev.filter(cl => cl.id !== c.id));
                  }} style={{ background: C.red + "22", color: C.red, border: "none", borderRadius: 8, padding: "7px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                    🗑️ Supprimer
                  </button>
                </div>
              </div>

              {/* Slug + date */}
              <div style={{ display: "flex", gap: 16, marginTop: 10, fontSize: 12, color: C.muted }}>
                <span>🔗 /booking/{c.slug}</span>
                <span>📅 Inscrit le {new Date(c.created_at).toLocaleDateString("fr-FR")}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal génération lien offert */}
      {showTokenModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: C.navyMid, border: `1px solid ${C.border}`, borderRadius: 20, padding: "28px 24px", maxWidth: 420, width: "100%", boxShadow: `0 0 60px #7C3AED33` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.white }}>🔗 Générer un lien offert</h2>
              <button onClick={() => { setShowTokenModal(false); setTokenLink(null); }} style={{ background: "none", border: "none", color: C.muted, fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>

            {!tokenLink ? (
              <>
                <p style={{ color: C.muted, fontSize: 13, marginBottom: 20 }}>
                  Choisissez la formule à offrir. Le lien sera valable une seule fois.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <button onClick={() => generateToken("starter")} disabled={generatingToken}
                    style={{ background: "#0057FF22", border: "1.5px solid #0057FF", color: "#0057FF", borderRadius: 12, padding: "16px", fontWeight: 800, fontSize: 15, cursor: "pointer" }}>
                    ⚡ Starter — 15€/mois
                    <div style={{ fontSize: 11, fontWeight: 500, marginTop: 4, opacity: 0.8 }}>Réservations, Services, Upsells</div>
                  </button>
                  <button onClick={() => generateToken("pro")} disabled={generatingToken}
                    style={{ background: "#7C3AED22", border: "1.5px solid #7C3AED", color: "#A78BFA", borderRadius: 12, padding: "16px", fontWeight: 800, fontSize: 15, cursor: "pointer" }}>
                    ⭐ Pro — 30€/mois
                    <div style={{ fontSize: 11, fontWeight: 500, marginTop: 4, opacity: 0.8 }}>Tout Starter + Stripe, SMS rappels, Google Agenda</div>
                  </button>
                  {generatingToken && <p style={{ color: C.muted, fontSize: 13, textAlign: "center" }}>⏳ Génération en cours...</p>}
                </div>
              </>
            ) : (
              <>
                <p style={{ color: "#A78BFA", fontWeight: 700, fontSize: 14, marginBottom: 12 }}>
                  ✅ Lien {tokenLink.plan === "pro" ? "Pro ⭐" : "Starter ⚡"} généré et copié !
                </p>
                <div style={{ background: C.navy, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px", marginBottom: 16, wordBreak: "break-all", fontSize: 12, color: "#00D4FF", fontFamily: "monospace" }}>
                  {tokenLink.link}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => navigator.clipboard.writeText(tokenLink.link).catch(() => {})}
                    style={{ flex: 1, background: "#0057FF", color: "#fff", border: "none", borderRadius: 8, padding: "10px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                    📋 Copier le lien
                  </button>
                  <button onClick={() => setTokenLink(null)}
                    style={{ flex: 1, background: C.navyMid, border: `1px solid ${C.border}`, color: C.muted, borderRadius: 8, padding: "10px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                    Nouveau lien
                  </button>
                </div>
                <p style={{ color: C.muted, fontSize: 11, textAlign: "center", marginTop: 12 }}>
                  ⚠️ Ce lien est valable une seule fois. Une fois utilisé, il expire automatiquement.
                </p>
              </>
            )}
          </div>
        </div>
      )}
      {showCreate && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: C.navyMid, border: `1px solid ${C.border}`, borderRadius: 20, padding: "28px 24px", maxWidth: 480, width: "100%", boxShadow: `0 0 60px ${C.cyan}22` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.white }}>🎁 Créer un compte offert</h2>
              <button onClick={() => setShowCreate(false)} style={{ background: "none", border: "none", color: C.muted, fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { label: "Nom *", key: "nom", ph: "Marie Dupont" },
                { label: "Entreprise", key: "entreprise", ph: "CleanPro Nice" },
                { label: "Email *", key: "email", ph: "marie@exemple.fr" },
                { label: "Téléphone", key: "telephone", ph: "0612345678" },
                { label: "Identifiant (slug) *", key: "slug", ph: "cleanpro-nice" },
                { label: "Mot de passe *", key: "mot_de_passe", ph: "motdepasse123" },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>{f.label}</label>
                  <input value={newClient[f.key]} onChange={e => setNewClient(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.ph}
                    style={{ width: "100%", background: C.navy, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", fontSize: 13, color: C.white, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
                </div>
              ))}

              {/* Plan */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 6 }}>Formule</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {["starter", "pro"].map(p => (
                    <button key={p} onClick={() => setNewClient(prev => ({ ...prev, plan: p }))}
                      style={{ flex: 1, padding: "8px", fontSize: 13, fontWeight: 700, border: `1.5px solid ${newClient.plan === p ? C.cyan : C.border}`, borderRadius: 8, background: newClient.plan === p ? C.cyan + "22" : "transparent", color: newClient.plan === p ? C.cyan : C.muted, cursor: "pointer" }}>
                      {p === "starter" ? "⚡ Starter" : "⭐ Pro"}
                    </button>
                  ))}
                </div>
              </div>

              {createMsg && (
                <div style={{ background: createMsg.ok ? C.green + "22" : C.red + "22", border: `1px solid ${createMsg.ok ? C.green : C.red}`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: createMsg.ok ? C.green : C.red, fontWeight: 600 }}>
                  {createMsg.text}
                </div>
              )}

              <button onClick={createFreeAccount} disabled={creating}
                style={{ background: C.cyan, color: C.navy, border: "none", borderRadius: 10, padding: "13px", fontSize: 15, fontWeight: 800, cursor: "pointer" }}>
                {creating ? "⏳ Création..." : "🎁 Créer le compte offert"}
              </button>

              <p style={{ fontSize: 11, color: C.muted, margin: 0, textAlign: "center" }}>
                Le compte sera actif immédiatement. Aucun paiement requis.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
