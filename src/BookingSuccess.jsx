import { useState, useEffect } from "react";

export default function BookingSuccess() {
  const [booking, setBooking] = useState(null);
  const [config, setConfig] = useState(null);
  const slug = sessionStorage.getItem("bookpro_slug") || "";

  useEffect(() => {
    const raw = sessionStorage.getItem("bookpro_booking");
    if (raw) {
      try { setBooking(JSON.parse(raw)); } catch(_) {}
      sessionStorage.removeItem("bookpro_booking");
    }

    if (slug) {
      fetch(`/api/clients?slug=${slug}`)
        .then(r => r.json())
        .then(data => { if (!data.error) setConfig(data.config); })
        .catch(() => {});
    }
  }, []);

  const color = config?.company?.accentColor || "#0057FF";
  const companyName = config?.company?.name || "L'entreprise";
  const phone = config?.company?.phone || "";

  const openWhatsApp = () => {
    if (!booking || !phone) return;
    const msg = encodeURIComponent(
`✅ *Acompte reçu — Nouvelle réservation*

👤 *Client :* ${booking.prenom} ${booking.nom}
📞 *Téléphone :* ${booking.telephone}
📧 *Email :* ${booking.email}
📍 *Adresse :* ${booking.adresse}

🧹 *Service :* ${booking.service} — ${booking.option}
📅 *Date :* ${booking.date}
🕐 *Créneau :* ${booking.creneau}
💶 *Total :* ${booking.total}
💳 *Acompte encaissé :* ${booking.acompte}

_Paiement confirmé via Stripe_`
    );
    window.open(`https://wa.me/${phone.replace(/\D/g,"")}?text=${msg}`, "_blank");
  };

  return (
    <div style={{minHeight:"100vh",background:"#F7F8FC",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Inter,system-ui,sans-serif",padding:24}}>
      <div style={{background:"#fff",borderRadius:20,padding:"48px 36px",maxWidth:480,width:"100%",textAlign:"center",boxShadow:"0 4px 24px rgba(0,0,0,0.08)"}}>
        {/* Logo entreprise */}
        <div style={{width:56,height:56,borderRadius:14,background:color+"15",border:`2px solid ${color}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",fontSize:24,fontWeight:900,color}}>
          ✦
        </div>
        <div style={{fontSize:13,fontWeight:700,color,textTransform:"uppercase",letterSpacing:1,marginBottom:20}}>
          {companyName}
        </div>

        <div style={{fontSize:52,marginBottom:16}}>✅</div>
        <h1 style={{fontSize:24,fontWeight:900,color:"#1A1F36",margin:"0 0 10px"}}>Paiement confirmé !</h1>
        <p style={{color:"#6B7280",fontSize:15,lineHeight:1.7,marginBottom:20}}>
          Merci <strong>{booking?.prenom}</strong>, votre acompte a bien été encaissé.<br/>
          {companyName} va confirmer votre créneau sous 24h.
        </p>

        {/* Récap réservation */}
        {booking && (
          <div style={{background:"#F7F8FC",borderRadius:12,padding:"14px 18px",marginBottom:20,textAlign:"left"}}>
            {[["🧹 Service",`${booking.service} — ${booking.option}`],["📅 Date",booking.date],["🕐 Créneau",booking.creneau],["📍 Adresse",booking.adresse]].map(([l,v])=>(
              <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",fontSize:13,borderBottom:"1px solid #E5E7EB"}}>
                <span style={{color:"#6B7280"}}>{l}</span>
                <span style={{fontWeight:600,color:"#1A1F36",maxWidth:"55%",textAlign:"right"}}>{v}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{background:"#F0FDF4",border:"1.5px solid #059669",borderRadius:10,padding:"12px 16px",marginBottom:20,fontSize:14,color:"#059669",fontWeight:600}}>
          🔒 Acompte de {booking?.acompte} encaissé avec succès
        </div>

        {phone && (
          <button onClick={openWhatsApp} style={{width:"100%",background:"#25D366",color:"#fff",border:"none",borderRadius:10,padding:"14px",fontSize:15,fontWeight:800,cursor:"pointer",marginBottom:10,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
            <span style={{fontSize:20}}>📲</span>
            Envoyer le récapitulatif sur WhatsApp
          </button>
        )}

        <a href={`/booking/${slug}`} style={{display:"block",background:"#F3F4F6",color:"#374151",textDecoration:"none",borderRadius:10,padding:"12px",fontWeight:700,fontSize:14}}>
          ← Retour à la page de réservation
        </a>

        <p style={{fontSize:12,color:"#9CA3AF",marginTop:20}}>
          ✦ {companyName} · Propulsé par BookPro
        </p>
      </div>
    </div>
  );
}
