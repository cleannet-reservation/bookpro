import { useState, useEffect } from "react";

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const fmt = (n) => Number(n).toFixed(2).replace(".", ",") + " €";
const uid = () => Math.random().toString(36).slice(2, 8);
const today = () => new Date().toISOString().split("T")[0];
const fmtDuration = (m) => { if (!m) return ""; const h = Math.floor(m/60), mn = m%60; return h===0?`${mn}min`:mn===0?`${h}h`:`${h}h${String(mn).padStart(2,"0")}`; };

const DAYS_FR = ["Dim","Lun","Mar","Mer","Jeu","Ven","Sam"];
const MONTHS_FR = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

const STEPS = ["Service","Options","Coordonnées","Récapitulatif"];

function generateSlots(start, end, dur) {
  if (!start||!end||!dur) return [];
  const [sh,sm]=start.split(":").map(Number),[eh,em]=end.split(":").map(Number);
  const s=sh*60+sm, e=eh*60+em; const slots=[];
  for(let t=s;t+dur<=e;t+=30){
    const hh=String(Math.floor(t/60)).padStart(2,"0"),mm=String(t%60).padStart(2,"0");
    const em2=t+dur, eh2=String(Math.floor(em2/60)).padStart(2,"0"),em2s=String(em2%60).padStart(2,"0");
    slots.push({start:`${hh}:${mm}`,end:`${eh2}:${em2s}`});
  }
  return slots;
}

