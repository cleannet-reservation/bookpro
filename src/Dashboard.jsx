import { useState, useEffect } from "react";

const uid = () => Math.random().toString(36).slice(2, 8);
const IS = { border: "1.5px solid #E5E7EB", borderRadius: 8, padding: "9px 12px", fontSize: 14, color: "#1A1F36", outline: "none", fontFamily: "inherit", background: "#fff", width: "100%", boxSizing: "border-box" };
const DAYS_FR = ["Dim","Lun","Mar","Mer","Jeu","Ven","Sam"];
const MONTHS_FR = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

function ProLock({ color }) {
  return (
    <div style={{textAlign:"center",padding:"48px 20px"}}>
      <div style={{fontSize:48,marginBottom:12}}>🔒</div>
      <h2 style={{fontSize:18,fontWeight:800,margin:"0 0 8px",color:"#1A1F36"}}>Fonctionnalité Pro</h2>
      <p style={{fontSize:14,color:"#6B7280",marginBottom:20}}>Disponible avec la formule <strong>Pro 30€/mois</strong></p>
      <a href="/inscription?plan=pro" style={{display:"inline-block",background:color,color:"#fff",textDecoration:"none",borderRadius:10,padding:"11px 22px",fontWeight:800,fontSize:14}}>Passer à Pro →</a>
    </div>
  );
}

