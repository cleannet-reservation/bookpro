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
    </div>
  );
}