function MiniCalendar({ availability, selected, onSelect, color }) {
  const schedules = availability?.daySchedules || {0:{active:false},1:{active:true,start:"08:00",end:"18:00"},2:{active:true,start:"08:00",end:"18:00"},3:{active:true,start:"08:00",end:"18:00"},4:{active:true,start:"08:00",end:"18:00"},5:{active:true,start:"08:00",end:"18:00"},6:{active:false}};
  const activeDays = Object.entries(schedules).filter(([,v])=>v.active).map(([k])=>Number(k));
  const now = new Date();
  const [vy,setVy]=useState(now.getFullYear());
  const [vm,setVm]=useState(now.getMonth());
  const first=new Date(vy,vm,1).getDay(), days=new Date(vy,vm+1,0).getDate();
  const toStr=(d)=>`${vy}-${String(vm+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
  const isAvail=(d)=>{
    const date=new Date(vy,vm,d); const t=new Date(); t.setHours(0,0,0,0);
    if(date<t)return false;
    if((availability?.blockedDates||[]).includes(toStr(d)))return false;
    return activeDays.includes(date.getDay());
  };
  const getSchedule=(ds)=>{ if(!ds)return null; return schedules[new Date(ds).getDay()]||null; };
  const cells=[]; for(let i=0;i<first;i++)cells.push(null); for(let d=1;d<=days;d++)cells.push(d);
  return (
    <div style={{border:"1.5px solid #E5E7EB",borderRadius:12,overflow:"hidden"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",background:color,color:"#fff"}}>
        <button onClick={()=>{if(vm===0){setVm(11);setVy(y=>y-1);}else setVm(m=>m-1);}} style={{background:"none",border:"none",color:"#fff",fontSize:18,cursor:"pointer",fontWeight:700}}>‹</button>
        <span style={{fontWeight:700,fontSize:15}}>{MONTHS_FR[vm]} {vy}</span>
        <button onClick={()=>{if(vm===11){setVm(0);setVy(y=>y+1);}else setVm(m=>m+1);}} style={{background:"none",border:"none",color:"#fff",fontSize:18,cursor:"pointer",fontWeight:700}}>›</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",background:"#F7F8FC"}}>
        {DAYS_FR.map(d=><div key={d} style={{textAlign:"center",fontSize:11,fontWeight:700,color:"#9CA3AF",padding:"8px 0"}}>{d}</div>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",padding:"8px"}}>
        {cells.map((d,i)=>{
          if(!d)return <div key={`e${i}`}/>;
          const ds=toStr(d),avail=isAvail(d),isSel=selected===ds;
          return <button key={d} disabled={!avail} onClick={()=>onSelect(ds)} style={{margin:2,borderRadius:8,border:"none",padding:"8px 4px",fontWeight:isSel?800:500,fontSize:13,background:isSel?color:avail?"#fff":"transparent",color:isSel?"#fff":avail?"#1A1F36":"#D1D5DB",cursor:avail?"pointer":"not-allowed",boxShadow:isSel?`0 2px 8px ${color}55`:"none"}}>{d}</button>;
        })}
      </div>
      {selected&&getSchedule(selected)&&<div style={{padding:"10px 16px 14px",borderTop:"1px solid #E5E7EB",fontSize:13}}>✅ <strong>{selected}</strong> — {getSchedule(selected).start} à {getSchedule(selected).end}</div>}
    </div>
  );
}

function ProgressBar({ step, color }) {
  return (
    <div style={{display:"flex",alignItems:"center",padding:"20px 24px 0"}}>
      {STEPS.map((label,i)=>(
        <div key={i} style={{display:"flex",alignItems:"center",flex:1}}>
          <div style={{width:28,height:28,borderRadius:"50%",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,background:i<=step?color:"#E5E7EB",color:i<=step?"#fff":"#9CA3AF",boxShadow:i===step?`0 0 0 3px ${color}22`:"none"}}>{i<step?"✓":i+1}</div>
          <span style={{fontSize:11,marginLeft:5,fontWeight:i<=step?700:500,color:i<=step?color:"#9CA3AF",whiteSpace:"nowrap"}}>{label}</span>
          {i<STEPS.length-1&&<div style={{flex:1,height:2,margin:"0 6px",background:i<step?color:"#E5E7EB"}}/>}
        </div>
      ))}
    </div>
  );
}

export default function Booking() {
  const slug = window.location.pathname.split("/booking/")[1];
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [step, setStep] = useState(0);
  const [service, setService] = useState(null);
  const [option, setOption] = useState(null);
  const [activeUpsells, setActiveUpsells] = useState([]);
  const [form, setForm] = useState({});
  const [payMode, setPayMode] = useState(null);
  const [requestDone, setRequestDone] = useState(false);
  const [paying, setPaying] = useState(false);
  const [surface, setSurface] = useState("");
  const [bookedSlots, setBookedSlots] = useState([]);

  useEffect(() => {
    if (!form.date || !slug) return;
    fetch(`/api/client-reservations?slug=${slug}&t=${Date.now()}`, { cache: "no-store" })
      .then(r => r.json())
      .then(data => {
        if (!Array.isArray(data)) return;
        const taken = data
          .filter(r => r.date === form.date && r.statut !== "annule")
          .map(r => {
            const parts = r.creneau?.split(" → ");
            if (!parts || parts.length < 2) return null;
            const [sh, sm] = parts[0].split(":").map(Number);
            const [eh, em] = parts[1].split(":").map(Number);
            return { start: sh * 60 + sm, end: eh * 60 + em };
          })
          .filter(Boolean);
        setBookedSlots(taken);
      })
      .catch(() => {});
  }, [form.date, slug]);

  useEffect(() => {
    sessionStorage.setItem("bookpro_slug", slug);
    fetch(`/api/clients?slug=${slug}`)
      .then(r => r.json())
      .then(data => { if (data.config) setConfig(data.config); else setError("Page introuvable"); })
      .catch(() => setError("Erreur de chargement"))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Inter,system-ui,sans-serif",color:"#6B7280"}}>⏳ Chargement…</div>;
  if (error) return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Inter,system-ui,sans-serif",color:"#DC2626"}}>❌ {error}</div>;

  const { company, services=[], upsells=[], availability } = config;
  const color = company?.accentColor || "#0057FF";

  const optionPrice = option
    ? option.priceType === "m2"
      ? Number(option.price) * (parseFloat(surface) || 0)
      : Number(option.price)
    : 0;
  const upsellTotal = upsells.filter(u => activeUpsells.includes(u.id)).reduce((s,u) => s+Number(u.price), 0);
  const subtotal = optionPrice + upsellTotal;
  const acompte = subtotal*(Number(company?.acomptePercent||30)/100);

  const canNext = () => {
    if(step===0) return !!service;
    if(step===1) return !!option && (option.priceType !== "m2" || parseFloat(surface) > 0);
    if(step===2) return !!(form.prenom&&form.nom&&form.email&&form.telephone&&form.adresse&&form.date&&form.timeSlot);
    return true;
  };

  const handleRequestOnly = () => {
    // Sauvegarder dans Supabase
    fetch("/api/client-reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug_client: slug,
        prenom: form.prenom, nom: form.nom, email: form.email,
        telephone: form.telephone, adresse: form.adresse,
        service: service.name, option: option.label,
        date: form.date, creneau: `${form.timeSlot} → ${form.timeSlotEnd}`,
        total: String(subtotal.toFixed(2)), acompte: "0",
        statut: "attente", source: "site",
      }),
    }).catch(() => {});

    // Envoyer sur WhatsApp
    if (company?.phone) {
      const msg = encodeURIComponent(
`🗓 *Nouvelle réservation*

👤 ${form.prenom} ${form.nom}
📞 ${form.telephone}
📧 ${form.email}
📍 ${form.adresse}

🧹 ${service.name} — ${option.label}
📅 ${form.date} · ${form.timeSlot} → ${form.timeSlotEnd}
💶 Total: ${subtotal.toFixed(2)}€
💳 Sans acompte`
      );
      window.open(`https://wa.me/${company.phone.replace(/\D/g,"")}?text=${msg}`, "_blank");
    }
    setRequestDone(true);
  };

  const Row = ({label,val,bold,color:c})=>(
    <div style={{display:"flex",justifyContent:"space-between",padding:"5px 0",fontSize:14}}>
      <span style={{color:"#6B7280"}}>{label}</span>
      <span style={{fontWeight:bold?800:600,color:c||"#1A1F36"}}>{val}</span>
    </div>
  );

  const recapCard = {background:"#F7F8FC",borderRadius:12,padding:"14px 18px",marginBottom:14};
  const inputStyle = {border:"1.5px solid #E5E7EB",borderRadius:8,padding:"9px 12px",fontSize:14,color:"#1A1F36",outline:"none",fontFamily:"inherit",background:"#fff",width:"100%",boxSizing:"border-box"};

  return (
    <div style={{minHeight:"100vh",background:"#F7F8FC",fontFamily:"'Inter',system-ui,sans-serif",color:"#1A1F36"}}>
      {/* Header */}
      <header style={{background:"#fff",borderBottom:"1px solid #E5E7EB",position:"sticky",top:0,zIndex:9}}>
        <div style={{maxWidth:720,margin:"0 auto",padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:22,color,fontWeight:900}}>✦</span>
            <div>
              <div style={{fontWeight:800,fontSize:16,letterSpacing:"-0.5px"}}>{company?.name}</div>
              <div style={{fontSize:11,color:"#6B7280"}}>{company?.tagline}</div>
            </div>
          </div>
          <span style={{background:color+"15",color,fontSize:12,fontWeight:600,padding:"4px 10px",borderRadius:20}}>Réservation en ligne</span>
        </div>
      </header>

      <main style={{flex:1,padding:"24px 16px 48px",maxWidth:720,margin:"0 auto",width:"100%",boxSizing:"border-box"}}>
        <div style={{background:"#fff",borderRadius:16,boxShadow:"0 2px 16px rgba(0,0,0,0.07)",overflow:"hidden"}}>
          <ProgressBar step={step} color={color} />

          <div style={{padding:"24px 24px 8px"}}>

            {/* STEP 0 */}
            {step===0&&(
              <>
                <h2 style={{fontSize:20,fontWeight:800,margin:"0 0 4px"}}>Quelle prestation souhaitez-vous ?</h2>
                <p style={{color:"#6B7280",fontSize:14,margin:"0 0 18px"}}>Sélectionnez un service</p>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(175px,1fr))",gap:12}}>
                  {services.map(s=>(
                    <button key={s.id} onClick={()=>{setService(s);setOption(null);}} style={{border:`2px solid ${service?.id===s.id?color:"#E5E7EB"}`,background:service?.id===s.id?color+"11":"#fff",borderRadius:12,padding:"16px 12px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"flex-start",gap:4,textAlign:"left"}}>
                      <span style={{fontSize:26}}>{s.icon}</span>
                      <span style={{fontWeight:700,fontSize:14}}>{s.name}</span>
                      <span style={{fontSize:12,color:"#6B7280",lineHeight:1.4}}>{s.description}</span>
                      <span style={{fontSize:13,fontWeight:700,color,marginTop:4}}>À partir de {fmt(Math.min(...s.options.map(o=>o.price)))}</span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* STEP 1 */}
            {step===1&&service&&(
              <>
                <h2 style={{fontSize:20,fontWeight:800,margin:"0 0 4px"}}>{service.icon} {service.name}</h2>
                <p style={{color:"#6B7280",fontSize:14,margin:"0 0 16px"}}>Choisissez votre formule</p>
                <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:16}}>
                  {service.options.map(opt=>(
                    <button key={opt.id} onClick={()=>{setOption(opt);setSurface("");}} style={{border:`2px solid ${option?.id===opt.id?color:"#E5E7EB"}`,background:option?.id===opt.id?color+"11":"#fff",borderRadius:10,padding:"14px 16px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                      <span style={{fontWeight:600,fontSize:14}}>{opt.label}</span>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <span style={{fontWeight:800,fontSize:15,color}}>
                          {opt.priceType === "m2" ? `${fmt(opt.price)}/m²` : fmt(opt.price)}
                        </span>
                        {opt.duration&&<span style={{fontSize:12,color:"#9CA3AF"}}>({fmtDuration(opt.duration)})</span>}
                        {option?.id===opt.id&&<span style={{background:color,color:"#fff",borderRadius:"50%",width:20,height:20,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700}}>✓</span>}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Champ surface si prix au m² */}
                {option?.priceType === "m2" && (
                  <div style={{background:"#EEF3FF",border:`1.5px solid ${color}`,borderRadius:12,padding:"16px 18px",marginBottom:16}}>
                    <label style={{fontSize:14,fontWeight:700,display:"block",marginBottom:8,color:"#1A1F36"}}>
                      📐 Quelle est la surface à nettoyer ?
                    </label>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <input type="number" min="1" placeholder="ex: 30" value={surface} onChange={e=>setSurface(e.target.value)}
                        style={{border:"1.5px solid #E5E7EB",borderRadius:8,padding:"10px 14px",fontSize:16,fontWeight:600,width:100,outline:"none",fontFamily:"inherit"}}/>
                      <span style={{fontSize:15,fontWeight:600,color:"#6B7280"}}>m²</span>
                      {surface && parseFloat(surface) > 0 && (
                        <span style={{marginLeft:"auto",fontSize:16,fontWeight:800,color}}>
                          = {fmt(Number(option.price) * parseFloat(surface))}
                        </span>
                      )}
                    </div>
                    {surface && parseFloat(surface) > 0 && (
                      <p style={{fontSize:12,color:"#6B7280",margin:"8px 0 0"}}>
                        {parseFloat(surface)} m² × {fmt(option.price)}/m² = <strong style={{color}}>{fmt(Number(option.price) * parseFloat(surface))}</strong>
                      </p>
                    )}
                  </div>
                )}

                {/* Upsells filtrés par service */}
                {upsells.filter(u => !u.services || u.services.length === 0 || u.services.includes(service?.id)).length > 0 && (
                  <>
                    <h3 style={{fontSize:16,fontWeight:800,margin:"0 0 12px"}}>✨ Ajoutez un service complémentaire</h3>
                    <div style={{display:"flex",flexDirection:"column",gap:10}}>
                      {upsells.filter(u => !u.services || u.services.length === 0 || u.services.includes(service?.id)).map(u=>{
                        const active=activeUpsells.includes(u.id);
                        return <button key={u.id} onClick={()=>setActiveUpsells(p=>active?p.filter(x=>x!==u.id):[...p,u.id])} style={{border:`2px solid ${active?"#059669":"#E5E7EB"}`,background:active?"#F0FDF4":"#fff",borderRadius:10,padding:"12px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:12}}>
                          <span style={{fontSize:22}}>{u.icon}</span>
                          <div style={{flex:1,textAlign:"left"}}><div style={{fontWeight:600,fontSize:14}}>{u.name}</div><div style={{fontSize:13,color:"#059669",fontWeight:700}}>+{fmt(u.price)}</div></div>
                          <span style={{fontSize:12,fontWeight:700,padding:"4px 10px",borderRadius:20,background:active?"#DCFCE7":color+"11",color:active?"#059669":color}}>{active?"✓ Ajouté":"+ Ajouter"}</span>
                        </button>;
                      })}
                    </div>
                  </>
                )}
              </>
            )}

            {/* STEP 2 */}
            {step===2&&(
              <>
                <h2 style={{fontSize:20,fontWeight:800,margin:"0 0 4px"}}>Vos coordonnées</h2>
                <p style={{color:"#6B7280",fontSize:14,margin:"0 0 18px"}}>Nous confirmerons le rendez-vous</p>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                  {[{id:"prenom",label:"Prénom",ph:"Marie"},{id:"nom",label:"Nom",ph:"Dupont"},{id:"email",label:"Email",type:"email",ph:"marie@exemple.fr",full:true},{id:"telephone",label:"Téléphone",type:"tel",ph:"06 12 34 56 78"},{id:"adresse",label:"Adresse d'intervention",ph:"12 rue des Fleurs",full:true}].map(f=>(
                    <div key={f.id} style={{gridColumn:f.full?"1 / -1":undefined,display:"flex",flexDirection:"column",gap:4}}>
                      <label style={{fontSize:13,fontWeight:600}}>{f.label}</label>
                      <input type={f.type||"text"} style={inputStyle} placeholder={f.ph} value={form[f.id]||""} onChange={e=>setForm(p=>({...p,[f.id]:e.target.value}))}/>
                    </div>
                  ))}
                  <div style={{gridColumn:"1 / -1"}}>
                    <label style={{fontSize:13,fontWeight:600,display:"block",marginBottom:6}}>Date souhaitée</label>
                    <MiniCalendar availability={availability} selected={form.date} onSelect={d=>setForm(p=>({...p,date:d,timeSlot:null}))} color={color}/>
                  </div>
                  {form.date&&option&&(()=>{
                    const dateObj=new Date(form.date);
                    const ds=availability?.daySchedules?.[dateObj.getDay()];
                    const dur=Number(option.duration)||60;
                    const slots=ds?generateSlots(ds.start,ds.end,dur):[];
                    return <div style={{gridColumn:"1 / -1"}}>
                      <label style={{fontSize:13,fontWeight:600,display:"block",marginBottom:6}}>Créneau horaire <span style={{fontSize:12,color:"#6B7280",fontWeight:500}}>Durée : {fmtDuration(dur)}</span></label>
                      {slots.length===0?<div style={{background:"#FEF2F2",border:"1.5px solid #FCA5A5",borderRadius:10,padding:"12px 16px",fontSize:13,color:"#DC2626"}}>Aucun créneau disponible ce jour.</div>:
                      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(110px,1fr))",gap:8}}>
                        {slots.map(slot=>{
                          const isSel=form.timeSlot===slot.start;
                          const [sh,sm]=slot.start.split(":").map(Number);
                          const [eh,em]=slot.end.split(":").map(Number);
                          const slotStart=sh*60+sm, slotEnd=eh*60+em;
                          const isBooked=bookedSlots.some(b=>slotStart<b.end&&slotEnd>b.start);
                          return <button key={slot.start}
                            onClick={()=>!isBooked&&setForm(p=>({...p,timeSlot:slot.start,timeSlotEnd:slot.end}))}
                            disabled={isBooked}
                            style={{border:`2px solid ${isBooked?"#E5E7EB":isSel?color:"#E5E7EB"}`,background:isBooked?"#F3F4F6":isSel?color:"#fff",color:isBooked?"#D1D5DB":isSel?"#fff":"#1A1F36",borderRadius:10,padding:"10px 8px",cursor:isBooked?"not-allowed":"pointer",fontWeight:isSel?800:600,fontSize:13,display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
                            <span style={{fontSize:15,textDecoration:isBooked?"line-through":"none"}}>{slot.start}</span>
                            <span style={{fontSize:11,opacity:.75}}>{isBooked?"Réservé":`→ ${slot.end}`}</span>
                          </button>;
                        })}
                      </div>}
                    </div>;
                  })()}
                  <div style={{gridColumn:"1 / -1",display:"flex",flexDirection:"column",gap:4}}>
                    <label style={{fontSize:13,fontWeight:600}}>Infos complémentaires (optionnel)</label>
                    <textarea style={{...inputStyle,height:70,resize:"vertical"}} placeholder="Accès, étage…" value={form.message||""} onChange={e=>setForm(p=>({...p,message:e.target.value}))}/>
                  </div>
                </div>
              </>
            )}

            {/* STEP 3 */}
            {step===3&&(
              <>
                <h2 style={{fontSize:20,fontWeight:800,margin:"0 0 16px"}}>Récapitulatif</h2>
                <div style={recapCard}>
                  <Row label={`${service.icon} ${service.name}`} val={option?.label}/>
                  <Row label="Prix de base" val={fmt(option?.price||0)}/>
                  {upsells.filter(u=>activeUpsells.includes(u.id)).map(u=><Row key={u.id} label={`${u.icon} ${u.name}`} val={`+${fmt(u.price)}`}/>)}
                  <div style={{height:1,background:"#E5E7EB",margin:"8px 0"}}/>
                  <Row label="Total estimé" val={fmt(subtotal)} bold/>
                </div>
                <div style={recapCard}>
                  <p style={{fontSize:12,fontWeight:700,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:"0.5px",margin:"0 0 10px"}}>Détails</p>
                  <Row label="Client" val={`${form.prenom} ${form.nom}`}/>
                  <Row label="Date" val={form.date}/>
                  <Row label="Créneau" val={`${form.timeSlot} → ${form.timeSlotEnd}`}/>
                  <Row label="Adresse" val={form.adresse}/>
                </div>

                {!requestDone&&(
                  <>
                    <p style={{fontSize:14,fontWeight:700,margin:"0 0 10px"}}>Comment confirmer votre réservation ?</p>
                    <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:20}}>
                      <button onClick={()=>setPayMode("acompte")} style={{border:`2px solid ${payMode==="acompte"?color:"#E5E7EB"}`,background:payMode==="acompte"?color+"0D":"#fff",borderRadius:12,padding:"16px",cursor:"pointer",textAlign:"left"}}>
                        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
                          <span style={{fontSize:20}}>🔒</span>
                          <span style={{fontWeight:800,fontSize:14}}>Payer un acompte — {fmt(acompte)}</span>
                          {payMode==="acompte"&&<span style={{marginLeft:"auto",background:color,color:"#fff",borderRadius:"50%",width:20,height:20,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700}}>✓</span>}
                        </div>
                        <p style={{margin:0,fontSize:12,color:"#6B7280",lineHeight:1.5}}>Créneau bloqué immédiatement. Paiement sécurisé via Stripe.</p>
                      </button>
                      <button onClick={()=>setPayMode("sans")} style={{border:`2px solid ${payMode==="sans"?"#059669":"#E5E7EB"}`,background:payMode==="sans"?"#F0FDF4":"#fff",borderRadius:12,padding:"16px",cursor:"pointer",textAlign:"left"}}>
                        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
                          <span style={{fontSize:20}}>📋</span>
                          <span style={{fontWeight:800,fontSize:14}}>Demande sans acompte</span>
                          {payMode==="sans"&&<span style={{marginLeft:"auto",background:"#059669",color:"#fff",borderRadius:"50%",width:20,height:20,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700}}>✓</span>}
                        </div>
                        <p style={{margin:0,fontSize:12,color:"#6B7280",lineHeight:1.5}}>Demande envoyée sans paiement. Le prestataire vous confirme le créneau.</p>
                      </button>
                    </div>
                    {payMode==="acompte"&&(
                      <button style={{width:"100%",background:color,color:"#fff",border:"none",borderRadius:10,padding:16,fontSize:15,fontWeight:800,cursor:"pointer"}}>
                        Payer l'acompte — {fmt(acompte)}
                      </button>
                    )}
                    {payMode==="sans"&&(
                      <button onClick={handleRequestOnly} style={{width:"100%",background:"#25D366",color:"#fff",border:"none",borderRadius:10,padding:16,fontSize:15,fontWeight:800,cursor:"pointer"}}>
                        📲 Envoyer ma réservation sur WhatsApp →
                      </button>
                    )}
                  </>
                )}

                {requestDone&&(
                  <div style={{textAlign:"center",padding:"24px 0"}}>
                    <div style={{fontSize:48,marginBottom:12}}>📬</div>
                    <h3 style={{fontSize:18,fontWeight:800,margin:"0 0 8px"}}>Demande envoyée !</h3>
                    <p style={{fontSize:14,color:"#6B7280",lineHeight:1.7,margin:"0 0 16px"}}>Merci <strong>{form.prenom}</strong>. Nous vous contacterons sous 24h pour confirmer votre rendez-vous du <strong>{form.date}</strong>.</p>
                    <button onClick={()=>{setStep(0);setService(null);setOption(null);setActiveUpsells([]);setForm({});setPayMode(null);setRequestDone(false);}} style={{background:color,color:"#fff",border:"none",borderRadius:8,padding:"11px 24px",fontWeight:700,fontSize:14,cursor:"pointer"}}>
                      Nouvelle réservation
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {step<3&&!requestDone&&(
            <div style={{display:"flex",justifyContent:"space-between",padding:"16px 24px 24px",borderTop:"1px solid #E5E7EB",gap:12,marginTop:8}}>
              {step>0?<button onClick={()=>setStep(s=>s-1)} style={{background:"none",border:"1.5px solid #E5E7EB",borderRadius:8,padding:"10px 18px",fontSize:14,fontWeight:600,color:"#6B7280",cursor:"pointer"}}>← Retour</button>:<div/>}
              {step<3&&<button onClick={()=>canNext()&&setStep(s=>s+1)} disabled={!canNext()} style={{background:canNext()?color:"#E5E7EB",color:canNext()?"#fff":"#9CA3AF",border:"none",borderRadius:8,padding:"11px 24px",fontSize:14,fontWeight:700,marginLeft:"auto",cursor:canNext()?"pointer":"not-allowed"}}>
                {step===2?"Voir le récapitulatif →":"Continuer →"}
              </button>}
            </div>
          )}
        </div>
      </main>

      <footer style={{padding:"18px",textAlign:"center",fontSize:12,color:"#9CA3AF",borderTop:"1px solid #E5E7EB"}}>
        © 2026 {company?.name} · Powered by <a href="/" style={{color,fontWeight:700,textDecoration:"none"}}>BookPro</a>
      </footer>
    </div>
  );
}