function BlockedDatesPicker({ blockedDates, onChange, color }) {
  const now = new Date();
  const [vy,setVy]=useState(now.getFullYear());
  const [vm,setVm]=useState(now.getMonth());
  const first=new Date(vy,vm,1).getDay(), days=new Date(vy,vm+1,0).getDate();
  const toStr=(d)=>`${vy}-${String(vm+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
  const isPast=(d)=>{ const date=new Date(vy,vm,d); const t=new Date(); t.setHours(0,0,0,0); return date<t; };
  const toggle=(d)=>{ const str=toStr(d); onChange(blockedDates.includes(str)?blockedDates.filter(x=>x!==str):[...blockedDates,str].sort()); };
  const cells=[]; for(let i=0;i<first;i++)cells.push(null); for(let d=1;d<=days;d++)cells.push(d);
  return (
    <div style={{border:"1.5px solid #E5E7EB",borderRadius:12,overflow:"hidden"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",background:"#1A1F36",color:"#fff"}}>
        <button onClick={()=>{if(vm===0){setVm(11);setVy(y=>y-1);}else setVm(m=>m-1);}} style={{background:"none",border:"none",color:"#fff",fontSize:20,cursor:"pointer"}}>‹</button>
        <span style={{fontWeight:700,fontSize:14}}>{MONTHS_FR[vm]} {vy}</span>
        <button onClick={()=>{if(vm===11){setVm(0);setVy(y=>y+1);}else setVm(m=>m+1);}} style={{background:"none",border:"none",color:"#fff",fontSize:20,cursor:"pointer"}}>›</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",background:"#F7F8FC"}}>
        {DAYS_FR.map(d=><div key={d} style={{textAlign:"center",fontSize:11,fontWeight:700,color:"#9CA3AF",padding:"6px 0"}}>{d}</div>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",padding:"6px",background:"#fff"}}>
        {cells.map((d,i)=>{
          if(!d)return<div key={`e${i}`}/>;
          const str=toStr(d),isB=blockedDates.includes(str),past=isPast(d);
          return<button key={d} disabled={past} onClick={()=>toggle(d)} style={{margin:2,borderRadius:6,border:isB?"2px solid #DC2626":"1.5px solid transparent",padding:"7px 2px",fontSize:12,cursor:past?"not-allowed":"pointer",fontWeight:isB?800:400,background:isB?"#FEE2E2":past?"transparent":"#F7F8FC",color:isB?"#DC2626":past?"#D1D5DB":"#1A1F36"}}>{d}</button>;
        })}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const params = new URLSearchParams(window.location.search);
  const [auth, setAuth] = useState(false);
  const [slug, setSlug] = useState(params.get("slug") || "");
  const [pwd, setPwd] = useState("");
  const [client, setClient] = useState(null);
  const [config, setConfig] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("reservations");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pwdCurrent, setPwdCurrent] = useState("");
  const [pwdNew, setPwdNew] = useState("");
  const [pwdConfirm, setPwdConfirm] = useState("");
  const [pwdMsg, setPwdMsg] = useState(null);

  const login = async () => {
    if (!slug) { setError("Entrez votre identifiant"); return; }
    setLoading(true); setError(null);
    try {
      const r = await fetch(`/api/clients?slug=${slug}`);
      const data = await r.json();
      if (data.error) { setError("Compte introuvable"); return; }
      if (data.mot_de_passe !== pwd) { setError("Mot de passe incorrect"); return; }
      setClient(data);
      setConfig(JSON.parse(JSON.stringify(data.config || {})));
      setAuth(true);
      const rv = await fetch(`/api/client-reservations?slug=${slug}&t=${Date.now()}`, { cache: "no-store" });
      const rvData = await rv.json();
      setReservations(Array.isArray(rvData) ? rvData : []);
    } catch(e) { setError("Erreur de connexion"); }
    finally { setLoading(false); }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      await fetch("/api/clients", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug, config }) });
      setSaved(true); setTimeout(() => setSaved(false), 2000);
    } catch(e) { console.error(e); }
    finally { setSaving(false); }
  };

  const changeStatut = async (id, statut) => {
    await fetch("/api/client-reservations", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, statut }) });
    setReservations(prev => prev.map(r => r.id === id ? { ...r, statut } : r));
  };

  const handlePasswordChange = async () => {
    if (pwdCurrent !== pwd) { setPwdMsg({ok:false,text:"Mot de passe actuel incorrect"}); return; }
    if (pwdNew.length < 6) { setPwdMsg({ok:false,text:"Minimum 6 caractères"}); return; }
    if (pwdNew !== pwdConfirm) { setPwdMsg({ok:false,text:"Les mots de passe ne correspondent pas"}); return; }
    try {
      await fetch("/api/clients", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug, mot_de_passe: pwdNew }) });
      setPwd(pwdNew); setPwdCurrent(""); setPwdNew(""); setPwdConfirm("");
      setPwdMsg({ok:true,text:"Mot de passe modifié !"});
      setTimeout(() => setPwdMsg(null), 3000);
    } catch(e) { setPwdMsg({ok:false,text:"Erreur"}); }
  };

  const setCompany = (k,v) => setConfig(c=>({...c,company:{...(c.company||{}),[k]:v}}));
  const setAvail = (k,v) => setConfig(c=>({...c,availability:{...(c.availability||{}),[k]:v}}));
  const setDaySched = (i,field,val) => setConfig(c=>({...c,availability:{...(c.availability||{}),daySchedules:{...(c.availability?.daySchedules||{}),[i]:{...(c.availability?.daySchedules?.[i]||{active:false,start:"08:00",end:"18:00"}),[field]:val}}}}));
  const updateService = (si,field,val) => setConfig(c=>{const s=[...(c.services||[])];s[si]={...s[si],[field]:val};return{...c,services:s};});
  const updateOption = (si,oi,field,val) => setConfig(c=>{const s=[...(c.services||[])];const o=[...s[si].options];o[oi]={...o[oi],[field]:val};s[si]={...s[si],options:o};return{...c,services:s};});
  const addOption = (si) => setConfig(c=>{const s=[...(c.services||[])];s[si]={...s[si],options:[...s[si].options,{id:uid(),label:"Option",price:0,duration:60}]};return{...c,services:s};});
  const removeOption = (si,oi) => setConfig(c=>{const s=[...(c.services||[])];s[si]={...s[si],options:s[si].options.filter((_,i)=>i!==oi)};return{...c,services:s};});
  const addService = () => setConfig(c=>({...c,services:[...(c.services||[]),{id:uid(),icon:"🧹",name:"Nouveau service",description:"Description",options:[{id:uid(),label:"Option 1",price:0,duration:60}]}]}));
  const removeService = (si) => setConfig(c=>({...c,services:(c.services||[]).filter((_,i)=>i!==si)}));
  const updateUpsell = (ui,field,val) => setConfig(c=>{const u=[...(c.upsells||[])];u[ui]={...u[ui],[field]:val};return{...c,upsells:u};});
  const addUpsell = () => setConfig(c=>({...c,upsells:[...(c.upsells||[]),{id:uid(),icon:"⭐",name:"Nouvel upsell",price:0}]}));
  const removeUpsell = (ui) => setConfig(c=>({...c,upsells:(c.upsells||[]).filter((_,i)=>i!==ui)}));

  // Page de connexion
  if (!auth) return (
    <div style={{minHeight:"100vh",background:"#F7F8FC",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Inter,sans-serif",padding:20}}>
      <div style={{background:"#fff",borderRadius:16,padding:"36px 32px",maxWidth:380,width:"100%",boxShadow:"0 4px 20px rgba(0,0,0,0.08)"}}>
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{fontSize:32,marginBottom:8}}>⬡</div>
          <h1 style={{fontSize:22,fontWeight:900,margin:"0 0 4px",color:"#1A1F36"}}>BookPro</h1>
          <p style={{fontSize:13,color:"#6B7280",margin:0}}>Tableau de bord</p>
        </div>
        {[{label:"Identifiant",value:slug,set:setSlug,ph:"mon-entreprise"},{label:"Mot de passe",value:pwd,set:setPwd,ph:"••••••••",type:"password"}].map(f=>(
          <div key={f.label} style={{marginBottom:14}}>
            <label style={{fontSize:13,fontWeight:600,display:"block",marginBottom:5}}>{f.label}</label>
            <input type={f.type||"text"} value={f.value} onChange={e=>f.set(e.target.value)} placeholder={f.ph} onKeyDown={e=>e.key==="Enter"&&login()} style={{...IS,fontSize:15}}/>
          </div>
        ))}
        {error&&<p style={{color:"#DC2626",fontSize:13,margin:"0 0 12px",background:"#FEF2F2",padding:"8px 12px",borderRadius:8}}>⚠️ {error}</p>}
        <button onClick={login} disabled={loading} style={{width:"100%",background:"#0057FF",color:"#fff",border:"none",borderRadius:10,padding:"13px",fontSize:15,fontWeight:800,cursor:"pointer"}}>
          {loading?"⏳ Connexion...":"Se connecter →"}
        </button>
      </div>
    </div>
  );

  const isPro = client?.plan === "pro";
  const color = config?.company?.accentColor || "#0057FF";
  const bookingUrl = `${window.location.origin}/booking/${slug}`;
  const company = config?.company || {};
  const availability = config?.availability || {};
  const schedules = availability.daySchedules || {};

  const inputStyle = { ...IS };

  const TABS = [
    { id:"reservations", label:"📋 Réservations" },
    { id:"ma-page", label:"🏢 Ma page" },
    { id:"services", label:"🧹 Services" },
    { id:"upsells", label:"✨ Upsells" },
    { id:"integrations", label: isPro ? "💳 Stripe & WhatsApp" : "💳 Stripe & WhatsApp 🔒" },
    { id:"disponibilites", label: isPro ? "📅 Disponibilités" : "📅 Disponibilités 🔒" },
    { id:"google-agenda", label: isPro ? "🗓️ Google Agenda" : "🗓️ Google Agenda 🔒" },
    { id:"stats", label: isPro ? "📊 Statistiques" : "📊 Statistiques 🔒" },
    { id:"mot-de-passe", label:"🔑 Mot de passe" },
  ];

  const SAVE_TABS = ["ma-page","services","upsells","integrations","disponibilites","google-agenda"];
  const showSave = SAVE_TABS.includes(tab) && (["ma-page","services","upsells"].includes(tab) || isPro);

  return (
    <div style={{minHeight:"100vh",background:"#F7F8FC",fontFamily:"Inter,sans-serif"}}>
      {/* Header */}
      <header style={{background:"#fff",borderBottom:"1px solid #E5E7EB",position:"sticky",top:0,zIndex:100}}>
        <div style={{maxWidth:960,margin:"0 auto",padding:"12px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:20,color,fontWeight:900}}>⬡</span>
            <div>
              <div style={{fontWeight:800,fontSize:15,color:"#1A1F36"}}>{company.name || slug}</div>
              <div style={{fontSize:11,color:"#6B7280"}}>{isPro?"⭐ Pro":"Starter"}</div>
            </div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            {showSave && (
              <button onClick={saveConfig} style={{background:saved?"#059669":color,color:"#fff",border:"none",borderRadius:8,padding:"7px 14px",fontWeight:700,fontSize:13,cursor:"pointer"}}>
                {saving?"⏳":saved?"✓ Sauvegardé !":"💾 Sauvegarder"}
              </button>
            )}
            <a href={bookingUrl} target="_blank" rel="noreferrer" style={{background:color+"15",color,textDecoration:"none",borderRadius:8,padding:"7px 14px",fontWeight:700,fontSize:13}}>
              🔗 Ma page
            </a>
            <button onClick={()=>{setAuth(false);setSlug("");setPwd("");}} style={{background:"#F3F4F6",border:"none",borderRadius:8,padding:"7px 12px",fontSize:13,cursor:"pointer",color:"#6B7280"}}>
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div style={{background:"#fff",borderBottom:"1px solid #E5E7EB",overflowX:"auto"}}>
        <div style={{maxWidth:960,margin:"0 auto",display:"flex",padding:"0 20px"}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"12px 16px",border:"none",borderBottom:`3px solid ${tab===t.id?color:"transparent"}`,background:"transparent",color:tab===t.id?color:"#6B7280",fontWeight:tab===t.id?700:500,fontSize:13,cursor:"pointer",whiteSpace:"nowrap",fontFamily:"inherit"}}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contenu */}
      <div style={{maxWidth:960,margin:"0 auto",padding:"24px 20px"}}>

        {/* Réservations */}
        {tab==="reservations" && (
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <h2 style={{margin:0,fontSize:17,fontWeight:800}}>📋 Réservations ({reservations.length})</h2>
            </div>
            {reservations.length===0 ? (
              <div style={{background:"#fff",borderRadius:12,padding:"48px 20px",textAlign:"center",color:"#9CA3AF",border:"1px solid #E5E7EB"}}>
                <div style={{fontSize:40,marginBottom:8}}>📋</div>
                <p style={{margin:0}}>Aucune réservation pour l'instant.</p>
              </div>
            ) : reservations.map(r=>(
              <div key={r.id} style={{background:"#fff",borderRadius:12,padding:"14px 18px",border:`1.5px solid ${r.statut==="confirme"?"#059669":r.statut==="annule"?"#FCA5A5":"#E5E7EB"}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8,flexWrap:"wrap",gap:8}}>
                  <span style={{fontWeight:700,fontSize:15}}>{r.prenom} {r.nom}</span>
                  <span style={{background:r.statut==="confirme"?"#F0FDF4":r.statut==="annule"?"#FEF2F2":"#FFF7ED",color:r.statut==="confirme"?"#059669":r.statut==="annule"?"#DC2626":"#F59E0B",fontSize:12,fontWeight:700,padding:"3px 10px",borderRadius:20}}>
                    {r.statut==="confirme"?"✅ Confirmé":r.statut==="annule"?"✕ Annulé":"⏳ En attente"}
                  </span>
                </div>
                <div style={{fontSize:13,color:"#6B7280",lineHeight:1.9,marginBottom:10}}>
                  🧹 {r.service} — {r.option}<br/>
                  📅 {r.date} · {r.creneau}<br/>
                  📍 {r.adresse}<br/>
                  📞 {r.telephone} · 💶 {r.total}€
                </div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  {["attente","confirme","annule"].map(s=>(
                    <button key={s} onClick={()=>changeStatut(r.id,s)} style={{border:`1.5px solid ${r.statut===s?s==="confirme"?"#059669":s==="annule"?"#DC2626":"#F59E0B":"#E5E7EB"}`,background:r.statut===s?s==="confirme"?"#F0FDF4":s==="annule"?"#FEF2F2":"#FFF7ED":"#fff",color:r.statut===s?s==="confirme"?"#059669":s==="annule"?"#DC2626":"#F59E0B":"#9CA3AF",borderRadius:8,padding:"5px 12px",fontSize:12,fontWeight:600,cursor:"pointer"}}>
                      {s==="attente"?"⏳ En attente":s==="confirme"?"✅ Confirmer":"✕ Annuler"}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Ma page */}
        {tab==="ma-page" && (
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:14}}>
            {[{label:"Nom de l'entreprise",key:"name"},{label:"Slogan",key:"tagline"},{label:"Zone d'intervention",key:"zone"},{label:"Email",key:"email"},{label:"WhatsApp (ex: 33612345678)",key:"phone"}].map(f=>(
              <div key={f.key}>
                <label style={{fontSize:13,fontWeight:600,display:"block",marginBottom:5}}>{f.label}</label>
                <input value={company[f.key]||""} onChange={e=>setCompany(f.key,e.target.value)} style={inputStyle}/>
              </div>
            ))}
            <div>
              <label style={{fontSize:13,fontWeight:600,display:"block",marginBottom:5}}>Acompte (%)</label>
              <input type="number" value={company.acomptePercent||30} onChange={e=>setCompany("acomptePercent",e.target.value)} style={inputStyle}/>
            </div>
            <div>
              <label style={{fontSize:13,fontWeight:600,display:"block",marginBottom:5}}>Couleur principale</label>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <input type="color" value={company.accentColor||"#0057FF"} onChange={e=>setCompany("accentColor",e.target.value)} style={{width:48,height:40,border:"1.5px solid #E5E7EB",borderRadius:8,cursor:"pointer",padding:2}}/>
                <span style={{fontSize:13,color:"#6B7280",fontFamily:"monospace"}}>{company.accentColor}</span>
              </div>
            </div>
          </div>
        )}

        {/* Services */}
        {tab==="services" && (
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            {(config?.services||[]).map((svc,si)=>(
              <div key={svc.id} style={{background:"#fff",border:"1.5px solid #E5E7EB",borderRadius:12,overflow:"hidden"}}>
                <div style={{background:"#F7F8FC",padding:"12px 16px",display:"flex",alignItems:"center",gap:10}}>
                  <input value={svc.icon} onChange={e=>updateService(si,"icon",e.target.value)} style={{...inputStyle,width:48,textAlign:"center",fontSize:20,padding:"6px"}}/>
                  <input value={svc.name} onChange={e=>updateService(si,"name",e.target.value)} style={{...inputStyle,flex:1,fontWeight:700,fontSize:15}}/>
                  <button onClick={()=>removeService(si)} style={{background:"#FEE2E2",border:"none",borderRadius:6,padding:"8px 10px",color:"#DC2626",fontWeight:700,cursor:"pointer"}}>✕</button>
                </div>
                <div style={{padding:"14px 16px"}}>
                  <div style={{marginBottom:12}}>
                    <label style={{fontSize:12,fontWeight:600,display:"block",marginBottom:4,color:"#6B7280"}}>Description</label>
                    <input value={svc.description} onChange={e=>updateService(si,"description",e.target.value)} style={inputStyle}/>
                  </div>
                  <p style={{fontSize:11,fontWeight:700,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:0.5,margin:"0 0 8px"}}>Options & Prix</p>
                  {(svc.options||[]).map((opt,oi)=>(
                    <div key={opt.id} style={{border:"1.5px solid #E5E7EB",borderRadius:10,padding:"10px 12px",marginBottom:8,background:"#FAFAFA"}}>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 32px",gap:6,marginBottom:8}}>
                        <input value={opt.label} onChange={e=>updateOption(si,oi,"label",e.target.value)} style={inputStyle} placeholder="Label"/>
                        <button onClick={()=>removeOption(si,oi)} style={{background:"#FEF2F2",border:"1.5px solid #FCA5A5",borderRadius:6,padding:"6px",color:"#EF4444",cursor:"pointer",fontSize:14}}>✕</button>
                      </div>
                      <div style={{display:"flex",gap:6,marginBottom:8}}>
                        <button onClick={()=>updateOption(si,oi,"priceType","fixed")} style={{flex:1,padding:"6px",fontSize:12,fontWeight:600,border:`1.5px solid ${!opt.priceType||opt.priceType==="fixed"?color:"#E5E7EB"}`,borderRadius:6,background:!opt.priceType||opt.priceType==="fixed"?color+"15":"#fff",color:!opt.priceType||opt.priceType==="fixed"?color:"#6B7280",cursor:"pointer"}}>💶 Prix fixe</button>
                        <button onClick={()=>updateOption(si,oi,"priceType","m2")} style={{flex:1,padding:"6px",fontSize:12,fontWeight:600,border:`1.5px solid ${opt.priceType==="m2"?color:"#E5E7EB"}`,borderRadius:6,background:opt.priceType==="m2"?color+"15":"#fff",color:opt.priceType==="m2"?color:"#6B7280",cursor:"pointer"}}>📐 Prix/m²</button>
                      </div>
                      <div style={{display:"flex",gap:6}}>
                        <div style={{flex:1,position:"relative"}}>
                          <input type="number" value={opt.price} onChange={e=>updateOption(si,oi,"price",e.target.value)} style={{...inputStyle,paddingRight:40}}/>
                          <span style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",fontSize:11,color:"#9CA3AF"}}>{opt.priceType==="m2"?"€/m²":"€"}</span>
                        </div>
                        <div style={{width:80,position:"relative"}}>
                          <input type="number" value={opt.duration||60} onChange={e=>updateOption(si,oi,"duration",e.target.value)} style={{...inputStyle,paddingRight:30}}/>
                          <span style={{position:"absolute",right:6,top:"50%",transform:"translateY(-50%)",fontSize:10,color:"#9CA3AF"}}>min</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button onClick={()=>addOption(si)} style={{width:"100%",background:"none",border:`1.5px dashed ${color}`,borderRadius:8,padding:"9px",color,fontWeight:600,fontSize:13,cursor:"pointer"}}>+ Ajouter une option</button>
                </div>
              </div>
            ))}
            <button onClick={addService} style={{background:"none",border:`2px dashed ${color}`,borderRadius:12,padding:"14px",color,fontWeight:700,fontSize:14,cursor:"pointer"}}>+ Ajouter un service</button>
          </div>
        )}

        {/* Upsells */}
        {tab==="upsells" && (
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {(config?.upsells||[]).length===0&&<div style={{textAlign:"center",padding:"32px",background:"#F7F8FC",borderRadius:12,color:"#9CA3AF",border:"1px solid #E5E7EB"}}>Aucun upsell. Ajoutez-en un !</div>}
            {(config?.upsells||[]).map((u,ui)=>(
              <div key={u.id} style={{background:"#fff",border:"1.5px solid #E5E7EB",borderRadius:12,padding:"12px 16px"}}>
                <div style={{display:"grid",gridTemplateColumns:"48px 1fr 100px 36px",gap:8,alignItems:"center",marginBottom:10}}>
                  <input value={u.icon} onChange={e=>updateUpsell(ui,"icon",e.target.value)} style={{...inputStyle,textAlign:"center",fontSize:20,padding:"4px"}}/>
                  <input value={u.name} onChange={e=>updateUpsell(ui,"name",e.target.value)} style={inputStyle}/>
                  <div style={{position:"relative"}}>
                    <input type="number" value={u.price} onChange={e=>updateUpsell(ui,"price",e.target.value)} style={{...inputStyle,paddingRight:20}}/>
                    <span style={{position:"absolute",right:6,top:"50%",transform:"translateY(-50%)",fontSize:11,color:"#9CA3AF"}}>€</span>
                  </div>
                  <button onClick={()=>removeUpsell(ui)} style={{background:"#FEE2E2",border:"none",borderRadius:6,padding:"8px",color:"#DC2626",cursor:"pointer",fontSize:16}}>✕</button>
                </div>
                <div>
                  <p style={{fontSize:12,fontWeight:600,color:"#6B7280",margin:"0 0 6px"}}>Afficher pour :</p>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                    <button onClick={()=>updateUpsell(ui,"services",[])} style={{padding:"4px 10px",fontSize:12,fontWeight:600,border:`1.5px solid ${!u.services||u.services.length===0?color:"#E5E7EB"}`,borderRadius:20,background:!u.services||u.services.length===0?color+"15":"#fff",color:!u.services||u.services.length===0?color:"#6B7280",cursor:"pointer"}}>Tous</button>
                    {(config?.services||[]).map(s=>{
                      const selected=u.services&&u.services.includes(s.id);
                      return <button key={s.id} onClick={()=>{const current=u.services||[];const next=selected?current.filter(id=>id!==s.id):[...current,s.id];updateUpsell(ui,"services",next);}} style={{padding:"4px 10px",fontSize:12,fontWeight:600,border:`1.5px solid ${selected?color:"#E5E7EB"}`,borderRadius:20,background:selected?color+"15":"#fff",color:selected?color:"#6B7280",cursor:"pointer"}}>{s.icon} {s.name}</button>;
                    })}
                  </div>
                </div>
              </div>
            ))}
            <button onClick={addUpsell} style={{background:"none",border:`2px dashed ${color}`,borderRadius:12,padding:"14px",color,fontWeight:700,fontSize:14,cursor:"pointer"}}>+ Ajouter un upsell</button>
          </div>
        )}

        {/* Stripe & WhatsApp */}
        {tab==="integrations" && (!isPro ? <ProLock color={color}/> : (
          <div style={{display:"flex",flexDirection:"column",gap:14,maxWidth:500}}>
            <div style={{background:"#fff",border:"1.5px solid #E5E7EB",borderRadius:12,padding:"16px"}}>
              <p style={{fontSize:12,fontWeight:700,color:"#9CA3AF",textTransform:"uppercase",margin:"0 0 12px"}}>📲 WhatsApp</p>
              <label style={{fontSize:13,fontWeight:600,display:"block",marginBottom:5}}>Numéro (format international)</label>
              <input value={company.phone||""} onChange={e=>setCompany("phone",e.target.value)} placeholder="33612345678" style={inputStyle}/>
              <p style={{fontSize:11,color:"#6B7280",marginTop:4}}>Ex: 33612345678 (sans + ni espaces)</p>
            </div>
            <div style={{background:"#fff",border:"1.5px solid #E5E7EB",borderRadius:12,padding:"16px"}}>
              <p style={{fontSize:12,fontWeight:700,color:"#9CA3AF",textTransform:"uppercase",margin:"0 0 12px"}}>💳 Stripe</p>
              <label style={{fontSize:13,fontWeight:600,display:"block",marginBottom:5}}>Clé publique (pk_live_...)</label>
              <input value={company.stripePublicKey||""} onChange={e=>setCompany("stripePublicKey",e.target.value)} placeholder="pk_live_..." style={inputStyle}/>
            </div>
          </div>
        ))}

        {/* Disponibilités */}
        {tab==="disponibilites" && (!isPro ? <ProLock color={color}/> : (
          <div style={{display:"flex",flexDirection:"column",gap:14,maxWidth:500}}>
            <div style={{background:"#fff",border:"1.5px solid #E5E7EB",borderRadius:12,padding:"16px"}}>
              <p style={{fontSize:12,fontWeight:700,color:"#9CA3AF",textTransform:"uppercase",margin:"0 0 12px"}}>Horaires par jour</p>
              {DAYS_FR.map((dayLabel,i)=>{
                const dc=schedules[i]||{active:false,start:"08:00",end:"18:00"};
                return (
                  <div key={i} style={{border:`1.5px solid ${dc.active?color:"#E5E7EB"}`,borderRadius:10,padding:"10px 14px",marginBottom:8,background:dc.active?color+"08":"#FAFAFA"}}>
                    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:dc.active?8:0}}>
                      <button onClick={()=>setDaySched(i,"active",!dc.active)} style={{width:40,height:22,borderRadius:11,border:"none",cursor:"pointer",background:dc.active?color:"#D1D5DB",position:"relative",flexShrink:0}}>
                        <span style={{position:"absolute",top:2,width:18,height:18,borderRadius:"50%",background:"#fff",transition:"left 0.2s",left:dc.active?20:2,boxShadow:"0 1px 3px rgba(0,0,0,0.2)"}}/>
                      </button>
                      <span style={{fontWeight:700,fontSize:14,color:dc.active?"#1A1F36":"#9CA3AF"}}>{dayLabel}</span>
                      {!dc.active&&<span style={{fontSize:12,color:"#9CA3AF",fontStyle:"italic",marginLeft:"auto"}}>Fermé</span>}
                    </div>
                    {dc.active&&(
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <input type="time" value={dc.start} onChange={e=>setDaySched(i,"start",e.target.value)} style={{...inputStyle,flex:1}}/>
                        <span style={{color:"#9CA3AF",fontWeight:600}}>→</span>
                        <input type="time" value={dc.end} onChange={e=>setDaySched(i,"end",e.target.value)} style={{...inputStyle,flex:1}}/>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div style={{background:"#fff",border:"1.5px solid #E5E7EB",borderRadius:12,padding:"16px"}}>
              <p style={{fontSize:12,fontWeight:700,color:"#9CA3AF",textTransform:"uppercase",margin:"0 0 12px"}}>🚫 Dates bloquées</p>
              <BlockedDatesPicker blockedDates={availability.blockedDates||[]} onChange={dates=>setAvail("blockedDates",dates)} color={color}/>
              {(availability.blockedDates||[]).length>0&&(
                <div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:10}}>
                  {(availability.blockedDates||[]).map(d=>(
                    <div key={d} style={{display:"flex",alignItems:"center",gap:4,background:"#FEE2E2",borderRadius:20,padding:"4px 10px 4px 12px",fontSize:12,fontWeight:600,color:"#DC2626"}}>
                      🚫 {d}
                      <button onClick={()=>setAvail("blockedDates",(availability.blockedDates||[]).filter(x=>x!==d))} style={{background:"none",border:"none",color:"#DC2626",cursor:"pointer",fontWeight:800,fontSize:14,padding:0}}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Google Agenda */}
        {tab==="google-agenda" && (!isPro ? <ProLock color={color}/> : (
          <div style={{maxWidth:500}}>
            <div style={{background:"#fff",border:"1.5px solid #E5E7EB",borderRadius:12,padding:"16px"}}>
              <p style={{fontSize:12,fontWeight:700,color:"#9CA3AF",textTransform:"uppercase",margin:"0 0 12px"}}>📅 URL iCal Google Calendar</p>
              <input value={availability.googleCalendarUrl||""} onChange={e=>setAvail("googleCalendarUrl",e.target.value)} placeholder="https://calendar.google.com/calendar/ical/..." style={inputStyle}/>
              <a href="https://calendar.google.com/calendar/r/settings" target="_blank" rel="noreferrer" style={{display:"flex",alignItems:"center",gap:6,background:"#F3F4F6",border:"1.5px solid #E5E7EB",borderRadius:8,padding:"10px 14px",fontSize:13,fontWeight:700,color:"#374151",textDecoration:"none",marginTop:10,justifyContent:"center"}}>
                📅 Ouvrir Google Calendar →
              </a>
            </div>
          </div>
        ))}

        {/* Stats */}
        {tab==="stats" && (!isPro ? <ProLock color={color}/> : (
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:12}}>
            {[
              {label:"Total réservations",val:reservations.length,icon:"📋",c:color},
              {label:"En attente",val:reservations.filter(r=>r.statut==="attente").length,icon:"⏳",c:"#F59E0B"},
              {label:"Confirmées",val:reservations.filter(r=>r.statut==="confirme").length,icon:"✅",c:"#059669"},
              {label:"CA estimé",val:`${reservations.filter(r=>r.statut!=="annule").reduce((s,r)=>s+(parseFloat(r.total)||0),0).toFixed(0)}€`,icon:"💶",c:"#7C3AED"},
            ].map(s=>(
              <div key={s.label} style={{background:"#fff",border:"1.5px solid #E5E7EB",borderRadius:12,padding:"18px",textAlign:"center"}}>
                <div style={{fontSize:28,marginBottom:8}}>{s.icon}</div>
                <div style={{fontSize:26,fontWeight:900,color:s.c}}>{s.val}</div>
                <div style={{fontSize:12,color:"#9CA3AF",fontWeight:600,marginTop:4}}>{s.label}</div>
              </div>
            ))}
          </div>
        ))}

        {/* Mot de passe */}
        {tab==="mot-de-passe" && (
          <div style={{maxWidth:400}}>
            <div style={{background:"#fff",border:"1.5px solid #E5E7EB",borderRadius:12,padding:"20px"}}>
              {[{label:"Mot de passe actuel",val:pwdCurrent,set:setPwdCurrent},{label:"Nouveau mot de passe",val:pwdNew,set:setPwdNew},{label:"Confirmer",val:pwdConfirm,set:setPwdConfirm}].map(f=>(
                <div key={f.label} style={{marginBottom:14}}>
                  <label style={{fontSize:13,fontWeight:600,display:"block",marginBottom:5}}>{f.label}</label>
                  <input type="password" value={f.val} onChange={e=>f.set(e.target.value)} style={inputStyle}/>
                </div>
              ))}
              {pwdMsg&&<div style={{background:pwdMsg.ok?"#F0FDF4":"#FEF2F2",border:`1.5px solid ${pwdMsg.ok?"#059669":"#DC2626"}`,borderRadius:8,padding:"10px 14px",fontSize:13,color:pwdMsg.ok?"#059669":"#DC2626",fontWeight:600,marginBottom:12}}>{pwdMsg.ok?"✓ ":"✕ "}{pwdMsg.text}</div>}
              <button onClick={handlePasswordChange} style={{width:"100%",background:color,color:"#fff",border:"none",borderRadius:10,padding:"13px",fontWeight:800,fontSize:14,cursor:"pointer"}}>Changer le mot de passe</button>
            </div>
          </div>
        )}

        {showSave && (
          <div style={{marginTop:20}}>
            <button onClick={saveConfig} style={{background:saved?"#059669":color,color:"#fff",border:"none",borderRadius:10,padding:"13px 24px",fontWeight:800,fontSize:15,cursor:"pointer"}}>
              {saving?"⏳ Sauvegarde...":saved?"✓ Sauvegardé !":"💾 Sauvegarder les modifications"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
