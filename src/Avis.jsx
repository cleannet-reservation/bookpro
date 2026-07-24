import { useState } from "react";

const GOOGLE_REVIEW_URL = "https://g.page/r/CYYAykIVxndLEBM/review";

export default function Avis() {
  const parts = window.location.pathname.split("/");
  const slug = parts[2] || "";
  const reservationId = parts[3] || "";

  const [note, setNote] = useState(null);
  const [hover, setHover] = useState(null);
  const [step, setStep] = useState("rating");
  const [feedback, setFeedback] = useState("");
  const [sending, setSending] = useState(false);
  const [googleUrl, setGoogleUrl] = useState(GOOGLE_REVIEW_URL);

  const handleNote = async (n) => {
    setNote(n);
    if (n >= 4) {
      setStep("google");
      // Récupérer le lien Google Reviews du client BookPro
      try {
        const r = await fetch(`/api/clients?slug=${slug}`);
        const data = await r.json();
        const url = data?.config?.company?.googleReviewUrl || GOOGLE_REVIEW_URL;
        setGoogleUrl(url);
        setTimeout(() => { window.location.href = url; }, 2000);
      } catch(_) {
        setTimeout(() => { window.location.href = GOOGLE_REVIEW_URL; }, 2000);
      }
    } else {
      setStep("feedback");
    }
  };

  const handleFeedback = async () => {
    setSending(true);
    try {
      await fetch("/api/review-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note, feedback, reservationId, slug }),
      });
      setStep("done");
    } catch(e) { setStep("done"); }
    finally { setSending(false); }
  };

  const stars = [1, 2, 3, 4, 5];
  const color = "#0057FF";

  return (
    <div style={{minHeight:"100vh",background:"#F7F8FC",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Inter,system-ui,sans-serif",padding:24}}>
      <div style={{background:"#fff",borderRadius:20,padding:"40px 32px",maxWidth:440,width:"100%",textAlign:"center",boxShadow:"0 4px 24px rgba(0,0,0,0.08)"}}>
        <div style={{fontSize:24,fontWeight:900,color,marginBottom:4}}>⬡ BookPro</div>
        <div style={{fontSize:13,color:"#6B7280",marginBottom:28}}>Avis client</div>

        {step==="rating" && (
          <>
            <div style={{fontSize:36,marginBottom:12}}>😊</div>
            <h2 style={{fontSize:20,fontWeight:800,margin:"0 0 8px",color:"#1A1F36"}}>Votre intervention s'est bien passée ?</h2>
            <p style={{fontSize:14,color:"#6B7280",margin:"0 0 28px"}}>Donnez-nous une note de 1 à 5 étoiles</p>
            <div style={{display:"flex",justifyContent:"center",gap:12,marginBottom:12}}>
              {stars.map(s=>(
                <button key={s} onClick={()=>handleNote(s)} onMouseEnter={()=>setHover(s)} onMouseLeave={()=>setHover(null)}
                  style={{fontSize:40,background:"none",border:"none",cursor:"pointer",transform:(hover||note)>=s?"scale(1.2)":"scale(1)",transition:"transform 0.15s",filter:(hover||note)>=s?"none":"grayscale(1)"}}>
                  ⭐
                </button>
              ))}
            </div>
            <p style={{fontSize:12,color:"#9CA3AF"}}>{hover?["","Très insatisfait","Insatisfait","Correct","Satisfait","Très satisfait"][hover]:"Cliquez sur une étoile"}</p>
          </>
        )}

        {step==="google" && (
          <>
            <div style={{fontSize:52,marginBottom:16}}>🌟</div>
            <h2 style={{fontSize:20,fontWeight:800,margin:"0 0 8px",color:"#1A1F36"}}>Merci pour votre {note} étoile{note>1?"s":""} !</h2>
            <p style={{fontSize:14,color:"#6B7280",margin:"0 0 20px"}}>Redirection vers Google en cours...</p>
            <div style={{display:"flex",justifyContent:"center",gap:4}}>
              {stars.map(s=><span key={s} style={{fontSize:28,filter:s<=note?"none":"grayscale(1)"}}>⭐</span>)}
            </div>
            <a href={googleUrl} style={{display:"inline-block",marginTop:16,color,fontSize:13,fontWeight:600}}>Cliquez ici si la redirection ne fonctionne pas</a>
          </>
        )}

        {step==="feedback" && (
          <>
            <div style={{fontSize:36,marginBottom:12}}>😔</div>
            <h2 style={{fontSize:20,fontWeight:800,margin:"0 0 8px",color:"#1A1F36"}}>Nous sommes désolés !</h2>
            <p style={{fontSize:14,color:"#6B7280",margin:"0 0 20px"}}>Dites-nous ce qui s'est mal passé.</p>
            <div style={{display:"flex",justifyContent:"center",gap:4,marginBottom:20}}>
              {stars.map(s=><span key={s} style={{fontSize:24,filter:s<=note?"none":"grayscale(1)"}}>⭐</span>)}
            </div>
            <textarea value={feedback} onChange={e=>setFeedback(e.target.value)}
              placeholder="Décrivez votre expérience..."
              style={{width:"100%",border:"1.5px solid #E5E7EB",borderRadius:10,padding:"12px 14px",fontSize:14,fontFamily:"inherit",resize:"vertical",minHeight:100,outline:"none",boxSizing:"border-box",marginBottom:14}}/>
            <button onClick={handleFeedback} disabled={sending||!feedback.trim()}
              style={{width:"100%",background:sending||!feedback.trim()?"#E5E7EB":color,color:sending||!feedback.trim()?"#9CA3AF":"#fff",border:"none",borderRadius:10,padding:"13px",fontSize:15,fontWeight:800,cursor:sending||!feedback.trim()?"not-allowed":"pointer"}}>
              {sending?"⏳ Envoi...":"Envoyer mon retour →"}
            </button>
          </>
        )}

        {step==="done" && (
          <>
            <div style={{fontSize:52,marginBottom:16}}>🙏</div>
            <h2 style={{fontSize:20,fontWeight:800,margin:"0 0 8px",color:"#1A1F36"}}>Merci pour votre retour !</h2>
            <p style={{fontSize:14,color:"#6B7280"}}>Votre message a été transmis à l'équipe.</p>
            <div style={{background:"#F0FDF4",border:"1.5px solid #059669",borderRadius:10,padding:"12px 16px",marginTop:20,fontSize:14,color:"#059669",fontWeight:600}}>
              ✅ Retour bien reçu
            </div>
          </>
        )}

        <p style={{fontSize:11,color:"#D1D5DB",marginTop:28}}>⬡ Propulsé par BookPro</p>
      </div>
    </div>
  );
}
