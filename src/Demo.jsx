import { useState } from "react";

const DAYS_FR = ["Dim","Lun","Mar","Mer","Jeu","Ven","Sam"];
const MONTHS_FR = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const STEPS = ["Service","Options","Coordonnées","Récapitulatif"];

const fmt = (n) => Number(n).toFixed(2).replace(".",",") + " €";
const uid = () => Math.random().toString(36).slice(2,8);
const fmtDuration = (m) => { if(!m) return ""; const h=Math.floor(m/60),mn=m%60; return h===0?`${mn}min`:mn===0?`${h}h`:`${h}h${String(mn).padStart(2,"0")}`; };

const DEMO_COLOR = "#0057FF";

const DEMO_SERVICES = [
  { id:"canape", icon:"🛋️", name:"Nettoyage Canapé", description:"Nettoyage en profondeur, détachage et désodorisation", options:[{id:"c1",label:"2 places",price:89,duration:60},{id:"c2",label:"3 places",price:109,duration:90},{id:"c3",label:"Canapé d'angle",price:139,duration:120}] },
  { id:"matelas", icon:"🛏️", name:"Nettoyage Matelas", description:"Assainissement, anti-acariens et désodorisation", options:[{id:"m1",label:"1 personne",price:69,duration:45},{id:"m2",label:"2 personnes",price:89,duration:60}] },
  { id:"voiture", icon:"🚗", name:"Nettoyage Voiture", description:"Intérieur complet, sièges, moquettes, tableau de bord", options:[{id:"v1",label:"Citadine",price:79,duration:90},{id:"v2",label:"SUV",price:99,duration:120}] },
  { id:"vitres", icon:"🪟", name:"Nettoyage Vitres", description:"Vitres intérieur/extérieur, sans traces", options:[{id:"vi1",label:"Appartement",price:59,duration:60},{id:"vi2",label:"Maison",price:99,duration:120}] },
];

const DEMO_UPSELLS = [
  { id:"u1", icon:"🦠", name:"Désinfection antibactérienne", price:29 },
  { id:"u2", icon:"🌿", name:"Désodorisation naturelle", price:19 },
];

const DEMO_AVAILABILITY = {
  daySchedules: {
    1:{active:true,start:"08:00",end:"18:00"},
    2:{active:true,start:"08:00",end:"18:00"},
    3:{active:true,start:"08:00",end:"18:00"},
    4:{active:true,start:"08:00",end:"18:00"},
    5:{active:true,start:"08:00",end:"17:00"},
    6:{active:true,start:"09:00",end:"13:00"},
  },
  blockedDates:[],
};

const generateSlots = (start, end, duration) => {
  if(!start||!end||!duration) return [];
  const [sh,sm]=start.split(":").map(Number);
  const [eh,em]=end.split(":").map(Number);
  const s=sh*60+sm, e=eh*60+em;
  const slots=[];
  for(let t=s; t+duration<=e; t+=30) {
    const hh=String(Math.floor(t/60)).padStart(2,"0"),mm=String(t%60).padStart(2,"0");
    const et=t+duration;
    slots.push({start:`${hh}:${mm}`,end:`${String(Math.floor(et/60)).padStart(2,"0")}:${String(et%60).padStart(2,"0")}`});
  }
  return slots;
};

function MiniCalendar({ selected, onSelect }) {
  const now = new Date();
  const [vy,setVy]=useState(now.getFullYear());
  const [vm,setVm]=useState(now.getMonth());
  const first=new Date(vy,vm,1).getDay();
  const days=new Date(vy,vm+1,0).getDate();
  const toStr=(d)=>`${vy}-${String(vm+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
  const isAvail=(d)=>{ const date=new Date(vy,vm,d); const t=new Date(); t.setHours(0,0,0,0); if(date<t) return false; const sched=DEMO_AVAILABILITY.daySchedules[date.getDay()]; return sched?.active; };
  const cells=[]; for(let i=0;i<first;i++) cells.push(null); for(let d=1;d<=days;d++) cells.push(d);
  return (
    <div style={{border:"1.5px solid #E5E7EB",borderRadius:12,overflow:"hidden"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",background:DEMO_COLOR,color:"#fff"}}>
        <button onClick={()=>{if(vm===0){setVm(11);setVy(y=>y-1);}else setVm(m=>m-1);}} style={{background:"none",border:"none",color:"#fff",fontSize:18,cursor:"pointer",padding:"0 8px"}}>‹</button>
        <span style={{fontWeight:700,fontSize:15}}>{MONTHS_FR[vm]} {vy}</span>
        <button onClick={()=>{if(vm===11){setVm(0);setVy(y=>y+1);}else setVm(m=>m+1);}} style={{background:"none",border:"none",color:"#fff",fontSize:18,cursor:"pointer",padding:"0 8px"}}>›</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",background:"#F7F8FC"}}>
        {DAYS_FR.map(d=><div key={d} style={{textAlign:"center",fontSize:11,fontWeight:700,color:"#9CA3AF",padding:"8px 0"}}>{d}</div>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",padding:"8px"}}>
        {cells.map((d,i)=>{
          if(!d) return <div key={`e${i}`}/>;
          const ds=toStr(d), avail=isAvail(d), isSel=selected===ds;
          return <button key={d} disabled={!avail} onClick={()=>onSelect(ds)} style={{margin:2,borderRadius:8,border:"none",padding:"8px 4px",fontSize:13,background:isSel?DEMO_COLOR:avail?"#fff":"transparent",color:isSel?"#fff":avail?"#1A1F36":"#D1D5DB",cursor:avail?"pointer":"not-allowed",fontWeight:isSel?800:500,boxShadow:isSel?`0 2px 8px ${DEMO_COLOR}55`:"none"}}>{d}</button>;
        })}
      </div>
      {selected && <div style={{padding:"10px 16px",borderTop:"1px solid #E5E7EB",fontSize:13,color:"#374151"}}>✅ <strong>{selected}</strong></div>}
    </div>
  );
}

export default function Demo() {
  const [step, setStep] = useState(0);
  const [service, setService] = useState(null);
  const [option, setOption] = useState(null);
  const [activeUpsells, setActiveUpsells] = useState([]);
  const [form, setForm] = useState({});
  const [done, setDone] = useState(false);

  const canNext = () => {
    if(step===0) return !!service;
    if(step===1) return !!option;
    if(step===2) return !!(form.prenom&&form.nom&&form.email&&form.telephone&&form.adresse&&form.date&&form.timeSlot);
    return true;
  };

  const upsellTotal = DEMO_UPSELLS.filter(u=>activeUpsells.includes(u.id)).reduce((s,u)=>s+u.price,0);
  const subtotal = (option?Number(option.price):0) + upsellTotal;
  const acompte = subtotal * 0.30;

  const ProgressBar = () => (
    <div style={{display:"flex",alignItems:"center",padding:"20px 24px 0"}}>
      {STEPS.map((label,i)=>(
        <div key={i} style={{display:"flex",alignItems:"center",flex:1}}>
          <div style={{width:28,height:28,borderRadius:"50%",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,background:i<=step?DEMO_COLOR:"#E5E7EB",color:i<=step?"#fff":"#9CA3AF",boxShadow:i===step?`0 0 0 3px ${DEMO_COLOR}22`:"none"}}>
            {i<step?"✓":i+1}
          </div>
          <span style={{fontSize:11,marginLeft:5,fontWeight:i<=step?700:500,color:i<=step?DEMO_COLOR:"#9CA3AF",whiteSpace:"nowrap"}}>{label}</span>
          {i<STEPS.length-1&&<div style={{flex:1,height:2,margin:"0 6px",background:i<step?DEMO_COLOR:"#E5E7EB"}}/>}
        </div>
      ))}
    </div>
  );

  if(done) return (
    <div style={{minHeight:"100vh",background:"#F7F8FC",fontFamily:"Inter,sans-serif"}}>
      {/* Demo banner */}
      <div style={{background:"linear-gradient(135deg,#0057FF,#00D4FF)",color:"#fff",padding:"10px 20px",textAlign:"center",fontSize:13,fontWeight:600}}>
        🎯 Mode démo — Aucun paiement réel
      </div>
      <div style={{maxWidth:560,margin:"60px auto",padding:"0 16px",textAlign:"center"}}>
        <div style={{background:"#fff",borderRadius:20,padding:"48px 36px",boxShadow:"0 4px 24px rgba(0,0,0,0.08)"}}>
          <div style={{fontSize:56,marginBottom:16}}>🎉</div>
          <h2 style={{fontSize:24,fontWeight:900,margin:"0 0 12px",color:"#1A1F36"}}>Voilà ce que verrait votre client !</h2>
          <p style={{fontSize:15,color:"#6B7280",lineHeight:1.7,marginBottom:28}}>
            En vrai, votre client recevrait une confirmation par email et WhatsApp. Son acompte de <strong style={{color:DEMO_COLOR}}>{fmt(acompte)}</strong> serait encaissé automatiquement via Stripe.
          </p>

          <div style={{background:"#F0FDF4",border:"1.5px solid #059669",borderRadius:12,padding:"16px 20px",marginBottom:24,textAlign:"left"}}>
            <p style={{fontSize:13,fontWeight:700,color:"#059669",margin:"0 0 8px"}}>✅ Ce qui se passe automatiquement :</p>
            {["Email de confirmation envoyé au client","Notification WhatsApp reçue sur votre téléphone","Acompte encaissé via Stripe","Événement créé dans Google Agenda","Réservation visible dans votre tableau de bord"].map(t=>(
              <div key={t} style={{fontSize:13,color:"#374151",marginBottom:4}}>✓ {t}</div>
            ))}
          </div>

          <div style={{background:"linear-gradient(135deg,#0A1628,#112240)",borderRadius:14,padding:"28px 24px",marginBottom:20}}>
            <p style={{fontSize:13,color:"#8899BB",margin:"0 0 4px"}}>Prêt à avoir votre propre page comme celle-ci ?</p>
            <p style={{fontSize:20,fontWeight:900,color:"#F0F6FF",margin:"0 0 20px"}}>Créez votre compte en 2 minutes</p>
            <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
              <a href="/inscription?plan=starter" style={{display:"inline-block",background:"transparent",color:"#00D4FF",textDecoration:"none",borderRadius:8,padding:"11px 20px",fontWeight:700,fontSize:14,border:"2px solid #00D4FF"}}>
                Starter 15€/mois
              </a>
              <a href="/inscription?plan=pro" style={{display:"inline-block",background:"#00D4FF",color:"#0A1628",textDecoration:"none",borderRadius:8,padding:"11px 20px",fontWeight:800,fontSize:14}}>
                ⭐ Pro 30€/mois →
              </a>
            </div>
          </div>

          <button onClick={()=>{setDone(false);setStep(0);setService(null);setOption(null);setActiveUpsells([]);setForm({});}} style={{background:"none",border:"1.5px solid #E5E7EB",borderRadius:8,padding:"10px 20px",fontSize:13,fontWeight:600,cursor:"pointer",color:"#6B7280"}}>
            ↩ Recommencer la démo
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:"#F7F8FC",fontFamily:"Inter,system-ui,sans-serif",color:"#1A1F36"}}>
      {/* Demo banner */}
      <div style={{background:"linear-gradient(135deg,#0057FF,#00D4FF)",color:"#fff",padding:"10px 20px",textAlign:"center",fontSize:13,fontWeight:600}}>
        🎯 Mode démo — Aucun paiement réel · <a href="/inscription" style={{color:"#fff",fontWeight:800,marginLeft:8}}>Créer mon compte →</a>
      </div>

      <header style={{background:"#fff",borderBottom:"1px solid #E5E7EB",position:"sticky",top:0,zIndex:9}}>
        <div style={{maxWidth:720,margin:"0 auto",padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:22,color:DEMO_COLOR,fontWeight:900}}>✦</span>
            <div>
              <div style={{fontWeight:800,fontSize:16}}>CleanPro Demo</div>
              <div style={{fontSize:11,color:"#6B7280"}}>Nettoyage professionnel à domicile</div>
            </div>
          </div>
          <span style={{background:DEMO_COLOR+"15",color:DEMO_COLOR,fontSize:12,fontWeight:600,padding:"4px 10px",borderRadius:20}}>Réservation en ligne</span>
        </div>
      </header>

      <main style={{flex:1,padding:"24px 16px 48px",maxWidth:720,margin:"0 auto",width:"100%",boxSizing:"border-box"}}>
        <div style={{background:"#fff",borderRadius:16,boxShadow:"0 2px 16px rgba(0,0,0,0.07)",overflow:"hidden"}}>
          <ProgressBar/>
          <div style={{padding:"24px 24px 8px"}}>

            {/* Step 0 */}
            {step===0&&(
              <>
                <h2 style={{fontSize:20,fontWeight:800,margin:"0 0 4px"}}>Quelle prestation souhaitez-vous ?</h2>
                <p style={{color:"#6B7280",fontSize:14,margin:"0 0 18px"}}>Sélectionnez un service</p>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(175px,1fr))",gap:12}}>
                  {DEMO_SERVICES.map(s=>(
                    <button key={s.id} onClick={()=>{setService(s);setOption(null);}} style={{border:`2px solid ${service?.id===s.id?DEMO_COLOR:"#E5E7EB"}`,background:service?.id===s.id?DEMO_COLOR+"11":"#fff",borderRadius:12,padding:"16px 12px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"flex-start",gap:4,textAlign:"left"}}>
                      <span style={{fontSize:26}}>{s.icon}</span>
                      <span style={{fontWeight:700,fontSize:14}}>{s.name}</span>
                      <span style={{fontSize:12,color:"#6B7280",lineHeight:1.4}}>{s.description}</span>
                      <span style={{fontSize:13,fontWeight:700,color:DEMO_COLOR,marginTop:4}}>À partir de {fmt(Math.min(...s.options.map(o=>o.price)))}</span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Step 1 */}
            {step===1&&service&&(
              <>
                <h2 style={{fontSize:20,fontWeight:800,margin:"0 0 4px"}}>{service.icon} {service.name}</h2>
                <p style={{color:"#6B7280",fontSize:14,margin:"0 0 16px"}}>Choisissez votre formule</p>
                <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:24}}>
                  {service.options.map(opt=>(
                    <button key={opt.id} onClick={()=>setOption(opt)} style={{border:`2px solid ${option?.id===opt.id?DEMO_COLOR:"#E5E7EB"}`,background:option?.id===opt.id?DEMO_COLOR+"11":"#fff",borderRadius:10,padding:"14px 16px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                      <span style={{fontWeight:600,fontSize:14}}>{opt.label}</span>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <span style={{fontWeight:800,fontSize:15,color:DEMO_COLOR}}>{fmt(opt.price)}</span>
                        <span style={{fontSize:12,color:"#6B7280"}}>({fmtDuration(opt.duration)})</span>
                        {option?.id===opt.id&&<span style={{background:DEMO_COLOR,color:"#fff",borderRadius:"50%",width:20,height:20,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700}}>✓</span>}
                      </div>
                    </button>
                  ))}
                </div>
                <h3 style={{fontSize:16,fontWeight:800,margin:"0 0 4px"}}>✨ Services complémentaires</h3>
                <p style={{color:"#6B7280",fontSize:14,margin:"0 0 12px"}}>Augmentez votre panier</p>
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  {DEMO_UPSELLS.map(u=>{
                    const active=activeUpsells.includes(u.id);
                    return <button key={u.id} onClick={()=>setActiveUpsells(p=>active?p.filter(x=>x!==u.id):[...p,u.id])} style={{border:`2px solid ${active?"#059669":"#E5E7EB"}`,background:active?"#F0FDF4":"#fff",borderRadius:10,padding:"12px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:12}}>
                      <span style={{fontSize:22}}>{u.icon}</span>
                      <div style={{flex:1,textAlign:"left"}}><div style={{fontWeight:600,fontSize:14}}>{u.name}</div><div style={{fontSize:13,color:"#059669",fontWeight:700}}>+{fmt(u.price)}</div></div>
                      <span style={{fontSize:12,fontWeight:700,padding:"4px 10px",borderRadius:20,background:active?"#DCFCE7":DEMO_COLOR+"11",color:active?"#059669":DEMO_COLOR}}>{active?"✓ Ajouté":"+ Ajouter"}</span>
                    </button>;
                  })}
                </div>
              </>
            )}

            {/* Step 2 */}
            {step===2&&(
              <>
                <h2 style={{fontSize:20,fontWeight:800,margin:"0 0 4px"}}>Vos coordonnées</h2>
                <p style={{color:"#6B7280",fontSize:14,margin:"0 0 18px"}}>Aucune donnée réelle n'est enregistrée en mode démo</p>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                  {[{id:"prenom",label:"Prénom",ph:"Marie"},{id:"nom",label:"Nom",ph:"Dupont"},{id:"email",label:"Email",type:"email",ph:"marie@exemple.fr",full:true},{id:"telephone",label:"Téléphone",type:"tel",ph:"06 12 34 56 78"},{id:"adresse",label:"Adresse",ph:"12 rue des Fleurs, Nice",full:true}].map(f=>(
                    <div key={f.id} style={{gridColumn:f.full?"1 / -1":undefined,display:"flex",flexDirection:"column",gap:4}}>
                      <label style={{fontSize:13,fontWeight:600}}>{f.label}</label>
                      <input type={f.type||"text"} placeholder={f.ph} value={form[f.id]||""} onChange={e=>setForm(p=>({...p,[f.id]:e.target.value}))} style={{border:"1.5px solid #E5E7EB",borderRadius:8,padding:"9px 12px",fontSize:14,outline:"none",fontFamily:"inherit",background:"#fff",width:"100%",boxSizing:"border-box"}}/>
                    </div>
                  ))}
                  <div style={{gridColumn:"1 / -1"}}>
                    <label style={{fontSize:13,fontWeight:600,display:"block",marginBottom:6}}>Date souhaitée</label>
                    <MiniCalendar selected={form.date} onSelect={d=>setForm(p=>({...p,date:d,timeSlot:null}))}/>
                  </div>
                  {form.date&&option&&(()=>{
                    const sched=DEMO_AVAILABILITY.daySchedules[new Date(form.date).getDay()];
                    const slots=sched?generateSlots(sched.start,sched.end,option.duration||60):[];
                    return (
                      <div style={{gridColumn:"1 / -1"}}>
                        <label style={{fontSize:13,fontWeight:600,display:"block",marginBottom:6}}>Créneau <span style={{fontSize:12,color:"#6B7280",fontWeight:400}}>({fmtDuration(option.duration)})</span></label>
                        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(110px,1fr))",gap:8}}>
                          {slots.map(slot=>{
                            const isSel=form.timeSlot===slot.start;
                            return <button key={slot.start} onClick={()=>setForm(p=>({...p,timeSlot:slot.start,timeSlotEnd:slot.end}))} style={{border:`2px solid ${isSel?DEMO_COLOR:"#E5E7EB"}`,background:isSel?DEMO_COLOR:"#fff",color:isSel?"#fff":"#1A1F36",borderRadius:10,padding:"10px 8px",cursor:"pointer",fontWeight:isSel?800:600,fontSize:13,display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
                              <span style={{fontSize:15}}>{slot.start}</span>
                              <span style={{fontSize:11,opacity:0.75}}>→ {slot.end}</span>
                            </button>;
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </>
            )}

            {/* Step 3 */}
            {step===3&&(
              <>
                <h2 style={{fontSize:20,fontWeight:800,margin:"0 0 16px"}}>Récapitulatif</h2>
                <div style={{background:"#F7F8FC",borderRadius:12,padding:"14px 18px",marginBottom:14}}>
                  {[[`${service.icon} ${service.name}`,option?.label],["Prix de base",fmt(option?.price||0)],...DEMO_UPSELLS.filter(u=>activeUpsells.includes(u.id)).map(u=>[`${u.icon} ${u.name}`,`+${fmt(u.price)}`])].map(([l,v],i)=>(
                    <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",fontSize:14}}><span style={{color:"#6B7280"}}>{l}</span><span style={{fontWeight:600}}>{v}</span></div>
                  ))}
                  <div style={{height:1,background:"#E5E7EB",margin:"8px 0"}}/>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:16,fontWeight:800}}><span>Total estimé</span><span>{fmt(subtotal)}</span></div>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:15,fontWeight:700,color:DEMO_COLOR,marginTop:4}}><span>Acompte (30%)</span><span>{fmt(acompte)}</span></div>
                </div>
                <div style={{background:"#F7F8FC",borderRadius:12,padding:"14px 18px",marginBottom:20}}>
                  {[["Client",`${form.prenom} ${form.nom}`],["Date",form.date],["Créneau",`${form.timeSlot} → ${form.timeSlotEnd}`],["Adresse",form.adresse]].map(([l,v])=>(
                    <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",fontSize:14}}><span style={{color:"#6B7280"}}>{l}</span><span style={{fontWeight:600}}>{v}</span></div>
                  ))}
                </div>
                <div style={{background:"linear-gradient(135deg,#0057FF15,#00D4FF15)",border:`1.5px solid ${DEMO_COLOR}`,borderRadius:10,padding:"14px 16px",marginBottom:16,fontSize:13,color:"#374151",textAlign:"center"}}>
                  🎯 <strong>Mode démo</strong> — En vrai, votre client paierait {fmt(acompte)} et recevrait une confirmation automatique !
                </div>
                <button onClick={()=>setDone(true)} style={{width:"100%",background:DEMO_COLOR,color:"#fff",border:"none",borderRadius:10,padding:16,fontSize:15,fontWeight:800,cursor:"pointer"}}>
                  Voir ce que verrait votre client →
                </button>
              </>
            )}
          </div>

          {step<3&&(
            <div style={{display:"flex",justifyContent:"space-between",padding:"16px 24px 24px",borderTop:"1px solid #E5E7EB",gap:12,marginTop:8}}>
              {step>0?<button onClick={()=>setStep(s=>s-1)} style={{background:"none",border:"1.5px solid #E5E7EB",borderRadius:8,padding:"10px 18px",fontSize:14,fontWeight:600,color:"#6B7280",cursor:"pointer"}}>← Retour</button>:<div/>}
              <button onClick={()=>canNext()&&setStep(s=>s+1)} disabled={!canNext()} style={{background:canNext()?DEMO_COLOR:"#E5E7EB",color:canNext()?"#fff":"#9CA3AF",border:"none",borderRadius:8,padding:"11px 24px",fontSize:14,fontWeight:700,cursor:canNext()?"pointer":"not-allowed",marginLeft:"auto"}}>
                {step===2?"Voir le récapitulatif →":"Continuer →"}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
