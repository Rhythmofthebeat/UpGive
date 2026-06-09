import { useState, useEffect, useRef, useCallback, createContext, useContext } from "react";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── CONFIG ── Replace with your Supabase project values ──────────────────────
const SUPABASE_URL      = "https://ndzvsdoqrnldqjiokauv.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kenZzZG9xcm5sZHFqaW9rYXV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwMDYzMzYsImV4cCI6MjA5NjU4MjMzNn0.kkIFx-dUgGxpvNwaAVGu9HAHgBVfKgs1bGygKkDKacM";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const G="#16a34a",G2="#15803d",G3="#f0fdf4",G4="#bbf7d0";
const AMBER="#d97706",AMBER2="#fffbeb",AMBER3="#fef3c7";
const BG="#ffffff";
const BORDER="#e5e7eb";
const TEXT="#111827";
const MUTED="#6b7280";

const LOCS={
  atlanta:{label:"Atlanta, GA, USA",short:"Atlanta, GA",tz:"EST"},nyc:{label:"New York, NY, USA",short:"New York, NY",tz:"EST"},
  london:{label:"London, UK",short:"London",tz:"GMT"},lagos:{label:"Lagos, Nigeria",short:"Lagos",tz:"WAT"},
  tokyo:{label:"Tokyo, Japan",short:"Tokyo",tz:"JST"},dubai:{label:"Dubai, UAE",short:"Dubai",tz:"GST"},
  sao:{label:"São Paulo, Brazil",short:"São Paulo",tz:"BRT"},sydney:{label:"Sydney, Australia",short:"Sydney",tz:"AEST"},
  nairobi:{label:"Nairobi, Kenya",short:"Nairobi",tz:"EAT"},mumbai:{label:"Mumbai, India",short:"Mumbai",tz:"IST"},
  berlin:{label:"Berlin, Germany",short:"Berlin",tz:"CET"},toronto:{label:"Toronto, Canada",short:"Toronto",tz:"EST"},
};

const INDUSTRIES=["Technology","Food & Beverage","Healthcare","Education","Apparel","Construction","Agriculture","Manufacturing","Energy","Logistics","Finance","Water & Env.","Creative Arts","Oil & Gas","Aerospace","Telecom"];
const CATEGORIES=["Technology / Electronics","Food & Beverage","Furniture & Office","Apparel & Clothing","Medical Supplies","Construction Materials","Agricultural Produce","Educational Materials","Industrial Equipment","Energy Equipment","Vehicles","Other"];
const CONDITIONS=[{v:"new",l:"New / unopened"},{v:"lightly_used",l:"Lightly used"},{v:"refurbished",l:"Refurbished"},{v:"for_parts",l:"For parts"}];

const INTL_CARRIERS={
  uk:[{name:"DHL Express International",eta:"3–5 days",price:"$38–$120",rec:true,feats:["Customs clearance","Tracking","Door to door","Duties paid option"]},{name:"Royal Mail International",eta:"7–14 days",price:"$18–$55",rec:false,feats:["Economy option","<5kg"]},{name:"Maersk Ocean Freight",eta:"14–18 days",price:"$800+",rec:false,feats:["Bulk lots","LCL/FCL"]}],
  ng:[{name:"DHL Worldwide Express",eta:"5–8 days",price:"$55–$180",rec:true,feats:["Nigeria customs","Lagos/Abuja","B-Corp priority lane"]},{name:"Maersk LCL",eta:"14–21 days",price:"$800–$2,400",rec:false,feats:["500kg+ lots","Apapa Port"]},{name:"Aramex Africa",eta:"6–10 days",price:"$40–$130",rec:false,feats:["Pan-African network"]}],
  jp:[{name:"FedEx International Priority",eta:"3–4 days",price:"$48–$150",rec:true,feats:["Tokyo/Osaka","Full customs docs"]},{name:"EMS Express Mail",eta:"5–10 days",price:"$22–$70",rec:false,feats:["Japan Post partner"]}],
  br:[{name:"DHL Express Brazil",eta:"4–7 days",price:"$45–$140",rec:true,feats:["Brazil customs","ICMS docs"]},{name:"Correios / Latam",eta:"10–20 days",price:"$20–$65",rec:false,feats:["Budget option"]}],
  au:[{name:"Australia Post International",eta:"6–10 days",price:"$40–$120",rec:true,feats:["Door to door","Quarantine guidance"]},{name:"Maersk Sea Freight",eta:"21–30 days",price:"$900–$3,200",rec:false,feats:["Bulk lots"]}],
  de:[{name:"DHL Paket International",eta:"3–5 days",price:"$28–$90",rec:true,feats:["EU customs streamlined"]},{name:"DB Schenker Freight",eta:"5–8 days",price:"$200–$800",rec:false,feats:["Pallet shipping"]}],
  in:[{name:"FedEx International India",eta:"4–6 days",price:"$42–$130",rec:true,feats:["India customs","GSTIN docs"]},{name:"India Post EMS",eta:"8–14 days",price:"$18–$55",rec:false,feats:["Budget option"]}],
};

// ─── AUTH CONTEXT ─────────────────────────────────────────────────────────────
const AuthCtx=createContext(null);
const useAuth=()=>useContext(AuthCtx);

function AuthProvider({children}){
  const [user,setUser]=useState(null);
  const [profile,setProfile]=useState(null);
  const [loading,setLoading]=useState(true);

  const loadProfile=useCallback(async(uid)=>{
    const{data}=await supabase.from("profiles").select("*").eq("id",uid).single();
    setProfile(data);
  },[]);

  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>{
      setUser(session?.user??null);
      if(session?.user)loadProfile(session.user.id);
      setLoading(false);
    });
    const{data:{subscription}}=supabase.auth.onAuthStateChange((_,session)=>{
      setUser(session?.user??null);
      if(session?.user)loadProfile(session.user.id);
      else setProfile(null);
    });
    return()=>subscription.unsubscribe();
  },[loadProfile]);

  const signUp=async(email,password,meta)=>supabase.auth.signUp({email,password,options:{data:meta}});
  const signIn=async(email,password)=>supabase.auth.signInWithPassword({email,password});
  const signOut=()=>supabase.auth.signOut();
  const refreshProfile=()=>user&&loadProfile(user.id);

  return<AuthCtx.Provider value={{user,profile,loading,signUp,signIn,signOut,refreshProfile}}>{children}</AuthCtx.Provider>;
}

// ─── BASE COMPONENTS ──────────────────────────────────────────────────────────
const inp={fontFamily:"inherit",fontSize:13,border:`1px solid ${BORDER}`,borderRadius:8,padding:"9px 13px",outline:"none",background:"#fff",color:TEXT,width:"100%",transition:"border-color .15s,box-shadow .15s"};
const inpFocus={borderColor:G,boxShadow:`0 0 0 3px rgba(22,163,74,.12)`};
const card={background:"#fff",border:`1px solid ${BORDER}`,borderRadius:12,overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,.06),0 1px 2px rgba(0,0,0,.04)"};

function Av({url,init="?",size=36,style={}}){
  return url?<img src={url} alt="" style={{width:size,height:size,borderRadius:"50%",objectFit:"cover",flexShrink:0,...style}}/>:<div style={{width:size,height:size,borderRadius:"50%",background:"#d1fae5",color:G2,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:size*.32,flexShrink:0,...style}}>{String(init).slice(0,2).toUpperCase()}</div>;
}

function Btn({children,v="outline",onClick,style={},sz="md",disabled=false,type="button"}){
  const sizes={sm:{fontSize:11,padding:"5px 12px",borderRadius:6},md:{fontSize:13,padding:"8px 18px",borderRadius:8},lg:{fontSize:14,padding:"11px 26px",borderRadius:8}};
  const vs={
    primary:{background:G,color:"#fff",border:"none",boxShadow:"0 1px 2px rgba(22,163,74,.25)"},
    secondary:{background:G3,color:G2,border:`1px solid #bbf7d0`},
    outline:{background:"#fff",color:TEXT,border:`1px solid ${BORDER}`,boxShadow:"0 1px 2px rgba(0,0,0,.04)"},
    ghost:{background:"none",color:MUTED,border:"none"},
    danger:{background:"#fef2f2",color:"#dc2626",border:"1px solid #fecaca"},
    white:{background:"#fff",color:G2,border:"none",fontWeight:700,boxShadow:"0 1px 3px rgba(0,0,0,.12)"},
  };
  return<button type={type} onClick={onClick} disabled={disabled} onMouseEnter={e=>{if(!disabled&&v==="primary")e.currentTarget.style.background=G2;}} onMouseLeave={e=>{if(!disabled&&v==="primary")e.currentTarget.style.background=G;}} style={{fontFamily:"inherit",fontWeight:500,letterSpacing:".01em",cursor:disabled?"not-allowed":"pointer",display:"inline-flex",alignItems:"center",gap:6,opacity:disabled?.55:1,transition:"all .15s",...sizes[sz],...(vs[v]||vs.outline),...style}}>{children}</button>;
}

function Field({label,required,children,style={}}){
  return<div style={style}>{label&&<label style={{fontSize:11,fontWeight:600,color:MUTED,display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:".06em"}}>{label}{required&&<span style={{color:"#ef4444",marginLeft:2}}>*</span>}</label>}{children}</div>;
}

function TInp({label,type="text",placeholder,value,onChange,required,style={}}){
  return<Field label={label} required={required} style={style}><input type={type} placeholder={placeholder} value={value} onChange={onChange} required={required} style={inp} onFocus={e=>Object.assign(e.target.style,inpFocus)} onBlur={e=>{e.target.style.borderColor=BORDER;e.target.style.boxShadow="none";}}/></Field>;
}

function TSel({label,value,onChange,options,required,style={}}){
  return<Field label={label} required={required} style={style}><select value={value} onChange={onChange} required={required} style={{...inp,cursor:"pointer"}} onFocus={e=>Object.assign(e.target.style,inpFocus)} onBlur={e=>{e.target.style.borderColor=BORDER;e.target.style.boxShadow="none";}}>{options.map(o=><option key={o.v||o} value={o.v||o}>{o.l||o}</option>)}</select></Field>;
}

function Chip({label,active,onClick}){
  return<button onClick={onClick} style={{padding:"5px 14px",borderRadius:6,border:active?`1.5px solid ${G}`:`1px solid ${BORDER}`,background:active?G3:"#fff",color:active?G2:MUTED,fontSize:11,fontWeight:active?600:400,cursor:"pointer",whiteSpace:"nowrap",transition:"all .15s",letterSpacing:".01em"}}>{label}</button>;
}

function Alert({icon,children,type="green",style={}}){
  const c={green:{bg:"#f0fdf4",border:"#bbf7d0",text:"#14532d"},blue:{bg:"#eff6ff",border:"#bfdbfe",text:"#1e40af"},red:{bg:"#fef2f2",border:"#fecaca",text:"#991b1b"},amber:{bg:"#fffbeb",border:"#fde68a",text:"#78350f"}};
  const t=c[type]||c.green;
  return<div style={{background:t.bg,border:`1px solid ${t.border}`,borderRadius:8,padding:"11px 15px",marginBottom:14,fontSize:13,color:t.text,display:"flex",gap:9,alignItems:"flex-start",lineHeight:1.6,...style}}>{icon&&<span style={{flexShrink:0,marginTop:1}}>{icon}</span>}<div>{children}</div></div>;
}

function Spinner(){
  return<div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"56px 24px",gap:12}}>
    <div style={{width:28,height:28,borderRadius:"50%",border:`2.5px solid ${G3}`,borderTopColor:G,animation:"spin .7s linear infinite"}}/>
    <span style={{fontSize:12,color:MUTED,letterSpacing:".02em"}}>Loading…</span>
  </div>;
}

function SecHead({icon,children,action}){
  return<div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16,paddingBottom:12,borderBottom:`1px solid ${BORDER}`}}><h3 style={{fontSize:14,fontWeight:600,color:TEXT,letterSpacing:".01em",margin:0,flex:1}}>{children}</h3>{action}</div>;
}

function Empty({icon,title,sub,action}){
  return<div style={{textAlign:"center",padding:"56px 24px"}}>
    <div style={{width:48,height:48,borderRadius:12,background:G3,margin:"0 auto 16px",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7.5" stroke={G} strokeWidth="1.5"/><line x1="10" y1="6.5" x2="10" y2="10.5" stroke={G} strokeWidth="1.5" strokeLinecap="round"/><circle cx="10" cy="13" r=".75" fill={G}/></svg>
    </div>
    <div style={{fontSize:14,fontWeight:600,color:TEXT,marginBottom:5}}>{title}</div>
    {sub&&<div style={{fontSize:13,color:MUTED,marginBottom:18,lineHeight:1.6,maxWidth:280,margin:"0 auto 18px"}}>{sub}</div>}
    {action&&<div style={{marginTop:16}}>{action}</div>}
  </div>;
}

function Tag({label,bg="#dcfce7",color="#166534"}){
  return<span style={{background:bg,color,fontSize:10,padding:"2px 8px",borderRadius:4,fontWeight:600,whiteSpace:"nowrap",letterSpacing:".01em"}}>{label}</span>;
}

// ─── LISTING CARD ─────────────────────────────────────────────────────────────
// Curated high-quality Unsplash images per category for professional appearance
const CAT_IMAGES={
  "Technology / Electronics":"https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80",
  "Food & Beverage":"https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=400&q=80",
  "Furniture & Office":"https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80",
  "Apparel & Clothing":"https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=400&q=80",
  "Medical Supplies":"https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80",
  "Construction Materials":"https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=80",
  "Agricultural Produce":"https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=400&q=80",
  "Educational Materials":"https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&q=80",
  "Industrial Equipment":"https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=400&q=80",
  "Energy Equipment":"https://images.unsplash.com/photo-1509391366360-2e959784a276?w=400&q=80",
  "Vehicles":"https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=400&q=80",
  "Other":"https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&q=80",
};
const DEFAULT_IMG="https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&q=80";

function ListingCard({listing,onView,onClaim,onMsg}){
  const{user}=useAuth();
  const isOwner=user&&user.id===listing.user_id;
  const isFree=!listing.price;
  const urgent=listing.expires_at&&new Date(listing.expires_at)-Date.now()<48*3600*1000;
  const imgSrc=listing.images?.[0]||CAT_IMAGES[listing.category]||DEFAULT_IMG;
  return(
    <div onClick={()=>onView(listing)} style={{...card,cursor:"pointer",display:"flex",flexDirection:"column",transition:"box-shadow .18s,transform .18s"}}
      onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 8px 24px rgba(0,0,0,.10)";e.currentTarget.style.transform="translateY(-3px)";}}
      onMouseLeave={e=>{e.currentTarget.style.boxShadow="0 1px 3px rgba(0,0,0,.06),0 1px 2px rgba(0,0,0,.04)";e.currentTarget.style.transform="";}}>
      {/* Image */}
      <div style={{height:140,position:"relative",overflow:"hidden",borderRadius:"12px 12px 0 0"}}>
        <img src={imgSrc} alt={listing.title} style={{width:"100%",height:"100%",objectFit:"cover"}} loading="lazy"/>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom,transparent 40%,rgba(0,0,0,.45))"}}/>
        {/* Badges overlaid on image */}
        <div style={{position:"absolute",top:8,left:8,display:"flex",gap:4,flexWrap:"wrap"}}>
          {isFree&&<span style={{background:"#d97706",color:"#fff",fontSize:9,padding:"2px 7px",borderRadius:4,fontWeight:700,letterSpacing:".05em"}}>FREE</span>}
          {listing.listing_type==="buy"&&<span style={{background:"#6366f1",color:"#fff",fontSize:9,padding:"2px 7px",borderRadius:4,fontWeight:700}}>WANTED</span>}
          {urgent&&<span style={{background:"#dc2626",color:"#fff",fontSize:9,padding:"2px 7px",borderRadius:4,fontWeight:700}}>URGENT</span>}
        </div>
        {listing.profiles?.verified&&<span style={{position:"absolute",top:8,right:8,background:"rgba(255,255,255,.92)",color:"#1d4ed8",fontSize:9,padding:"2px 7px",borderRadius:4,fontWeight:700}}>✓ VERIFIED</span>}
        {/* Price over image */}
        <div style={{position:"absolute",bottom:8,right:8,background:"rgba(0,0,0,.55)",color:"#fff",fontSize:13,fontWeight:700,padding:"2px 9px",borderRadius:6,backdropFilter:"blur(4px)"}}>
          {isFree?"Free":`$${Number(listing.price).toLocaleString()}`}
        </div>
      </div>
      {/* Content */}
      <div style={{padding:"12px 14px",flex:1,display:"flex",flexDirection:"column",gap:4}}>
        <div style={{fontSize:13,fontWeight:600,color:TEXT,lineHeight:1.35,marginBottom:1}}>{listing.title}</div>
        <div style={{fontSize:11,color:MUTED}}>{listing.profiles?.org_name||listing.profiles?.display_name}</div>
        <div style={{fontSize:11,color:MUTED,marginBottom:6}}>{listing.category}{listing.quantity?` · ${listing.quantity} ${listing.unit}`:""}</div>
        <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:8}}>
          {listing.pickup_available&&<Tag label="Pickup" bg="#f0fdf4" color="#15803d"/>}
          {listing.international&&<Tag label="Ships Intl." bg="#ede9fe" color="#6d28d9"/>}
          {listing.condition&&<Tag label={CONDITIONS.find(c=>c.v===listing.condition)?.l||listing.condition} bg="#f1f5f9" color="#475569"/>}
        </div>
        <div style={{display:"flex",gap:6,marginTop:"auto"}}>
          {!isOwner&&<button onClick={e=>{e.stopPropagation();onMsg&&onMsg(listing);}} style={{flex:1,padding:"6px 0",borderRadius:6,border:`1px solid ${BORDER}`,background:"#fff",fontSize:11,cursor:"pointer",fontFamily:"inherit",color:MUTED,fontWeight:500,transition:"border-color .12s"}} onMouseEnter={e=>e.currentTarget.style.borderColor=G} onMouseLeave={e=>e.currentTarget.style.borderColor=BORDER}>Message</button>}
          {!isOwner&&listing.listing_type!=="buy"&&<button onClick={e=>{e.stopPropagation();onClaim&&onClaim(listing);}} style={{flex:1,padding:"6px 0",borderRadius:6,background:G,color:"#fff",border:"none",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit",transition:"background .12s"}} onMouseEnter={e=>e.currentTarget.style.background=G2} onMouseLeave={e=>e.currentTarget.style.background=G}>Claim</button>}
          {isOwner&&<span style={{fontSize:10,color:MUTED,fontStyle:"italic",padding:"6px 0"}}>Your listing</span>}
        </div>
      </div>
    </div>
  );
}

// ─── GOOGLE SIGN-IN BUTTON ────────────────────────────────────────────────────
function GoogleBtn({label="Continue with Google"}){
  const go=()=>supabase.auth.signInWithOAuth({provider:"google",options:{redirectTo:window.location.origin}});
  return(
    <button onClick={go} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,width:"100%",padding:"9px 16px",borderRadius:8,border:"1px solid #e0ede7",background:"#fff",cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:500,color:"#374151",marginTop:8,transition:"border-color .12s"}} onMouseEnter={e=>e.currentTarget.style.borderColor="#bbb"} onMouseLeave={e=>e.currentTarget.style.borderColor="#e0ede7"}>
      <svg width="18" height="18" viewBox="0 0 18 18">
        <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908C16.658 14.093 17.64 11.785 17.64 9.205Z" fill="#4285F4"/>
        <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
        <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
        <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
      </svg>
      {label}
    </button>
  );
}

// ─── AUTH SCREEN ──────────────────────────────────────────────────────────────
function AuthScreen({onSuccess}){
  const{signIn,signUp}=useAuth();
  const[mode,setMode]=useState("login");
  const[step,setStep]=useState(1);
  const[loading,setLoading]=useState(false);
  const[error,setError]=useState("");
  const[form,setForm]=useState({email:"",password:"",display_name:"",org_name:"",account_type:"company",country:"",city:"",location_key:"atlanta",primary_industry:"Technology",delivery_local:true,delivery_domestic:true,delivery_international:false});
  const set=k=>e=>setForm(f=>({...f,[k]:e.target.value}));
  const tog=k=>()=>setForm(f=>({...f,[k]:!f[k]}));

  const handleLogin=async e=>{
    e.preventDefault();setError("");setLoading(true);
    const{error}=await signIn(form.email,form.password);
    setLoading(false);
    if(error)setError(error.message);else onSuccess();
  };

  const handleRegister=async()=>{
    setError("");setLoading(true);
    const{data,error}=await signUp(form.email,form.password,{display_name:form.display_name||form.org_name,account_type:form.account_type});
    if(error){setError(error.message);setLoading(false);return;}
    if(data.user){
      await supabase.from("profiles").update({display_name:form.display_name||form.org_name,org_name:form.org_name,account_type:form.account_type,city:form.city,country:form.country,location_key:form.location_key,primary_industry:form.primary_industry,delivery_prefs:{local:form.delivery_local,domestic:form.delivery_domestic,international:form.delivery_international}}).eq("id",data.user.id);
    }
    setLoading(false);
    if(!error)onSuccess();
  };

  const types=[{id:"company",icon:"🏢",label:"Company",sub:"Sell or donate surplus"},{id:"nonprofit",icon:"🤝",label:"Nonprofit",sub:"Receive goods"},{id:"individual",icon:"👤",label:"Individual",sub:"Give or receive"},{id:"government",icon:"🏛️",label:"Government",sub:"Public agency"}];
  const steps=["Account","Profile","Industry","Delivery"];

  if(mode==="login")return(
    <div style={{display:"flex",justifyContent:"center",padding:40}}>
      <div style={{...card,padding:36,width:360,boxShadow:"0 4px 24px rgba(0,0,0,.07),0 1px 4px rgba(0,0,0,.04)"}}>
        <div style={{textAlign:"center",marginBottom:28}}><div style={{fontFamily:"'DM Serif Display',serif",fontSize:22,color:G,letterSpacing:"-0.5px",marginBottom:12}}>UpGive</div><h2 style={{fontFamily:"'DM Serif Display',serif",fontSize:26,color:"#0f172a",margin:"0 0 6px",letterSpacing:"-.3px"}}>Welcome Back</h2><p style={{fontSize:13,color:"#64748b",margin:0,lineHeight:1.6}}>Sign in to your account</p></div>
        {error&&<Alert type="red" icon="⚠️">{error}</Alert>}
        <form onSubmit={handleLogin}>
          <TInp label="Email" type="email" placeholder="you@org.com" value={form.email} onChange={set("email")} required style={{marginBottom:10}}/>
          <TInp label="Password" type="password" placeholder="••••••••" value={form.password} onChange={set("password")} required style={{marginBottom:14}}/>
          <Btn v="primary" sz="lg" type="submit" disabled={loading} style={{width:"100%",justifyContent:"center"}}>{loading?"Signing in…":"Sign in"}</Btn>
        </form>
        <div style={{display:"flex",alignItems:"center",gap:10,margin:"12px 0 4px"}}><div style={{flex:1,height:1,background:"#e0ede7"}}/><span style={{fontSize:11,color:"#94a3b8"}}>or</span><div style={{flex:1,height:1,background:"#e0ede7"}}/></div>
        <GoogleBtn/>
        <Btn v="ghost" onClick={()=>setMode("register")} style={{width:"100%",justifyContent:"center",marginTop:10,color:"#64748b",fontSize:12}}>Don't have an account? <strong style={{color:G,marginLeft:4}}>Create one</strong></Btn>
      </div>
    </div>
  );

  return(
    <div style={{display:"flex",justifyContent:"center",padding:40}}>
      <div style={{...card,padding:36,width:440,boxShadow:"0 4px 24px rgba(0,0,0,.07),0 1px 4px rgba(0,0,0,.04)"}}>
        <div style={{textAlign:"center",marginBottom:22}}><div style={{fontSize:30,marginBottom:8}}>💚</div><h2 style={{fontFamily:"'DM Serif Display',serif",fontSize:22,color:"#0f172a",margin:"0 0 5px",letterSpacing:"-.2px"}}>Join the Movement</h2><p style={{fontSize:12,color:"#64748b",margin:0,lineHeight:1.65}}>Give surplus a second life — connect with communities who need it most</p></div>
        <div style={{display:"flex",marginBottom:22}}>
          {steps.map((s,i)=>(
            <div key={s} style={{flex:1,textAlign:"center",position:"relative"}}>
              {i<steps.length-1&&<div style={{position:"absolute",top:10,left:"50%",width:"100%",height:1.5,background:step>i+1?G:"#e0ede7"}}/>}
              <div style={{width:20,height:20,borderRadius:"50%",margin:"0 auto 5px",background:step>i+1?G:step===i+1?G3:"#f1f5f9",border:step===i+1?`2px solid ${G}`:"1.5px solid #e0ede7",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:step>i+1?"#fff":step===i+1?G2:"#94a3b8",position:"relative",zIndex:1}}>{step>i+1?"✓":i+1}</div>
              <div style={{fontSize:9,color:"#94a3b8"}}>{s}</div>
            </div>
          ))}
        </div>
        {error&&<Alert type="red" icon="⚠️">{error}</Alert>}
        {step===1&&<div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
            {types.map(t=><div key={t.id} onClick={()=>setForm(f=>({...f,account_type:t.id}))} style={{border:form.account_type===t.id?`2px solid ${G}`:"1px solid #e0ede7",borderRadius:10,padding:12,textAlign:"center",cursor:"pointer",background:form.account_type===t.id?G3:"#fff"}}><div style={{fontSize:22,marginBottom:4}}>{t.icon}</div><div style={{fontSize:12,fontWeight:700,color:"#0f172a"}}>{t.label}</div><div style={{fontSize:10,color:"#64748b"}}>{t.sub}</div></div>)}
          </div>
          <TInp label="Full name / org name" placeholder="Acme Corp or Jane Smith" value={form.display_name} onChange={set("display_name")} required style={{marginBottom:10}}/>
          <TInp label="Email" type="email" placeholder="you@company.com" value={form.email} onChange={set("email")} required style={{marginBottom:10}}/>
          <TInp label="Password" type="password" placeholder="Min 8 characters" value={form.password} onChange={set("password")} required style={{marginBottom:14}}/>
          <Btn v="primary" sz="lg" onClick={()=>{if(form.email&&form.password&&form.display_name)setStep(2);else setError("Fill all fields.");}} style={{width:"100%",justifyContent:"center"}}>Continue →</Btn>
        </div>}
        {step===2&&<div>
          <TSel label="Country" value={form.country} onChange={set("country")} options={[{v:"",l:"Select country..."},"United States","United Kingdom","Nigeria","Japan","Brazil","India","Germany","Australia","Kenya","Canada","UAE","Other"]} required style={{marginBottom:10}}/>
          <TInp label="City / region" placeholder="Atlanta, GA" value={form.city} onChange={set("city")} style={{marginBottom:10}}/>
          <TSel label="Nearest UpGive market" value={form.location_key} onChange={set("location_key")} options={Object.entries(LOCS).map(([k,v])=>({v:k,l:v.label}))} style={{marginBottom:14}}/>
          <div style={{display:"flex",gap:8}}><Btn v="outline" onClick={()=>setStep(1)} style={{flex:1,justifyContent:"center"}}>← Back</Btn><Btn v="primary" onClick={()=>setStep(3)} style={{flex:2,justifyContent:"center"}}>Continue →</Btn></div>
        </div>}
        {step===3&&<div>
          <div style={{fontSize:12,color:"#64748b",marginBottom:10}}>Select your primary industry:</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,maxHeight:270,overflowY:"auto",marginBottom:14}}>
            {INDUSTRIES.map(ind=><div key={ind} onClick={()=>setForm(f=>({...f,primary_industry:ind}))} style={{border:`1.5px solid ${form.primary_industry===ind?G:"#e0ede7"}`,borderRadius:8,padding:"8px 10px",cursor:"pointer",fontSize:12,fontWeight:form.primary_industry===ind?700:400,color:form.primary_industry===ind?G2:"#374151",background:form.primary_industry===ind?G3:"#fff"}}>{ind}</div>)}
          </div>
          <div style={{display:"flex",gap:8}}><Btn v="outline" onClick={()=>setStep(2)} style={{flex:1,justifyContent:"center"}}>← Back</Btn><Btn v="primary" onClick={()=>setStep(4)} style={{flex:2,justifyContent:"center"}}>Continue →</Btn></div>
        </div>}
        {step===4&&<div>
          <div style={{fontSize:12,color:"#64748b",marginBottom:12}}>How do you plan to deliver?</div>
          {[["delivery_local","📍 Local pickup available"],["delivery_domestic","🚚 Domestic shipping"],["delivery_international","🌍 International shipping"]].map(([k,label])=>(
            <label key={k} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",border:`1.5px solid ${form[k]?G:"#e0ede7"}`,borderRadius:8,cursor:"pointer",marginBottom:8,background:form[k]?G3:"#fff"}}>
              <input type="checkbox" checked={form[k]} onChange={tog(k)} style={{accentColor:G,width:16,height:16}}/><span style={{fontSize:13,color:"#0f172a"}}>{label}</span>
            </label>
          ))}
          <div style={{display:"flex",gap:8,marginTop:14}}><Btn v="outline" onClick={()=>setStep(3)} style={{flex:1,justifyContent:"center"}}>← Back</Btn><Btn v="primary" onClick={handleRegister} disabled={loading} style={{flex:2,justifyContent:"center"}}>{loading?"Creating…":"🚀 Launch my account"}</Btn></div>
        </div>}
        <div style={{display:"flex",alignItems:"center",gap:10,margin:"14px 0 4px"}}><div style={{flex:1,height:1,background:"#e0ede7"}}/><span style={{fontSize:11,color:"#94a3b8"}}>or sign up with</span><div style={{flex:1,height:1,background:"#e0ede7"}}/></div>
        <GoogleBtn label="Sign up with Google"/>
        <div style={{textAlign:"center",marginTop:10}}><button onClick={()=>{setMode("login");setStep(1);setError("");}} style={{background:"none",border:"none",color:"#64748b",fontSize:12,cursor:"pointer"}}>Already have an account? <strong style={{color:G}}>Sign in</strong></button></div>
      </div>
    </div>
  );
}

// ─── LANDING PAGE ─────────────────────────────────────────────────────────────
function LandingScreen({onGo}){
  const stats=[
    {value:"62M",unit:"Metric tons / year",label:"of e-waste generated globally in 2022",source:"Global E-Waste Monitor 2024"},
    {value:"$91.5B",unit:"In recoverable value",label:"discarded in electronic waste alone, annually",source:"UNITAR / ITU 2024"},
    {value:"1 in 3",unit:"Products made",label:"never reach an end user before becoming waste",source:"Ellen MacArthur Foundation"},
    {value:"$1.1T",unit:"In surplus inventory",label:"held by US companies at any given time",source:"National Retail Federation 2023"},
  ];
  const problems=[
    {title:"Companies want to give — but lack the mechanism",body:"Over 80% of corporate sustainability officers report having surplus goods they cannot efficiently donate. Without compliance tools, recipient verification, and logistics coordination, most goods end up in landfills or incinerators instead of reaching communities.",stat:"80%",statLabel:"of companies lack a structured surplus donation process"},
    {title:"Nonprofits need goods — but can't source them efficiently",body:"NGOs, schools, clinics, and community organizations spend 35–60% of their operating budgets procuring basic supplies. Meanwhile, corporations pay disposal fees to destroy identical items — a trillion-dollar coordination failure.",stat:"$240B",statLabel:"spent annually by nonprofits on goods procurement"},
    {title:"The planet pays the price",body:"Electronic waste contains mercury, lead, and cadmium. 75% of it is improperly disposed of. Each laptop that reaches a landfill instead of being reused carries a 300+ kg CO₂-equivalent footprint — a cost borne by everyone.",stat:"75%",statLabel:"of global e-waste is improperly disposed of"},
  ];
  const steps=[
    {n:1,title:"Register your organization",body:"Companies, nonprofits, government agencies, and individuals sign up in minutes. Verified organizations receive priority matching and access to bulk listings."},
    {n:2,title:"List or browse surplus goods",body:"Donors post surplus inventory — electronics, furniture, food, medical supplies, clothing, and more. Recipients browse, filter by location and category, and claim what they need."},
    {n:3,title:"Coordinate, ship, measure impact",body:"Our platform handles claim coordination and delivery logistics, and provides verified impact reporting for corporate ESG disclosures and annual sustainability reports."},
  ];
  const wasteCategories=[
    {label:"Technology & Electronics",stat:"500M+ units/year",detail:"Laptops, servers, phones, and peripherals — the fastest-growing and most toxic waste stream on earth."},
    {label:"Food & Beverage",stat:"1.3B tons/year",detail:"One third of all food produced globally is wasted, while 828 million people face food insecurity."},
    {label:"Furniture & Office Goods",stat:"$16.5B/year",detail:"Desks, chairs, and fixtures discarded during office relocations and corporate refits."},
    {label:"Medical Supplies",stat:"$765M/year",detail:"Unexpired medicines, PPE, and medical equipment that could equip clinics in underserved regions."},
    {label:"Apparel & Textiles",stat:"92M tons/year",detail:"Unsold and returned clothing from fast fashion brands — redirectable to shelters and low-income communities."},
    {label:"Construction Materials",stat:"$2.4B/year",detail:"Lumber, fixtures, and building materials salvageable for community housing and infrastructure projects."},
  ];
  const partners=[
    {category:"Nonprofit & Humanitarian Partners",orgs:["Direct Relief","World Food Programme","Habitat for Humanity","Goodwill Industries","CARE International","Save the Children"]},
    {category:"Technology & AI Partners",orgs:["Microsoft AI for Social Good","Google.org","IBM SkillsBuild","Salesforce.org","AWS Nonprofit Credit Program","OpenAI for Good"]},
    {category:"International Organizations",orgs:["UNDP","UNHCR","World Bank Group","World Health Organization","USAID","UN Environment Programme"]},
    {category:"Corporate Network",orgs:["Fortune 500 technology companies","Global financial institutions","Retail & consumer goods brands","Healthcare & pharmaceutical leaders"]},
  ];

  const HeroBtn=({children,onClick,outline=false})=>(
    <button onClick={onClick} style={{fontFamily:"'DM Sans',inherit",padding:"14px 30px",borderRadius:6,border:outline?"1.5px solid rgba(255,255,255,.32)":"none",background:outline?"rgba(255,255,255,.08)":G,color:"#fff",fontSize:14,fontWeight:outline?500:600,cursor:"pointer",letterSpacing:.3,transition:"opacity .12s"}} onMouseEnter={e=>e.currentTarget.style.opacity=".88"} onMouseLeave={e=>e.currentTarget.style.opacity="1"}>{children}</button>
  );

  return(
    <div style={{fontFamily:"'Inter',system-ui,sans-serif",color:TEXT}}>

      {/* ── HERO ── */}
      <div style={{background:"linear-gradient(160deg,#052e16 0%,#14532d 50%,#166534 100%)",padding:"110px 24px 100px",textAlign:"center",position:"relative",overflow:"hidden"}}>
        {/* Real background image with overlay */}
        <div style={{position:"absolute",inset:0,backgroundImage:"url(https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=1600&q=60)",backgroundSize:"cover",backgroundPosition:"center",opacity:.12,pointerEvents:"none"}}/>
        <div style={{position:"absolute",inset:0,backgroundImage:"radial-gradient(rgba(255,255,255,.03) 1px,transparent 1px)",backgroundSize:"32px 32px",pointerEvents:"none"}}/>
        <div style={{position:"relative",maxWidth:820,margin:"0 auto"}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:8,padding:"6px 20px",borderRadius:4,background:"rgba(26,158,110,.2)",border:"1px solid rgba(26,158,110,.4)",marginBottom:26}}>
            <span style={{width:6,height:6,borderRadius:"50%",background:"#4ade80",flexShrink:0,boxShadow:"0 0 6px rgba(74,222,128,.8)"}}/>
            <span style={{fontSize:11,fontWeight:700,color:"#86efac",letterSpacing:2,textTransform:"uppercase"}}>Corporate Surplus Marketplace</span>
          </div>
          <h1 style={{fontFamily:"'DM Serif Display',serif",fontSize:54,color:"#fff",margin:"0 0 22px",lineHeight:1.07,letterSpacing:"-1.5px"}}>
            Every company has surplus.<br/><em style={{color:"#4ade80",fontStyle:"italic"}}>Most of it goes to waste.</em>
          </h1>
          <p style={{color:"rgba(255,255,255,.72)",fontSize:16,margin:"0 auto 40px",maxWidth:580,lineHeight:1.9}}>
            UpGive connects corporations and organizations with verified nonprofits, schools, and communities — turning unused inventory into measurable social impact, at zero cost.
          </p>
          <div style={{display:"flex",gap:14,justifyContent:"center",flexWrap:"wrap"}}>
            <HeroBtn onClick={()=>onGo("auth")}>Get Started — It's Free</HeroBtn>
            <HeroBtn onClick={()=>onGo("market")} outline>Browse Available Goods</HeroBtn>
          </div>
        </div>
      </div>

      {/* ── HEADLINE STATS ── */}
      <div style={{background:"#fff",borderBottom:"1px solid #e2e8f0"}}>
        <div style={{maxWidth:1040,margin:"0 auto",display:"grid",gridTemplateColumns:"repeat(4,1fr)",borderLeft:"1px solid #e2e8f0"}}>
          {stats.map(s=>(
            <div key={s.label} style={{padding:"30px 24px",borderRight:"1px solid #e2e8f0",borderBottom:"3px solid transparent",transition:"border-color .18s"}} onMouseEnter={e=>e.currentTarget.style.borderBottomColor=G} onMouseLeave={e=>e.currentTarget.style.borderBottomColor="transparent"}>
              <div style={{fontSize:34,fontWeight:800,color:"#0f172a",fontFamily:"'DM Serif Display',serif",letterSpacing:"-1.5px",lineHeight:1}}>{s.value}</div>
              <div style={{fontSize:10,fontWeight:700,color:G,textTransform:"uppercase",letterSpacing:1.2,margin:"5px 0 8px"}}>{s.unit}</div>
              <div style={{fontSize:13,color:"#475569",lineHeight:1.6,marginBottom:8}}>{s.label}</div>
              <div style={{fontSize:10,color:"#94a3b8"}}>{s.source}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── THE PROBLEM ── */}
      <div style={{background:"#f8fafc",padding:"80px 24px"}}>
        <div style={{maxWidth:1040,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:52}}>
            <div style={{fontSize:11,fontWeight:700,color:G,textTransform:"uppercase",letterSpacing:2,marginBottom:12}}>The Problem</div>
            <h2 style={{fontFamily:"'DM Serif Display',serif",fontSize:40,color:"#0f172a",margin:"0 0 16px",letterSpacing:"-.8px",lineHeight:1.15}}>A trillion-dollar coordination failure</h2>
            <p style={{fontSize:15,color:"#64748b",maxWidth:540,margin:"0 auto",lineHeight:1.85}}>Corporations dispose of billions in usable goods every year. The infrastructure to connect givers with recipients has simply not existed — until now.</p>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:24}}>
            {problems.map(p=>(
              <div key={p.title} style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:12,padding:30,position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${G},#22c07a)`}}/>
                <div style={{fontSize:30,fontWeight:800,color:G,fontFamily:"'DM Serif Display',serif",lineHeight:1,letterSpacing:"-1px",marginBottom:4}}>{p.stat}</div>
                <div style={{fontSize:11,color:"#94a3b8",marginBottom:18,textTransform:"uppercase",letterSpacing:.8}}>{p.statLabel}</div>
                <div style={{fontSize:15,fontWeight:700,color:"#0f172a",marginBottom:12,lineHeight:1.4}}>{p.title}</div>
                <p style={{fontSize:13,color:"#64748b",lineHeight:1.8,margin:0}}>{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── WASTE BY CATEGORY ── */}
      <div style={{background:"#fff",padding:"80px 24px"}}>
        <div style={{maxWidth:1040,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:52}}>
            <div style={{fontSize:11,fontWeight:700,color:G,textTransform:"uppercase",letterSpacing:2,marginBottom:12}}>The Scale</div>
            <h2 style={{fontFamily:"'DM Serif Display',serif",fontSize:40,color:"#0f172a",margin:"0 0 16px",letterSpacing:"-.8px",lineHeight:1.15}}>Surplus by category — what goes to waste</h2>
            <p style={{fontSize:15,color:"#64748b",maxWidth:500,margin:"0 auto",lineHeight:1.85}}>Every category below represents goods that UpGive is built to redirect — from corporations to communities.</p>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16}}>
            {[
              {label:"Technology & Electronics",stat:"500M+ units/year",detail:"Laptops, servers, phones, and peripherals — the fastest-growing and most toxic waste stream on earth.",img:"https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=75"},
              {label:"Food & Beverage",stat:"1.3B tons/year",detail:"One third of all food produced globally is wasted, while 828 million people face food insecurity.",img:"https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=600&q=75"},
              {label:"Furniture & Office Goods",stat:"$16.5B/year",detail:"Desks, chairs, and fixtures discarded during office relocations and corporate refits.",img:"https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=75"},
              {label:"Medical Supplies",stat:"$765M/year",detail:"Unexpired medicines, PPE, and medical equipment that could equip clinics in underserved regions.",img:"https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&q=75"},
              {label:"Apparel & Textiles",stat:"92M tons/year",detail:"Unsold and returned clothing from fast fashion brands — redirectable to shelters and communities.",img:"https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=600&q=75"},
              {label:"Construction Materials",stat:"$2.4B/year",detail:"Lumber, fixtures, and building materials salvageable for community housing and infrastructure.",img:"https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=75"},
            ].map(c=>(
              <div key={c.label} style={{borderRadius:12,border:`1px solid ${BORDER}`,overflow:"hidden",background:"#fff",transition:"box-shadow .18s,transform .18s"}} onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 8px 24px rgba(0,0,0,.10)";e.currentTarget.style.transform="translateY(-3px)";}} onMouseLeave={e=>{e.currentTarget.style.boxShadow="";e.currentTarget.style.transform="";}}>
                <div style={{height:130,overflow:"hidden",position:"relative"}}>
                  <img src={c.img} alt={c.label} style={{width:"100%",height:"100%",objectFit:"cover"}} loading="lazy"/>
                  <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom,transparent 30%,rgba(0,0,0,.5))"}}/>
                  <div style={{position:"absolute",bottom:10,left:12,fontSize:16,fontWeight:800,color:"#fff",fontFamily:"'DM Serif Display',serif",letterSpacing:"-.3px",lineHeight:1}}>{c.stat}</div>
                </div>
                <div style={{padding:"14px 16px"}}>
                  <div style={{fontSize:13,fontWeight:600,color:TEXT,marginBottom:6}}>{c.label}</div>
                  <div style={{fontSize:12,color:MUTED,lineHeight:1.7}}>{c.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <div style={{background:"#f0fbf5",padding:"80px 24px",borderTop:"1px solid #c5edd9",borderBottom:"1px solid #c5edd9"}}>
        <div style={{maxWidth:900,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:52}}>
            <div style={{fontSize:11,fontWeight:700,color:G,textTransform:"uppercase",letterSpacing:2,marginBottom:12}}>How It Works</div>
            <h2 style={{fontFamily:"'DM Serif Display',serif",fontSize:40,color:"#0f172a",margin:"0 0 14px",letterSpacing:"-.8px"}}>Simple. Verified. Impactful.</h2>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:40}}>
            {steps.map(s=>(
              <div key={s.n} style={{textAlign:"center"}}>
                <div style={{width:52,height:52,borderRadius:"50%",background:G,color:"#fff",fontSize:20,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",fontFamily:"'DM Serif Display',serif",boxShadow:`0 4px 18px rgba(26,158,110,.28)`}}>{s.n}</div>
                <div style={{fontSize:15,fontWeight:700,color:"#0f172a",marginBottom:10}}>{s.title}</div>
                <p style={{fontSize:13,color:"#64748b",lineHeight:1.8,margin:0}}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── PARTNERS ── */}
      <div style={{background:"#fff",padding:"80px 24px"}}>
        <div style={{maxWidth:1040,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:52}}>
            <div style={{fontSize:11,fontWeight:700,color:G,textTransform:"uppercase",letterSpacing:2,marginBottom:12}}>Our Network</div>
            <h2 style={{fontFamily:"'DM Serif Display',serif",fontSize:40,color:"#0f172a",margin:"0 0 16px",letterSpacing:"-.8px"}}>Built with world-class partners</h2>
            <p style={{fontSize:15,color:"#64748b",maxWidth:520,margin:"0 auto",lineHeight:1.85}}>We work alongside leading nonprofits, technology companies, and international organizations to ensure surplus goods reach the right hands, verified.</p>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:20}}>
            {partners.map(p=>(
              <div key={p.category} style={{padding:"26px 30px",border:"1px solid #e2e8f0",borderRadius:12,background:"#f8fafc"}}>
                <div style={{fontSize:10,fontWeight:700,color:G,textTransform:"uppercase",letterSpacing:1.5,marginBottom:16}}>{p.category}</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                  {p.orgs.map(o=>(
                    <span key={o} style={{padding:"5px 13px",borderRadius:4,background:"#fff",border:"1px solid #e2e8f0",fontSize:12,color:"#475569",fontWeight:500}}>{o}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FINAL CTA ── */}
      <div style={{background:"linear-gradient(135deg,#071812,#0c3a22)",padding:"88px 24px",textAlign:"center"}}>
        <div style={{maxWidth:620,margin:"0 auto"}}>
          <div style={{fontSize:11,fontWeight:700,color:"#4ade80",textTransform:"uppercase",letterSpacing:2,marginBottom:18}}>Join the Network</div>
          <h2 style={{fontFamily:"'DM Serif Display',serif",fontSize:40,color:"#fff",margin:"0 0 18px",letterSpacing:"-.8px",lineHeight:1.15}}>Turn your surplus into someone's solution</h2>
          <p style={{color:"rgba(255,255,255,.65)",fontSize:15,margin:"0 auto 40px",lineHeight:1.9}}>Whether you're a corporation with surplus goods, a nonprofit in need of resources, or a community organization looking to connect — UpGive is free to join and free to use.</p>
          <div style={{display:"flex",gap:14,justifyContent:"center",flexWrap:"wrap",marginBottom:28}}>
            <HeroBtn onClick={()=>onGo("auth")}>Register Your Organization</HeroBtn>
            <HeroBtn onClick={()=>onGo("market")} outline>Explore the Marketplace</HeroBtn>
          </div>
          <div style={{fontSize:12,color:"rgba(255,255,255,.35)"}}>Registered organizations receive priority verification and AI-assisted matching. No credit card required.</div>
        </div>
      </div>

    </div>
  );
}

// ─── HOME SCREEN ──────────────────────────────────────────────────────────────
function HomeScreen({loc,onGo,onClaim,onMsg}){
  const{profile}=useAuth();
  const[urgent,setUrgent]=useState([]);
  const[trending,setTrending]=useState([]);
  const[nearbyOrgs,setNearbyOrgs]=useState([]);
  const[counts,setCounts]=useState({listings:0,orgs:0});

  useEffect(()=>{
    const exp48=new Date(Date.now()+48*3600*1000).toISOString();
    supabase.from("listings").select("*,profiles(display_name,org_name,avatar_url,verified)").eq("status","active").lte("expires_at",exp48).order("expires_at").limit(6).then(({data})=>setUrgent(data||[]));
    supabase.from("listings").select("*,profiles(display_name,org_name,avatar_url,verified)").eq("status","active").order("view_count",{ascending:false}).limit(12).then(({data})=>setTrending(data||[]));
    supabase.from("profiles").select("id,display_name,org_name,avatar_url,verified,primary_industry,city,location_key,total_listed").eq("location_key",loc).limit(6).then(({data})=>setNearbyOrgs(data||[]));
    supabase.from("listings").select("id",{count:"exact",head:true}).eq("status","active").then(({count})=>setCounts(s=>({...s,listings:count||0})));
    supabase.from("profiles").select("id",{count:"exact",head:true}).then(({count})=>setCounts(s=>({...s,orgs:count||0})));
  },[loc]);

  return<div>
    {/* ── HERO ── */}
    <div style={{background:"linear-gradient(155deg,#0b5c38 0%,#1a9e6e 58%,#22c07a 100%)",padding:"56px 24px 44px",textAlign:"center",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",inset:0,backgroundImage:"radial-gradient(circle,rgba(255,255,255,.055) 1px,transparent 1px)",backgroundSize:"22px 22px",pointerEvents:"none"}}/>
      <div style={{position:"relative"}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:8,padding:"5px 18px",borderRadius:99,background:"rgba(255,255,255,.12)",border:"1px solid rgba(255,255,255,.25)",marginBottom:18}}>
          <span style={{width:6,height:6,borderRadius:"50%",background:"#4ade80",flexShrink:0}}/>
          <span style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,.92)",letterSpacing:2.5,textTransform:"uppercase"}}>Surplus for Good</span>
        </div>
        <h1 style={{fontFamily:"'DM Serif Display',serif",fontSize:46,color:"#fff",margin:"0 0 16px",lineHeight:1.06}}>Turning surplus<br/><em>into community</em></h1>
        <p style={{color:"rgba(255,255,255,.85)",fontSize:15,margin:"0 auto 28px",maxWidth:480,lineHeight:1.8}}>
          {profile?`Welcome back, ${profile.display_name}. ${counts.listings.toLocaleString()} items waiting to make an impact.`:"Every unused item can feed a family, equip a school, or grow a business. We connect those who give with those who need — at no cost."}
        </p>
        <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap",marginBottom:28}}>
          <Btn v="white" sz="lg" onClick={()=>onGo("market")}>Browse Available Goods</Btn>
          <Btn sz="lg" onClick={()=>onGo("list")} style={{color:"#fff",background:"rgba(255,255,255,.14)",border:"1.5px solid rgba(255,255,255,.38)"}}>Donate Surplus</Btn>
          <Btn sz="lg" onClick={()=>onGo("local")} style={{color:"#fff",background:"rgba(255,255,255,.14)",border:"1.5px solid rgba(255,255,255,.38)"}}>Find Community</Btn>
        </div>
        {counts.listings>0&&<div style={{display:"inline-flex",alignItems:"center",gap:8,padding:"8px 20px",borderRadius:99,background:"rgba(0,0,0,.18)",border:"1px solid rgba(255,255,255,.15)"}}>
          <span style={{fontSize:13}}>✨</span>
          <span style={{fontSize:12,color:"rgba(255,255,255,.9)",fontWeight:500}}>{counts.listings.toLocaleString()} items available to communities worldwide</span>
        </div>}
      </div>
    </div>

    {/* ── IMPACT STATS BAR ── */}
    <div style={{background:"#0a5433",display:"flex",flexWrap:"wrap",justifyContent:"center",borderBottom:`3px solid ${AMBER}`}}>
      {[{n:counts.listings.toLocaleString(),l:"Items shared"},{n:counts.orgs.toLocaleString(),l:"Giving organizations"},{n:"182",l:"Countries connected"},{n:"$0",l:"Always free to claim"}].map(({n,l})=>(
        <div key={l} style={{padding:"14px 22px",textAlign:"center",borderRight:"1px solid rgba(255,255,255,.1)"}}>
          <div style={{fontSize:18,fontWeight:700,color:"#fff",fontFamily:"'DM Serif Display',serif"}}>{n}</div>
          <div style={{fontSize:10,color:G4,marginTop:3,textTransform:"uppercase",letterSpacing:.8}}>{l}</div>
        </div>
      ))}
    </div>

    {/* ── MISSION QUOTE STRIP ── */}
    <div style={{background:`linear-gradient(135deg,${AMBER2},#fef9f0)`,borderBottom:`1px solid #fde68a`,padding:"22px 24px",textAlign:"center"}}>
      <div style={{maxWidth:580,margin:"0 auto"}}>
        <p style={{fontFamily:"'DM Serif Display',serif",fontSize:16,fontStyle:"italic",color:"#78350f",lineHeight:1.85,margin:"0 0 8px"}}>"Every surplus item is a resource waiting to find purpose — food for a family, supplies for a school, tools for a nonprofit. Zero waste. Pure impact."</p>
        <div style={{fontSize:10,fontWeight:700,color:AMBER,letterSpacing:2,textTransform:"uppercase"}}>UpGive — Surplus for Good</div>
      </div>
    </div>

    {nearbyOrgs.length>0&&<div style={{padding:"24px 20px 0"}}>
      <SecHead>Nearby Organizations</SecHead>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:10,marginBottom:24}}>
        {nearbyOrgs.map(org=>(
          <div key={org.id} onClick={()=>onGo("store",org)} style={{...card,padding:14,cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.borderColor=G} onMouseLeave={e=>e.currentTarget.style.borderColor="#e0ede7"}>
            <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:8}}>
              <Av url={org.avatar_url} init={org.display_name||org.org_name||"?"} size={36}/>
              <div><div style={{fontSize:12,fontWeight:600,color:"#0f172a"}}>{org.org_name||org.display_name}</div>{org.verified&&<span style={{fontSize:9,background:"#dbeafe",color:"#1e40af",padding:"1px 5px",borderRadius:99,fontWeight:700}}>✓ Verified</span>}</div>
            </div>
            <div style={{fontSize:11,color:"#64748b"}}>{org.primary_industry} · {org.city}</div>
            <div style={{fontSize:11,color:G,marginTop:4}}>{org.total_listed||0} listed</div>
          </div>
        ))}
      </div>
    </div>}

    {urgent.length>0&&<div style={{padding:"0 20px 24px"}}>
      <SecHead>Expiring Soon</SecHead>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))",gap:10}}>
        {urgent.map(p=><ListingCard key={p.id} listing={p} onView={l=>onGo("listing",l)} onClaim={onClaim} onMsg={onMsg}/>)}
      </div>
    </div>}

    {trending.length>0&&<div style={{padding:"0 20px 24px"}}>
      <SecHead>Most Viewed</SecHead>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))",gap:10}}>
        {trending.map(p=><ListingCard key={p.id} listing={p} onView={l=>onGo("listing",l)} onClaim={onClaim} onMsg={onMsg}/>)}
      </div>
    </div>}

    {!urgent.length&&!trending.length&&<Empty title="Be the first to give" sub="Post your surplus goods and watch them transform lives across your community." action={<Btn v="primary" onClick={()=>onGo("list")}>Donate Your First Item</Btn>}/>}
  </div>;
}

// ─── MARKET SCREEN ────────────────────────────────────────────────────────────
function MarketScreen({onClaim,onView,onMsg}){
  const[listings,setListings]=useState([]);
  const[loading,setLoading]=useState(true);
  const[filter,setFilter]=useState("All");
  const[search,setSearch]=useState("");
  const[rawSearch,setRawSearch]=useState("");
  const[locFilter,setLocFilter]=useState("");
  const[catFilter,setCatFilter]=useState("");
  // ── location text filters ──
  const[countryRaw,setCountryRaw]=useState("");
  const[countryFilter,setCountryFilter]=useState("");
  const[cityRaw,setCityRaw]=useState("");
  const[cityFilter,setCityFilter]=useState("");
  const[stateRaw,setStateRaw]=useState("");
  const[stateFilter,setStateFilter]=useState("");

  const filters=["All","Free","Urgent","Local pickup","Ships overseas","Donate","Sell","Swap","Buy request"];

  // debounce the three text inputs
  useEffect(()=>{const t=setTimeout(()=>setCountryFilter(countryRaw.trim()),420);return()=>clearTimeout(t);},[countryRaw]);
  useEffect(()=>{const t=setTimeout(()=>setCityFilter(cityRaw.trim()),420);return()=>clearTimeout(t);},[cityRaw]);
  useEffect(()=>{const t=setTimeout(()=>setStateFilter(stateRaw.trim()),420);return()=>clearTimeout(t);},[stateRaw]);

  const clearAll=()=>{
    setFilter("All");setSearch("");setRawSearch("");
    setCatFilter("");setLocFilter("");
    setCountryRaw("");setCountryFilter("");
    setCityRaw("");setCityFilter("");
    setStateRaw("");setStateFilter("");
  };

  const activeLoc=[locFilter,countryFilter,cityFilter,stateFilter].filter(Boolean).length;
  const activeTotal=[filter!=="All",search,catFilter,locFilter,countryFilter,cityFilter,stateFilter].filter(Boolean).length;

  const load=useCallback(async()=>{
    setLoading(true);
    let q=supabase.from("listings").select("*,profiles(display_name,org_name,avatar_url,verified)").eq("status","active").neq("listing_type","need");
    if(search) q=q.textSearch("search_vector",search);
    if(catFilter) q=q.ilike("category",`%${catFilter}%`);
    if(locFilter) q=q.eq("location_key",locFilter);
    if(countryFilter) q=q.ilike("country",`%${countryFilter}%`);
    if(cityFilter) q=q.ilike("city",`%${cityFilter}%`);
    if(stateFilter) q=q.ilike("city",`%${stateFilter}%`);
    if(filter==="Free") q=q.is("price",null);
    if(filter==="Local pickup") q=q.eq("pickup_available",true);
    if(filter==="Ships overseas") q=q.eq("international",true);
    if(filter==="Donate") q=q.eq("listing_type","donate");
    if(filter==="Sell") q=q.eq("listing_type","sell");
    if(filter==="Swap") q=q.eq("listing_type","swap");
    if(filter==="Buy request") q=q.eq("listing_type","buy");
    if(filter==="Urgent"){const t=new Date(Date.now()+48*3600*1000).toISOString();q=q.lte("expires_at",t);}
    const{data}=await q.order("created_at",{ascending:false}).limit(48);
    setListings(data||[]);setLoading(false);
  },[filter,search,catFilter,locFilter,countryFilter,cityFilter,stateFilter]);

  useEffect(()=>{load();},[load]);

  // tiny helpers for sidebar labels
  const FL=({children})=><div style={{fontSize:10,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:.9,marginBottom:8}}>{children}</div>;
  const SL=({children})=><div style={{fontSize:10,color:"#94a3b8",marginBottom:4,marginTop:6}}>{children}</div>;

  return<div style={{display:"grid",gridTemplateColumns:"230px 1fr",minHeight:600}}>

    {/* ── SIDEBAR ── */}
    <div style={{background:"#fff",borderRight:`1px solid #e3d8cc`,padding:"16px 14px",overflowY:"auto"}}>

      {/* sidebar header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <span style={{fontSize:12,fontWeight:700,color:"#0f172a",display:"flex",alignItems:"center",gap:6}}>
          Filters
          {activeTotal>0&&<span style={{background:G,color:"#fff",borderRadius:99,fontSize:9,padding:"1px 7px",fontWeight:700}}>{activeTotal}</span>}
        </span>
        {activeTotal>0&&<button onClick={clearAll} style={{fontSize:11,color:AMBER,background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",fontWeight:700}}>Clear all</button>}
      </div>

      {/* Category */}
      <div style={{marginBottom:16}}>
        <FL>Category</FL>
        <select value={catFilter} onChange={e=>setCatFilter(e.target.value)} style={{...inp,fontSize:12}}>
          <option value="">All categories</option>
          {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* ── Location block ── */}
      <div style={{marginBottom:16}}>
        <FL>Location {activeLoc>0&&<span style={{background:AMBER3,color:AMBER,borderRadius:99,fontSize:9,padding:"1px 6px",fontWeight:700,marginLeft:4}}>{activeLoc}</span>}</FL>

        <SL>Market hub</SL>
        <select value={locFilter} onChange={e=>setLocFilter(e.target.value)} style={{...inp,fontSize:12,marginBottom:4}}>
          <option value="">All markets</option>
          {Object.entries(LOCS).map(([k,v])=><option key={k} value={k}>{v.short}</option>)}
        </select>

        <SL>Country</SL>
        <div style={{position:"relative",marginBottom:4}}>
          <input value={countryRaw} onChange={e=>setCountryRaw(e.target.value)} placeholder="e.g. Nigeria, Germany…" style={{...inp,fontSize:12,paddingRight:countryFilter?28:12}}/>
          {countryFilter&&<button onClick={()=>{setCountryRaw("");setCountryFilter("");}} style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",fontSize:14,cursor:"pointer",color:"#94a3b8",lineHeight:1}}>×</button>}
        </div>

        <SL>State / Province</SL>
        <div style={{position:"relative",marginBottom:4}}>
          <input value={stateRaw} onChange={e=>setStateRaw(e.target.value)} placeholder="e.g. Georgia, Ontario…" style={{...inp,fontSize:12,paddingRight:stateFilter?28:12}}/>
          {stateFilter&&<button onClick={()=>{setStateRaw("");setStateFilter("");}} style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",fontSize:14,cursor:"pointer",color:"#94a3b8",lineHeight:1}}>×</button>}
        </div>

        <SL>City / Town</SL>
        <div style={{position:"relative"}}>
          <input value={cityRaw} onChange={e=>setCityRaw(e.target.value)} placeholder="e.g. Atlanta, Lagos…" style={{...inp,fontSize:12,paddingRight:cityFilter?28:12}}/>
          {cityFilter&&<button onClick={()=>{setCityRaw("");setCityFilter("");}} style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",fontSize:14,cursor:"pointer",color:"#94a3b8",lineHeight:1}}>×</button>}
        </div>
      </div>

      {/* Listing type — radio-style */}
      <div style={{marginBottom:16}}>
        <FL>Listing type</FL>
        {[["All","All types"],["Donate","Donate"],["Sell","Sell"],["Swap","Swap"],["Buy request","Wanted"]].map(([v,l])=>(
          <label key={v} style={{display:"flex",alignItems:"center",gap:8,padding:"4px 0",fontSize:12,color:filter===v?"#0f172a":"#374151",cursor:"pointer",fontWeight:filter===v?600:400}}>
            <input type="radio" name="ltype" value={v} checked={filter===v} onChange={()=>setFilter(v)} style={{accentColor:G}}/>{l}
          </label>
        ))}
      </div>

      {/* Delivery */}
      <div style={{marginBottom:16}}>
        <FL>Delivery</FL>
        {[["Local pickup","Local pickup"],["Ships overseas","Ships overseas"],["Urgent","Expiring soon"]].map(([v,l])=>(
          <label key={v} style={{display:"flex",alignItems:"center",gap:8,padding:"4px 0",fontSize:12,color:filter===v?"#0f172a":"#374151",cursor:"pointer",fontWeight:filter===v?600:400}}>
            <input type="radio" name="ltype" value={v} checked={filter===v} onChange={()=>setFilter(v)} style={{accentColor:G}}/>{l}
          </label>
        ))}
      </div>

      {/* Condition */}
      <div style={{marginBottom:8}}>
        <FL>Condition</FL>
        {CONDITIONS.map(c=>(
          <label key={c.v} style={{display:"flex",alignItems:"center",gap:8,padding:"4px 0",fontSize:12,color:"#374151",cursor:"pointer"}}>
            <input type="checkbox" style={{accentColor:G}}/>{c.l}
          </label>
        ))}
      </div>
    </div>

    {/* ── MAIN ── */}
    <div style={{padding:16}}>
      <div style={{display:"flex",gap:8,marginBottom:10}}>
        <div style={{flex:1,position:"relative"}}>
          <input value={rawSearch} onChange={e=>setRawSearch(e.target.value)} onKeyDown={e=>e.key==="Enter"&&setSearch(rawSearch)} placeholder="Search listings… press Enter" style={{...inp,paddingRight:36}}/>
          <button onClick={()=>setSearch(rawSearch)} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",fontSize:16}}>🔍</button>
        </div>
        <select style={{...inp,width:"auto",fontSize:12}}><option>Newest first</option><option>Expiring soon</option><option>Most viewed</option></select>
      </div>

      {/* Active location chips */}
      {(countryFilter||stateFilter||cityFilter)&&(
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
          {countryFilter&&<span style={{fontSize:11,padding:"3px 10px",borderRadius:99,background:AMBER3,color:"#92400e",fontWeight:600,display:"flex",alignItems:"center",gap:5}}>🌍 {countryFilter}<button onClick={()=>{setCountryRaw("");setCountryFilter("");}} style={{background:"none",border:"none",cursor:"pointer",fontSize:14,color:"#92400e",lineHeight:1,padding:0}}>×</button></span>}
          {stateFilter&&<span style={{fontSize:11,padding:"3px 10px",borderRadius:99,background:AMBER3,color:"#92400e",fontWeight:600,display:"flex",alignItems:"center",gap:5}}>🗺 {stateFilter}<button onClick={()=>{setStateRaw("");setStateFilter("");}} style={{background:"none",border:"none",cursor:"pointer",fontSize:14,color:"#92400e",lineHeight:1,padding:0}}>×</button></span>}
          {cityFilter&&<span style={{fontSize:11,padding:"3px 10px",borderRadius:99,background:AMBER3,color:"#92400e",fontWeight:600,display:"flex",alignItems:"center",gap:5}}>📍 {cityFilter}<button onClick={()=>{setCityRaw("");setCityFilter("");}} style={{background:"none",border:"none",cursor:"pointer",fontSize:14,color:"#92400e",lineHeight:1,padding:0}}>×</button></span>}
        </div>
      )}

      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14,alignItems:"center"}}>
        {filters.map(f=><Chip key={f} label={f} active={filter===f} onClick={()=>setFilter(f)}/>)}
        <span style={{marginLeft:"auto",fontSize:11,color:"#94a3b8"}}>{listings.length} listing{listings.length!==1?"s":""}</span>
      </div>

      {loading?<Spinner/>:listings.length>0
        ?<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))",gap:10}}>{listings.map(p=><ListingCard key={p.id} listing={p} onView={onView} onClaim={onClaim} onMsg={onMsg}/>)}</div>
        :<Empty icon="📭" title="No listings found" sub="Try adjusting your filters or location." action={<Btn v="primary" onClick={clearAll}>Clear all filters</Btn>}/>}
    </div>
  </div>;
}

// ─── LOCAL SCREEN ─────────────────────────────────────────────────────────────
function LocalScreen({loc,onGoStore}){
  const[orgs,setOrgs]=useState([]);
  const[loading,setLoading]=useState(true);
  const[filter,setFilter]=useState("All");
  const locData=LOCS[loc]||LOCS.atlanta;

  useEffect(()=>{
    setLoading(true);
    let q=supabase.from("profiles").select("*").eq("location_key",loc);
    if(filter!=="All")q=q.eq("primary_industry",filter);
    q.order("total_listed",{ascending:false}).limit(24).then(({data})=>{setOrgs(data||[]);setLoading(false);});
  },[loc,filter]);

  return<div style={{padding:"16px 20px"}}>
    <Alert icon="📍"><strong>{orgs.length} organization{orgs.length!==1?"s":""}</strong> near <strong>{locData.short}</strong>. Change your location in the nav bar to explore other markets worldwide.</Alert>
    <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:16,alignItems:"center"}}>
      {["All",...INDUSTRIES.slice(0,8)].map(c=><Chip key={c} label={c} active={filter===c} onClick={()=>setFilter(c)}/>)}
    </div>
    {loading?<Spinner/>:orgs.length>0
      ?<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:10}}>
          {orgs.map(org=>(
            <div key={org.id} onClick={()=>onGoStore(org)} style={{...card,padding:14,cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.borderColor=G} onMouseLeave={e=>e.currentTarget.style.borderColor="#e0ede7"}>
              <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:10}}>
                <Av url={org.avatar_url} init={org.display_name||"?"} size={40}/>
                <div style={{flex:1,minWidth:0}}><div style={{fontSize:13,fontWeight:600,color:"#0f172a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{org.org_name||org.display_name}</div><div style={{fontSize:11,color:G}}>📍 {org.city}</div></div>
                {org.verified&&<span style={{fontSize:9,background:"#dbeafe",color:"#1e40af",padding:"2px 6px",borderRadius:99,fontWeight:700,flexShrink:0}}>✓</span>}
              </div>
              <div style={{fontSize:11,color:"#64748b",marginBottom:6}}>{org.primary_industry}</div>
              <div style={{display:"flex",gap:10,fontSize:11,color:"#94a3b8"}}>
                <span>{org.total_listed||0} listed</span>
                <span>⭐ {org.rating>0?Number(org.rating).toFixed(1):"New"}</span>
              </div>
            </div>
          ))}
        </div>
      :<Empty icon="🗺️" title={`No organizations in ${locData.short} yet`} sub="Be the first to join your local UpGive market."/>}
  </div>;
}

// ─── COMMUNITY BOARD ──────────────────────────────────────────────────────────
function CommunityCard({post,onRespond,onGo}){
  const{user}=useAuth();
  const isOwner=user&&user.id===post.user_id;
  const isUrgent=post.expires_at&&new Date(post.expires_at)-Date.now()<72*3600*1000;
  const daysAgo=Math.floor((Date.now()-new Date(post.created_at))/86400000);
  const when=daysAgo===0?"Today":daysAgo===1?"Yesterday":`${daysAgo}d ago`;
  return(
    <div style={{...card,padding:18,transition:"box-shadow .15s,transform .15s",borderLeft:isUrgent?`3px solid #ef4444`:"",background:isUrgent?"#fffafa":"#fff"}}
         onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 4px 18px rgba(0,0,0,.08)";e.currentTarget.style.transform="translateY(-2px)";}}
         onMouseLeave={e=>{e.currentTarget.style.boxShadow="";e.currentTarget.style.transform="";}}>
      <div style={{display:"flex",gap:10,alignItems:"flex-start",marginBottom:12}}>
        <Av url={post.profiles?.avatar_url} init={post.profiles?.display_name||"?"} size={40}/>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:13,fontWeight:700,color:"#0f172a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{post.profiles?.org_name||post.profiles?.display_name}</div>
          <div style={{fontSize:11,color:"#64748b",marginTop:2}}>{post.city||"Unknown location"}{post.country?`, ${post.country}`:""} · {when}</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:4,alignItems:"flex-end",flexShrink:0}}>
          {isUrgent&&<Tag label="Urgent" bg="#fee2e2" color="#991b1b"/>}
          {post.category&&<Tag label={post.category.split(" / ")[0]} bg="#f1f5f9" color="#475569"/>}
        </div>
      </div>
      <div style={{fontSize:14,fontWeight:700,color:"#0f172a",marginBottom:6,lineHeight:1.45}}>{post.title}</div>
      {post.description&&<p style={{fontSize:12,color:"#64748b",lineHeight:1.75,margin:"0 0 14px",display:"-webkit-box",WebkitLineClamp:3,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{post.description}</p>}
      {post.quantity&&<div style={{fontSize:11,color:"#94a3b8",marginBottom:12}}>Qty needed: {post.quantity} {post.unit}</div>}
      {!isOwner
        ?<div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <Btn v="primary" sz="sm" onClick={()=>onRespond(post)}>I Can Help</Btn>
            <Btn v="secondary" sz="sm" onClick={()=>onGo("list")}>Offer Goods</Btn>
          </div>
        :<span style={{fontSize:11,color:"#94a3b8",fontStyle:"italic"}}>Your request · manage in Dashboard</span>}
    </div>
  );
}

function CommunityScreen({onGo}){
  const{user}=useAuth();
  const[posts,setPosts]=useState([]);
  const[loading,setLoading]=useState(true);
  const[catFilter,setCatFilter]=useState("");
  const[countryRaw,setCountryRaw]=useState("");
  const[countryFilter,setCountryFilter]=useState("");
  const[cityRaw,setCityRaw]=useState("");
  const[cityFilter,setCityFilter]=useState("");
  const[sortBy,setSortBy]=useState("newest");
  const[searchRaw,setSearchRaw]=useState("");
  const[search,setSearch]=useState("");

  useEffect(()=>{const t=setTimeout(()=>setCountryFilter(countryRaw.trim()),420);return()=>clearTimeout(t);},[countryRaw]);
  useEffect(()=>{const t=setTimeout(()=>setCityFilter(cityRaw.trim()),420);return()=>clearTimeout(t);},[cityRaw]);

  const load=useCallback(()=>{
    setLoading(true);
    let q=supabase.from("listings").select("*,profiles(display_name,org_name,avatar_url,verified)").eq("status","active").in("listing_type",["buy","need"]);
    if(catFilter) q=q.ilike("category",`%${catFilter}%`);
    if(countryFilter) q=q.ilike("country",`%${countryFilter}%`);
    if(cityFilter) q=q.ilike("city",`%${cityFilter}%`);
    if(search) q=q.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    if(sortBy==="urgent") q=q.order("expires_at",{ascending:true,nullsFirst:false});
    else q=q.order("created_at",{ascending:false});
    q.limit(60).then(({data})=>{setPosts(data||[]);setLoading(false);});
  },[catFilter,countryFilter,cityFilter,search,sortBy]);

  useEffect(()=>{load();},[load]);

  const handleRespond=async post=>{
    if(!user){onGo("auth");return;}
    await supabase.rpc("get_or_create_conversation",{other_user_id:post.user_id,p_listing_id:post.id});
    onGo("msgs");
  };

  return(
    <div style={{padding:"20px 24px",maxWidth:1100,margin:"0 auto"}}>

      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12,marginBottom:22}}>
        <div>
          <h2 style={{fontFamily:"'DM Serif Display',serif",fontSize:26,color:"#0f172a",margin:"0 0 5px",letterSpacing:"-.3px"}}>Community Request Board</h2>
          <p style={{fontSize:13,color:"#64748b",margin:0,lineHeight:1.6}}>People and organizations sharing what they urgently need.<br/>If you have something that matches, reach out — it costs nothing to help.</p>
        </div>
        <Btn v="primary" sz="lg" onClick={()=>onGo("list",{listingType:"need"})}>+ Post a Request</Btn>
      </div>

      {/* Mission strip */}
      <div style={{background:`linear-gradient(135deg,${AMBER2},#fef9f0)`,border:`1px solid #fde68a`,borderRadius:10,padding:"12px 18px",marginBottom:20,display:"flex",alignItems:"center",gap:10}}>
        <span style={{fontSize:20}}>🤲</span>
        <p style={{fontSize:12,color:"#78350f",margin:0,lineHeight:1.7}}><strong>How it works:</strong> Post what you need and the community responds. Whether it's food supplies, medical equipment, school materials, or anything else — someone nearby may have exactly what you're looking for.</p>
      </div>

      {/* Filters row */}
      <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:18,alignItems:"flex-end"}}>
        <div style={{position:"relative",flex:"1 0 180px"}}>
          <input value={searchRaw} onChange={e=>setSearchRaw(e.target.value)} onKeyDown={e=>e.key==="Enter"&&setSearch(searchRaw)} placeholder="Search requests… press Enter" style={{...inp,fontSize:12,paddingRight:34}}/>
          <button onClick={()=>setSearch(searchRaw)} style={{position:"absolute",right:9,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",fontSize:14}}>🔍</button>
        </div>
        <select value={catFilter} onChange={e=>setCatFilter(e.target.value)} style={{...inp,fontSize:12,width:"auto",minWidth:160}}>
          <option value="">All categories</option>
          {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
        </select>
        <div style={{position:"relative",flex:"0 0 160px"}}>
          <input value={countryRaw} onChange={e=>setCountryRaw(e.target.value)} placeholder="Country…" style={{...inp,fontSize:12,paddingRight:countryFilter?26:12}}/>
          {countryFilter&&<button onClick={()=>{setCountryRaw("");setCountryFilter("");}} style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",fontSize:14,cursor:"pointer",color:"#94a3b8",lineHeight:1,padding:0}}>×</button>}
        </div>
        <div style={{position:"relative",flex:"0 0 160px"}}>
          <input value={cityRaw} onChange={e=>setCityRaw(e.target.value)} placeholder="City / Town / State…" style={{...inp,fontSize:12,paddingRight:cityFilter?26:12}}/>
          {cityFilter&&<button onClick={()=>{setCityRaw("");setCityFilter("");}} style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",fontSize:14,cursor:"pointer",color:"#94a3b8",lineHeight:1,padding:0}}>×</button>}
        </div>
        <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{...inp,fontSize:12,width:"auto"}}>
          <option value="newest">Newest first</option>
          <option value="urgent">Most urgent</option>
        </select>
      </div>

      {/* Results count */}
      <div style={{fontSize:12,color:"#94a3b8",marginBottom:14}}>{posts.length} request{posts.length!==1?"s":""} found</div>

      {/* Grid */}
      {loading?<Spinner/>:posts.length>0
        ?<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(290px,1fr))",gap:14}}>
            {posts.map(p=><CommunityCard key={p.id} post={p} onRespond={handleRespond} onGo={onGo}/>)}
          </div>
        :<Empty icon="🙏" title="No requests yet" sub="Be the first to post what your community needs." action={<Btn v="primary" onClick={()=>onGo("list",{listingType:"need"})}>Post a Request</Btn>}/>}
    </div>
  );
}

// ─── MESSAGES SCREEN ──────────────────────────────────────────────────────────
function MessagesScreen({onGoDelivery}){
  const{user}=useAuth();
  const[convos,setConvos]=useState([]);
  const[active,setActive]=useState(null);
  const[messages,setMessages]=useState([]);
  const[input,setInput]=useState("");
  const[loading,setLoading]=useState(true);
  const bodyRef=useRef(null);

  useEffect(()=>{
    if(!user)return;
    const loadConvos=()=>supabase.from("conversations").select("*,participant_profiles:profiles(id,display_name,org_name,avatar_url)").contains("participant_ids",[user.id]).order("updated_at",{ascending:false}).then(({data})=>{setConvos(data||[]);setLoading(false);});
    loadConvos();
    const sub=supabase.channel("convos-list").on("postgres_changes",{event:"UPDATE",schema:"public",table:"conversations"},loadConvos).subscribe();
    return()=>supabase.removeChannel(sub);
  },[user]);

  useEffect(()=>{
    if(!active)return;
    supabase.from("messages").select("*,sender:profiles(display_name,org_name,avatar_url)").eq("conversation_id",active.id).order("created_at").then(({data})=>setMessages(data||[]));
    const sub=supabase.channel(`msgs-${active.id}`).on("postgres_changes",{event:"INSERT",schema:"public",table:"messages",filter:`conversation_id=eq.${active.id}`},payload=>{setMessages(m=>[...m,payload.new]);}).subscribe();
    return()=>supabase.removeChannel(sub);
  },[active]);

  useEffect(()=>{if(bodyRef.current)bodyRef.current.scrollTop=bodyRef.current.scrollHeight;},[messages]);

  const send=async()=>{
    if(!input.trim()||!active||!user)return;
    const text=input.trim();setInput("");
    await supabase.from("messages").insert({conversation_id:active.id,sender_id:user.id,body:text});
  };

  const other=convo=>convo.participant_profiles?.find(p=>p.id!==user?.id);

  if(!user)return<Empty title="Sign in to view messages" action={<Btn v="primary">Sign in</Btn>}/>;

  return<div style={{padding:16}}>
    <SecHead>Messages</SecHead>
    <div style={{display:"grid",gridTemplateColumns:"245px 1fr",border:"1px solid #e0ede7",borderRadius:12,overflow:"hidden",background:"#fff",height:565}}>
      <div style={{borderRight:"1px solid #e0ede7",display:"flex",flexDirection:"column"}}>
        <div style={{padding:"11px 14px",borderBottom:"1px solid #e0ede7",fontSize:13,fontWeight:700,color:"#0f172a"}}>Conversations ({convos.length})</div>
        <div style={{overflowY:"auto",flex:1}}>
          {loading&&<Spinner/>}
          {!loading&&convos.length===0&&<div style={{padding:20,textAlign:"center",color:"#94a3b8",fontSize:12}}>No conversations yet.<br/>Message a vendor to start.</div>}
          {convos.map(c=>{
            const o=other(c);
            return<div key={c.id} onClick={()=>setActive(c)} style={{padding:"10px 14px",cursor:"pointer",borderBottom:"1px solid #f1f5f9",background:active?.id===c.id?G3:"#fff"}}>
              <div style={{display:"flex",gap:8,alignItems:"flex-start"}}>
                <Av url={o?.avatar_url} init={o?.display_name||"?"} size={34}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:12,fontWeight:700,color:"#0f172a"}}>{o?.org_name||o?.display_name||"Unknown"}</span><span style={{fontSize:10,color:"#94a3b8"}}>{c.last_message_at?new Date(c.last_message_at).toLocaleDateString():""}</span></div>
                  <div style={{fontSize:11,color:"#64748b",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:140}}>{c.last_message||"No messages yet"}</div>
                </div>
              </div>
            </div>;
          })}
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column"}}>
        {!active
          ?<div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",color:"#94a3b8",fontSize:13}}>Select a conversation to start messaging</div>
          :<>
            <div style={{padding:"10px 14px",borderBottom:"1px solid #e0ede7",display:"flex",alignItems:"center",gap:10}}>
              {(()=>{const o=other(active);return<><Av url={o?.avatar_url} init={o?.display_name||"?"} size={32}/><div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:"#0f172a"}}>{o?.org_name||o?.display_name}</div></div></>;})()}
              <div style={{display:"flex",gap:6}}>
                <Btn v="outline" sz="sm" onClick={onGoDelivery}>Delivery</Btn>
                <Btn v="outline" sz="sm" onClick={()=>setInput("I'd like to make an offer: ")}>Make Offer</Btn>
                <Btn v="outline" sz="sm" onClick={()=>setInput("Can we schedule a pickup for ")}>Schedule</Btn>
              </div>
            </div>
            <div ref={bodyRef} style={{flex:1,padding:14,overflowY:"auto",display:"flex",flexDirection:"column",gap:10}}>
              {messages.map(m=>{
                const isMe=m.sender_id===user?.id;
                return<div key={m.id} style={{alignSelf:isMe?"flex-end":"flex-start",maxWidth:"72%"}}>
                  <div style={{padding:"9px 13px",borderRadius:isMe?"13px 4px 13px 13px":"4px 13px 13px 13px",background:isMe?G:"#f1f5f9",color:isMe?"#fff":"#0f172a",fontSize:13,lineHeight:1.55}}>{m.body}</div>
                  <div style={{fontSize:10,color:"#94a3b8",marginTop:2,textAlign:isMe?"right":"left"}}>{new Date(m.created_at).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</div>
                </div>;
              })}
            </div>
            <div style={{padding:"10px 14px",borderTop:"1px solid #e0ede7",display:"flex",gap:8}}>
              <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Type a message… (Enter to send)" style={{...inp,flex:1}}/>
              <Btn v="primary" onClick={send}>Send</Btn>
            </div>
          </>}
      </div>
    </div>
  </div>;
}

// ─── DELIVERY SCREEN ──────────────────────────────────────────────────────────
function DeliveryScreen({loc}){
  const[tab,setTab]=useState("local");
  const[dest,setDest]=useState("");
  const locData=LOCS[loc]||LOCS.atlanta;

  const DC=({o})=>(
    <div style={{...card,padding:16,marginBottom:12,borderWidth:o.rec?2:1,borderColor:o.rec?G:"#e0ede7"}}>
      {o.rec&&<div style={{display:"inline-block",background:G3,color:G2,fontSize:10,padding:"2px 10px",borderRadius:99,fontWeight:700,marginBottom:10}}>✓ {o.recLabel||"Recommended"}</div>}
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <div style={{width:44,height:44,borderRadius:10,background:"#f0fbf5",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,border:"1px solid #e0ede7",flexShrink:0}}>{o.icon}</div>
        <div style={{flex:1}}><div style={{fontSize:14,fontWeight:700,color:"#0f172a"}}>{o.name}</div><div style={{fontSize:12,color:"#64748b"}}>{o.sub}</div></div>
        <div style={{textAlign:"right",flexShrink:0}}><div style={{fontSize:16,fontWeight:700,color:"#0f172a"}}>{o.price}</div>{o.eta&&<div style={{fontSize:11,color:"#64748b"}}>{o.eta}</div>}</div>
      </div>
      {o.feats&&<div style={{display:"flex",gap:6,marginTop:10,flexWrap:"wrap"}}>{o.feats.map(f=><span key={f} style={{fontSize:10,padding:"2px 8px",borderRadius:99,background:"#f1f5f9",color:"#475569"}}>{f}</span>)}</div>}
    </div>
  );

  const local=[
    {icon:"✅",name:"Local pickup",sub:"Free · Coordinate via UpGive messages",price:"Free",eta:"Flexible",rec:true,recLabel:"Zero cost · zero emissions",feats:["No fees","Direct coordination","Message vendor to arrange"]},
    {icon:"🚚",name:"UPS Ground",sub:"Domestic · 3–5 business days",price:"$12–$38",eta:"3–5 days",feats:["Tracking","Door to door","Up to 150 lbs"]},
    {icon:"⚡",name:"FedEx Express",sub:"Next-day or 2-day domestic",price:"$28–$80",eta:"1–2 days",feats:["Priority handling","Saturday delivery"]},
    {icon:"📮",name:"USPS Priority Mail",sub:"Domestic · 1–3 business days",price:"$8–$26",eta:"1–3 days",feats:["Affordable for <70 lbs","Free pickup"]},
  ];
  const cold=[
    {icon:"❄️",name:"Lineage Logistics Cold Chain",sub:"Refrigerated · 35–38°F maintained",price:"$0.18/lb/day",eta:"Nationwide",rec:true,recLabel:"Best for perishables",feats:["FDA compliant","Temp monitoring","Last-mile included"]},
    {icon:"🧊",name:"Americold Frozen Freight",sub:"Deep frozen · -10°F maintained",price:"Quote based",eta:"2–5 days",feats:["USDA approved","Bulk frozen goods"]},
    {icon:"🌡️",name:"Peli BioThermal",sub:"Pharma & biomedical cold chain",price:"Quote based",eta:"Custom",feats:["GxP compliant","Validation docs"]},
  ];
  const bulk=[
    {icon:"🚛",name:"XPO Logistics LTL",sub:"Less-than-truckload · pallets & crates",price:"$180–$800",eta:"3–7 days",rec:true,recLabel:"For pallets & tonnes",feats:["Liftgate included","International routes"]},
    {icon:"🚢",name:"Maersk Ocean Freight",sub:"Full or shared container (LCL/FCL)",price:"$800–$4,200",eta:"14–45 days",feats:["20ft / 40ft containers","Global ports"]},
    {icon:"✈️",name:"Cargolux Air Freight",sub:"Urgent bulk by air",price:"$3.50–$8/kg",eta:"1–3 days",feats:["Fast global delivery","Charter available"]},
  ];

  return<div style={{padding:"16px 20px"}}>
    <SecHead>Delivery Options</SecHead>
    <Alert><strong>Shipping from: {locData.label}</strong> — recommendations tailored to your region. For overseas deliveries, open the International tab and select your destination country.</Alert>
    <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
      {[["local","Local / Domestic"],["intl","International"],["cold","Cold Chain"],["bulk","Bulk / Freight"]].map(([id,label])=>(
        <button key={id} onClick={()=>setTab(id)} style={{padding:"7px 17px",borderRadius:99,border:tab===id?"none":"1px solid #e0ede7",background:tab===id?G:"#fff",color:tab===id?"#fff":"#64748b",fontSize:13,fontWeight:tab===id?700:400,cursor:"pointer"}}>{label}</button>
      ))}
    </div>
    {tab==="local"&&local.map((o,i)=><DC key={i} o={o}/>)}
    {tab==="intl"&&<div>
      <Alert type="blue">Shipping from <strong>{locData.short}</strong>. Select your destination country to see recommended carriers, estimated transit times, and customs guidance specific to that route.</Alert>
      <TSel label="Destination country" value={dest} onChange={e=>setDest(e.target.value)} options={[{v:"",l:"Select destination country..."},{v:"uk",l:"United Kingdom"},{v:"ng",l:"Nigeria"},{v:"jp",l:"Japan"},{v:"br",l:"Brazil"},{v:"au",l:"Australia"},{v:"de",l:"Germany"},{v:"in",l:"India"}]} style={{maxWidth:340,marginBottom:16}}/>
      {dest?(INTL_CARRIERS[dest]||[]).map((o,i)=><DC key={i} o={{...o,icon:i===0?"🚀":i===1?"🚢":"📦",name:o.name,sub:`Est. ${o.eta} · ${locData.short} to destination`,rec:o.rec,recLabel:"Best route for this destination"}}/>):<div style={{textAlign:"center",padding:"40px 0",color:"#94a3b8"}}>Select a destination country to see carrier options</div>}
    </div>}
    {tab==="cold"&&cold.map((o,i)=><DC key={i} o={o}/>)}
    {tab==="bulk"&&bulk.map((o,i)=><DC key={i} o={o}/>)}
  </div>;
}

// ─── LIST SCREEN ──────────────────────────────────────────────────────────────
// ─── DELIVERY TIP ROW ─────────────────────────────────────────────────────────
function DeliveryTip({icon,title,body}){
  return(
    <div style={{display:"flex",gap:10,alignItems:"flex-start",padding:"9px 12px",background:"rgba(255,255,255,.65)",borderRadius:8,border:"1px solid rgba(253,230,138,.55)"}}>
      <span style={{fontSize:15,flexShrink:0,marginTop:1}}>{icon}</span>
      <div style={{fontSize:12,color:"#92400e",lineHeight:1.7}}><strong style={{color:"#78350f"}}>{title}:</strong> {body}</div>
    </div>
  );
}

function ListScreen({onGo,defaultType}){
  const{user,profile}=useAuth();
  const[form,setForm]=useState({title:"",description:"",listing_type:defaultType||"donate",category:"",industry:"",quantity:"",unit:"Units",condition:"new",price:"",city:profile?.city||"",country:profile?.country||"",location_key:profile?.location_key||"atlanta",pickup_available:true,domestic_shipping:false,international:false,cold_chain:false,bulk_freight:false,visibility:"public",expires_at:""});
  const[images,setImages]=useState([]);
  const[uploading,setUploading]=useState(false);
  const[saving,setSaving]=useState(false);
  const[error,setError]=useState("");
  const[success,setSuccess]=useState(false);
  const fileRef=useRef(null);
  const set=k=>e=>setForm(f=>({...f,[k]:e.target.value}));
  const tog=k=>()=>setForm(f=>({...f,[k]:!f[k]}));

  const handleImages=async e=>{
    const files=Array.from(e.target.files);setUploading(true);
    const urls=[];
    for(const file of files.slice(0,12)){
      const path=`${user.id}/${Date.now()}-${file.name}`;
      const{error:ue}=await supabase.storage.from("listing-images").upload(path,file);
      if(!ue){const{data}=supabase.storage.from("listing-images").getPublicUrl(path);urls.push(data.publicUrl);}
    }
    setImages(prev=>[...prev,...urls]);setUploading(false);
  };

  const submit=async(draft=false)=>{
    if(!user){setError("Sign in to post a listing.");return;}
    if(!form.title||!form.category){setError("Title and category are required.");return;}
    setError("");setSaving(true);
    const{error:pe}=await supabase.from("listings").insert({...form,user_id:user.id,status:draft?"draft":"active",price:form.listing_type==="donate"?null:(parseFloat(form.price)||null),quantity:parseFloat(form.quantity)||null,images,expires_at:form.expires_at||null,city:form.city||profile?.city,country:form.country||profile?.country,location_key:form.location_key||profile?.location_key});
    setSaving(false);
    if(pe)setError(pe.message);else{setSuccess(true);setTimeout(()=>onGo("dash"),1500);}
  };

  if(!user)return<Empty title="Sign in to post a listing" action={<Btn v="primary" onClick={()=>onGo("auth")}>Sign in</Btn>}/>;
  if(success)return<Empty title="Listing published!" sub="Your item is now live. Redirecting…"/>;

  const types=[{id:"donate",label:"Donate / Free",sub:"Give it away at no cost"},{id:"sell",label:"Sell / Reduced",sub:"Recoup some cost"},{id:"swap",label:"Swap",sub:"Trade goods"},{id:"buy",label:"Want to Buy",sub:"Seeking surplus goods"},{id:"need",label:"Community Request",sub:"Urgently needed"}];

  return<div style={{maxWidth:700,margin:"0 auto",padding:22}}>
    <SecHead>Post a Listing</SecHead>
    {error&&<Alert type="red" icon="⚠️">{error}</Alert>}
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(120px,1fr))",gap:8,marginBottom:22}}>
      {types.map(t=><div key={t.id} onClick={()=>setForm(f=>({...f,listing_type:t.id}))} style={{...card,padding:12,textAlign:"center",cursor:"pointer",border:`${form.listing_type===t.id?2:1}px solid ${form.listing_type===t.id?(t.id==="need"?AMBER:G):"#e3d8cc"}`,background:form.listing_type===t.id?(t.id==="need"?AMBER2:G3):"#fff"}}><div style={{fontSize:12,fontWeight:700,color:"#0f172a",marginBottom:3}}>{t.label}</div><div style={{fontSize:10,color:"#64748b"}}>{t.sub}</div></div>)}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:13}}>
      <TInp label="Title" placeholder="e.g. Surplus office chairs ×80" value={form.title} onChange={set("title")} required/>
      <TSel label="Category" value={form.category} onChange={set("category")} required options={[{v:"",l:"Select category…"},...CATEGORIES.map(c=>({v:c,l:c}))]}/>
      <TSel label="Industry" value={form.industry} onChange={set("industry")} options={[{v:"",l:"Select industry…"},...INDUSTRIES.map(c=>({v:c,l:c}))]}/>
      <TSel label="Condition" value={form.condition} onChange={set("condition")} options={CONDITIONS}/>
      <TInp label="Quantity" type="number" placeholder="100" value={form.quantity} onChange={set("quantity")}/>
      <TSel label="Unit" value={form.unit} onChange={set("unit")} options={["Units","Kg","Tonnes","Pallets","Boxes","Litres"]}/>
      {form.listing_type!=="donate"&&<TInp label="Price (USD)" type="number" placeholder="0.00" value={form.price} onChange={set("price")}/>}
      <TInp label="Available until" type="date" value={form.expires_at} onChange={set("expires_at")}/>
      <div style={{gridColumn:"1/-1"}}>
        <Field label="Description">
          <textarea rows={3} placeholder="Describe the items, condition, why they're surplus, any limitations…" value={form.description} onChange={set("description")} style={{...inp,resize:"none"}}/>
        </Field>
      </div>
      <TInp label="City" placeholder="Atlanta, GA" value={form.city} onChange={set("city")}/>
      <TSel label="Market region" value={form.location_key} onChange={set("location_key")} options={Object.entries(LOCS).map(([k,v])=>({v:k,l:v.label}))}/>
    </div>

    <div style={{marginTop:16,marginBottom:16}}>
      <div style={{fontSize:11,fontWeight:700,color:"#64748b",marginBottom:10,textTransform:"uppercase",letterSpacing:.5}}>Delivery options offered</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        {[["pickup_available","Local pickup"],["domestic_shipping","Domestic shipping"],["international","International shipping"],["cold_chain","Cold chain"],["bulk_freight","Bulk / pallet freight"]].map(([k,label])=>(
          <label key={k} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",border:`1.5px solid ${form[k]?G:"#e0ede7"}`,borderRadius:8,cursor:"pointer",background:form[k]?G3:"#fff"}}>
            <input type="checkbox" checked={form[k]} onChange={tog(k)} style={{accentColor:G,width:15,height:15}}/><span style={{fontSize:12,color:"#0f172a"}}>{label}</span>
          </label>
        ))}
      </div>
    </div>

    {/* ── DELIVERY RESPONSIBILITY NOTICE ── */}
    <div style={{background:AMBER2,border:`1.5px solid #fde68a`,borderRadius:10,padding:"16px 18px",marginBottom:18}}>
      <div style={{display:"flex",gap:10,alignItems:"flex-start",marginBottom:(form.pickup_available||form.domestic_shipping||form.international||form.cold_chain||form.bulk_freight)?14:0}}>
        <div>
          <div style={{fontSize:14,fontWeight:700,color:"#78350f",marginBottom:5}}>Delivery is your responsibility</div>
          <div style={{fontSize:12,color:"#92400e",lineHeight:1.75}}>As the donor or seller, you are responsible for arranging and covering the cost of delivery. Once a claim is approved, the recipient will coordinate with you via UpGive Messages to finalise details.</div>
        </div>
      </div>
      {(form.pickup_available||form.domestic_shipping||form.international||form.cold_chain||form.bulk_freight)&&<>
        <div style={{fontSize:10,fontWeight:700,color:"#78350f",textTransform:"uppercase",letterSpacing:.8,marginBottom:10}}>Suggested carriers for your selected options</div>
        <div style={{display:"flex",flexDirection:"column",gap:7}}>
          {form.pickup_available&&<DeliveryTip icon="📍" title="Local pickup" body="Zero cost and zero emissions — the best option when possible. Use UpGive Messages to agree on a date, time, and address directly with the claimant."/>}
          {form.domestic_shipping&&<DeliveryTip icon="🚚" title="Domestic shipping" body="UPS Ground $12–38 (up to 150 lbs, 3–5 days) · FedEx Express $28–80 (1–2 days) · USPS Priority Mail $8–26 (1–3 days, free pickup). Compare at each carrier's website."/>}
          {form.international&&<DeliveryTip icon="🌍" title="International" body="DHL Express is recommended for most destinations (3–5 days, $38–120, includes customs clearance). Open the Delivery screen and select your destination country for route-specific options and customs guidance."/>}
          {form.cold_chain&&<DeliveryTip icon="❄️" title="Cold chain / perishables" body="Lineage Logistics: refrigerated 35–38 °F, $0.18/lb/day, FDA-compliant with temperature monitoring. Americold for deep-frozen goods (–10 °F). Confirm temperature requirements with the recipient before booking."/>}
          {form.bulk_freight&&<DeliveryTip icon="🚛" title="Bulk / pallet freight" body="XPO Logistics LTL $180–800 for pallets and crates (3–7 days, liftgate included). Maersk LCL/FCL ocean freight $800–4,200 for large lots. Request a quote via the Delivery screen."/>}
        </div>
        <button onClick={()=>onGo("delivery")} style={{marginTop:12,fontSize:11,fontWeight:700,color:AMBER,background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",letterSpacing:.3}}>View full delivery guide →</button>
      </>}
    </div>

    <TSel label="Who can see this listing" value={form.visibility} onChange={set("visibility")} options={[{v:"public",l:"Anyone on UpGive"},{v:"network",l:"My network only"},{v:"verified_only",l:"Verified orgs only"},{v:"industry",l:"Same industry only"}]} style={{marginBottom:16}}/>

    <div onClick={()=>fileRef.current?.click()} style={{border:"1.5px dashed #c5edd9",borderRadius:10,padding:28,textAlign:"center",cursor:"pointer",background:"#f0fbf5",marginBottom:16}}>
      <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleImages} style={{display:"none"}}/>
      {uploading?<div style={{fontSize:13,color:G}}>Uploading photos…</div>:<><div style={{fontSize:13,fontWeight:600,color:"#64748b",marginBottom:4}}>Drop photos or click to upload</div><div style={{fontSize:11,color:"#94a3b8"}}>PNG, JPG, WebP · up to 12 photos</div></>}
    </div>
    {images.length>0&&<div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16}}>
      {images.map((url,i)=><div key={i} style={{position:"relative"}}><img src={url} alt="" style={{width:72,height:72,objectFit:"cover",borderRadius:8,border:"1px solid #e0ede7"}}/><button onClick={()=>setImages(imgs=>imgs.filter((_,j)=>j!==i))} style={{position:"absolute",top:-6,right:-6,width:18,height:18,borderRadius:"50%",background:"#ef4444",color:"#fff",border:"none",fontSize:11,cursor:"pointer"}}>×</button></div>)}
    </div>}

    <div style={{display:"flex",gap:10}}>
      <Btn v="primary" sz="lg" onClick={()=>submit(false)} disabled={saving}>{saving?"Publishing…":"Publish listing"}</Btn>
      <Btn v="outline" sz="lg" onClick={()=>submit(true)} disabled={saving}>Save draft</Btn>
    </div>
  </div>;
}

// ─── DASHBOARD SETTINGS (stable module-level component — avoid inner remounts) ─
function DashSettings({user,profile,signOut,refreshProfile}){
  const[pf,setPf]=useState({display_name:profile?.display_name||"",org_name:profile?.org_name||"",bio:profile?.bio||"",website:profile?.website||"",city:profile?.city||"",country:profile?.country||"",primary_industry:profile?.primary_industry||""});
  const[saving,setSaving]=useState(false);
  const[saved,setSaved]=useState(false);
  const[avatarUploading,setAvatarUploading]=useState(false);
  const aRef=useRef(null);
  const save=async()=>{setSaving(true);await supabase.from("profiles").update(pf).eq("id",user.id);await refreshProfile();setSaving(false);setSaved(true);setTimeout(()=>setSaved(false),2500);};
  const uploadAvatar=async e=>{
    const file=e.target.files?.[0];if(!file)return;setAvatarUploading(true);
    const path=`${user.id}/avatar`;
    await supabase.storage.from("avatars").upload(path,file,{upsert:true});
    const{data}=supabase.storage.from("avatars").getPublicUrl(path);
    await supabase.from("profiles").update({avatar_url:data.publicUrl+"?t="+Date.now()}).eq("id",user.id);
    await refreshProfile();setAvatarUploading(false);
  };
  return<div style={{padding:16,maxWidth:600}}>
    <SecHead>Account Settings</SecHead>
    <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:20,padding:16,background:"#f0fbf5",borderRadius:12}}>
      <div style={{position:"relative"}}>
        <Av url={profile?.avatar_url} init={profile?.display_name||"?"} size={64}/>
        <button onClick={()=>aRef.current?.click()} style={{position:"absolute",bottom:0,right:0,width:22,height:22,borderRadius:"50%",background:G,color:"#fff",border:"none",fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✎</button>
        <input ref={aRef} type="file" accept="image/*" onChange={uploadAvatar} style={{display:"none"}}/>
      </div>
      <div><div style={{fontSize:15,fontWeight:700,color:"#0f172a"}}>{profile?.display_name}</div><div style={{fontSize:12,color:"#64748b"}}>{profile?.account_type} · {profile?.city}</div>{avatarUploading&&<div style={{fontSize:11,color:G}}>Uploading avatar…</div>}</div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:13,marginBottom:16}}>
      {[["display_name","Display name","Your Name"],["org_name","Organization","Acme Corp"],["website","Website","https://yourorg.com"],["city","City","Atlanta, GA"],["country","Country","United States"]].map(([k,label,ph])=>(
        <TInp key={k} label={label} placeholder={ph} value={pf[k]||""} onChange={e=>setPf(f=>({...f,[k]:e.target.value}))}/>
      ))}
      <TSel label="Primary industry" value={pf.primary_industry} onChange={e=>setPf(f=>({...f,primary_industry:e.target.value}))} options={[{v:"",l:"Select…"},...INDUSTRIES.map(i=>({v:i,l:i}))]}/>
    </div>
    <Field label="Bio" style={{marginBottom:16}}><textarea rows={3} placeholder="Tell others about your organization…" value={pf.bio||""} onChange={e=>setPf(f=>({...f,bio:e.target.value}))} style={{...inp,resize:"none"}}/></Field>
    {saved&&<Alert icon="✅">Settings saved.</Alert>}
    <div style={{display:"flex",gap:10}}>
      <Btn v="primary" onClick={save} disabled={saving}>{saving?"Saving…":"Save settings"}</Btn>
      <Btn v="danger" onClick={signOut}>Sign out</Btn>
    </div>
  </div>;
}

// ─── DASHBOARD SCREEN ─────────────────────────────────────────────────────────
// ─── LISTING ROW (dashboard) ─────────────────────────────────────────────────
// Defined outside DashboardScreen so React never unmounts it on parent re-renders.
function ListingRow({listing,onRemoved}){
  const[confirming,setConfirming]=useState(false);
  const[busy,setBusy]=useState(false);
  const[err,setErr]=useState("");

  const doRemove=async()=>{
    setBusy(true);setErr("");
    const{data,error}=await supabase
      .from("listings")
      .update({status:"removed"})
      .eq("id",listing.id)
      .select("id");
    setBusy(false);
    if(error){setErr(error.message);setConfirming(false);return;}
    if(!data?.length){setErr("Could not remove — the listing may already be gone, or your account lacks permission.");setConfirming(false);return;}
    onRemoved(listing.id);
  };

  return(
    <div style={{...card,padding:14,display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
      <div style={{width:44,height:44,borderRadius:8,background:"#f0fbf5",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,overflow:"hidden",flexShrink:0}}>
        {listing.images?.[0]?<img src={listing.images[0]} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<div style={{width:20,height:20,borderRadius:3,background:"#c5edd9"}}/>}
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:13,fontWeight:600,color:"#0f172a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{listing.title}</div>
        <div style={{fontSize:11,color:"#64748b",marginTop:1}}>{listing.category} · <span style={{textTransform:"capitalize"}}>{listing.listing_type}</span></div>
      </div>
      <span style={{fontSize:14,fontWeight:700,color:!listing.price?AMBER:"#0f172a",flexShrink:0}}>{listing.price?`$${listing.price}`:"Free"}</span>
      <span style={{fontSize:10,padding:"2px 9px",borderRadius:99,fontWeight:700,flexShrink:0,background:listing.status==="active"?"#dcfce7":listing.status==="draft"?"#fef3c7":"#fee2e2",color:listing.status==="active"?"#166534":listing.status==="draft"?"#92400e":"#991b1b"}}>{listing.status}</span>

      {confirming
        ?<div style={{display:"flex",gap:6,alignItems:"center",flexShrink:0}}>
            <span style={{fontSize:11,color:"#64748b"}}>Remove this listing?</span>
            <Btn v="danger" sz="sm" onClick={doRemove} disabled={busy}>{busy?"Removing…":"Yes, remove"}</Btn>
            <Btn v="outline" sz="sm" onClick={()=>{setConfirming(false);setErr("");}} disabled={busy}>Cancel</Btn>
          </div>
        :<Btn v="danger" sz="sm" onClick={()=>setConfirming(true)}>Remove</Btn>}

      {err&&<div style={{width:"100%",fontSize:11,color:"#991b1b",background:"#fee2e2",border:"1px solid #fecaca",borderRadius:6,padding:"6px 10px",marginTop:4}}>{err}</div>}
    </div>
  );
}

// ─── REMOVE WITH CONFIRM (listing detail page) ───────────────────────────────
function RemoveListingBtn({listingId,onSuccess}){
  const[confirming,setConfirming]=useState(false);
  const[busy,setBusy]=useState(false);
  const[err,setErr]=useState("");

  const doRemove=async()=>{
    setBusy(true);setErr("");
    const{data,error}=await supabase.from("listings").update({status:"removed"}).eq("id",listingId).select("id");
    setBusy(false);
    if(error){setErr(error.message);return;}
    if(!data?.length){setErr("Could not remove — check permissions or try again.");return;}
    onSuccess();
  };

  if(confirming)return(
    <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
      <span style={{fontSize:13,color:"#991b1b",fontWeight:600}}>Confirm removal?</span>
      <Btn v="danger" sz="lg" onClick={doRemove} disabled={busy}>{busy?"Removing…":"Yes, remove"}</Btn>
      <Btn v="outline" sz="lg" onClick={()=>{setConfirming(false);setErr("");}} disabled={busy}>Cancel</Btn>
      {err&&<div style={{width:"100%",fontSize:12,color:"#991b1b",marginTop:4}}>{err}</div>}
    </div>
  );
  return<Btn v="danger" sz="lg" onClick={()=>setConfirming(true)}>Remove Listing</Btn>;
}

function DashboardScreen({role,onGo}){
  const{user,profile,refreshProfile,signOut}=useAuth();
  const[tab,setTab]=useState("overview");
  const[listings,setListings]=useState([]);
  const[claims,setClaims]=useState([]);
  const[convos,setConvos]=useState([]);
  const[loading,setLoading]=useState(true);

  useEffect(()=>{
    if(!user)return;
    Promise.all([
      supabase.from("listings").select("*").eq("user_id",user.id).neq("status","removed").order("created_at",{ascending:false}).limit(20),
      supabase.from("claims").select("*,listing:listings(title),claimant:profiles!claims_claimant_id_fkey(display_name,org_name,avatar_url)").eq("vendor_id",user.id).order("created_at",{ascending:false}).limit(20),
      supabase.from("conversations").select("*,participant_profiles:profiles(id,display_name,org_name,avatar_url)").contains("participant_ids",[user.id]).order("updated_at",{ascending:false}).limit(5),
    ]).then(([l,cl,cv])=>{setListings(l.data||[]);setClaims(cl.data||[]);setConvos(cv.data||[]);setLoading(false);});
  },[user]);

  const updateClaim=async(id,status)=>{await supabase.from("claims").update({status}).eq("id",id);setClaims(p=>p.map(c=>c.id===id?{...c,status}:c));};
  const tabs=[["overview","Overview"],["listings","Listings"],["claims","Claims"],["impact","Impact"],["settings","Settings"]];

  if(!user)return<Empty title="Sign in to view your dashboard" action={<Btn v="primary" onClick={()=>onGo("auth")}>Sign in</Btn>}/>;

  const Overview=()=><div style={{padding:16}}>
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:16}}>
      {[["Items listed",profile?.total_listed||listings.length],["Claims received",profile?.total_claimed||claims.length],["Rating",profile?.rating>0?Number(profile.rating).toFixed(1):"—"],["Followers",profile?.follower_count||0]].map(([label,val])=>(
        <div key={label} style={{background:"#f0fbf5",border:"1px solid #c5edd9",borderRadius:10,padding:"14px 16px"}}><div style={{fontSize:11,color:"#64748b",marginBottom:4,textTransform:"uppercase",letterSpacing:.5}}>{label}</div><div style={{fontSize:22,fontWeight:700,color:"#0f172a"}}>{val}</div></div>
      ))}
    </div>
    <SecHead>Recent Conversations</SecHead>
    {convos.length===0&&<div style={{color:"#94a3b8",fontSize:13,padding:"12px 0"}}>No conversations yet.</div>}
    {convos.map(c=>{
      const o=c.participant_profiles?.find(p=>p.id!==user.id);
      return<div key={c.id} onClick={()=>onGo("msgs")} style={{display:"flex",gap:10,padding:"10px 0",borderBottom:"1px solid #f1f5f9",cursor:"pointer"}}>
        <Av url={o?.avatar_url} init={o?.display_name||"?"} size={32}/>
        <div><div style={{fontSize:13,fontWeight:600,color:"#0f172a"}}>{o?.org_name||o?.display_name}</div><div style={{fontSize:11,color:"#64748b"}}>{c.last_message||"No messages"}</div></div>
        <span style={{marginLeft:"auto",fontSize:10,color:"#94a3b8"}}>{c.last_message_at?new Date(c.last_message_at).toLocaleDateString():""}</span>
      </div>;
    })}
  </div>;

  const Listings=()=><div style={{padding:16}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
      <span style={{fontSize:14,fontWeight:700}}>My listings ({listings.length})</span>
      <Btn v="primary" onClick={()=>onGo("list")}>+ Add listing</Btn>
    </div>
    {loading&&<Spinner/>}
    {!loading&&listings.length===0&&<Empty title="No listings yet" sub="Post your first surplus item." action={<Btn v="primary" onClick={()=>onGo("list")}>+ Post listing</Btn>}/>}
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      {listings.map(l=>(
        <ListingRow key={l.id} listing={l} onRemoved={id=>setListings(p=>p.filter(x=>x.id!==id))}/>
      ))}
    </div>
  </div>;

  const Claims=()=><div style={{padding:16}}>
    <SecHead>Incoming Claim Requests</SecHead>
    {loading&&<Spinner/>}
    {!loading&&claims.length===0&&<Empty icon="📥" title="No claim requests yet" sub="When someone claims your listings, they appear here."/>}
    {claims.map(c=>(
      <div key={c.id} style={{...card,marginBottom:12,overflow:"hidden"}}>
        {/* Claim row */}
        <div style={{padding:14,display:"flex",alignItems:"center",gap:12}}>
          <Av url={c.claimant?.avatar_url} init={c.claimant?.display_name||"?"} size={38}/>
          <div style={{flex:1}}>
            <div style={{fontSize:13,fontWeight:600,color:"#0f172a"}}>{c.claimant?.org_name||c.claimant?.display_name}</div>
            <div style={{fontSize:11,color:"#64748b",marginTop:1}}>Claiming: <em>{c.listing?.title}</em></div>
          </div>
          <span style={{fontSize:10,padding:"2px 9px",borderRadius:99,fontWeight:700,background:c.status==="approved"?"#dcfce7":c.status==="shipped"?"#dbeafe":c.status==="declined"?"#fee2e2":"#fef3c7",color:c.status==="approved"?"#166534":c.status==="shipped"?"#1e40af":c.status==="declined"?"#991b1b":"#92400e",textTransform:"capitalize"}}>{c.status}</span>
          {c.status==="pending"&&<div style={{display:"flex",gap:6}}><Btn v="secondary" sz="sm" onClick={()=>updateClaim(c.id,"approved")}>Approve</Btn><Btn v="danger" sz="sm" onClick={()=>updateClaim(c.id,"declined")}>Decline</Btn></div>}
          {c.status==="approved"&&<Btn v="primary" sz="sm" onClick={()=>updateClaim(c.id,"shipped")}>Mark as Shipped</Btn>}
        </div>

        {/* Delivery responsibility panel — shown once claim is approved */}
        {c.status==="approved"&&(
          <div style={{background:AMBER2,borderTop:`1.5px solid #fde68a`,padding:"14px 16px"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              <span style={{fontSize:13,fontWeight:700,color:"#78350f"}}>Delivery is now your responsibility</span>
            </div>
            <p style={{fontSize:12,color:"#92400e",lineHeight:1.75,margin:"0 0 12px"}}>
              This claim is approved. Please reach out to <strong>{c.claimant?.org_name||c.claimant?.display_name}</strong> via Messages to agree on a delivery method and arrange shipping at your cost.
            </p>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(175px,1fr))",gap:8}}>
              {[
                {title:"Local pickup",detail:"Free · coordinate via Messages"},
                {title:"Domestic shipping",detail:"UPS $12–38 · USPS $8–26 · FedEx $28–80"},
                {title:"International",detail:"DHL Express $38–120 · 3–5 days"},
                {title:"Bulk / freight",detail:"XPO LTL $180–800 · Maersk $800+"},
              ].map(({title,detail})=>(
                <div key={title} style={{padding:"9px 12px",background:"rgba(255,255,255,.7)",borderRadius:8,border:"1px solid rgba(253,230,138,.6)"}}>
                  <div style={{fontSize:12,fontWeight:700,color:"#78350f",marginBottom:3}}>{title}</div>
                  <div style={{fontSize:11,color:"#92400e",lineHeight:1.55}}>{detail}</div>
                </div>
              ))}
            </div>
            <div style={{marginTop:10,display:"flex",gap:10}}>
              <Btn v="outline" sz="sm" onClick={()=>onGo("msgs")} style={{fontSize:11,borderColor:"#fde68a",color:"#78350f",background:"rgba(255,255,255,.6)"}}>Message Claimant</Btn>
              <Btn v="outline" sz="sm" onClick={()=>onGo("delivery")} style={{fontSize:11,borderColor:"#fde68a",color:"#78350f",background:"rgba(255,255,255,.6)"}}>View delivery guide</Btn>
            </div>
          </div>
        )}
      </div>
    ))}
  </div>;

  const Impact=()=><div style={{padding:16}}>
    <SecHead>Your Impact</SecHead>
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:20}}>
      <div style={{background:"#f0fbf5",border:"1px solid #c5edd9",borderRadius:10,padding:"14px 16px"}}><div style={{fontSize:11,color:"#64748b",marginBottom:4}}>Listings posted</div><div style={{fontSize:22,fontWeight:700,color:G}}>{profile?.total_listed||0}</div></div>
      <div style={{background:"#f0fbf5",border:"1px solid #c5edd9",borderRadius:10,padding:"14px 16px"}}><div style={{fontSize:11,color:"#64748b",marginBottom:4}}>Items redistributed</div><div style={{fontSize:22,fontWeight:700,color:G}}>{profile?.total_claimed||0}</div></div>
      <div style={{background:"#f0fbf5",border:"1px solid #c5edd9",borderRadius:10,padding:"14px 16px"}}><div style={{fontSize:11,color:"#64748b",marginBottom:4}}>Est. value donated</div><div style={{fontSize:22,fontWeight:700,color:G}}>${Number(profile?.total_value||0).toLocaleString()}</div></div>
    </div>
    <Alert>Every item you list keeps goods out of landfills and connects them with people who need them. Your impact grows with every listing.</Alert>
  </div>;

  const Settings=()=>{
    const[pf,setPf]=useState({display_name:profile?.display_name||"",org_name:profile?.org_name||"",bio:profile?.bio||"",website:profile?.website||"",city:profile?.city||"",country:profile?.country||"",primary_industry:profile?.primary_industry||""});
    const[saving,setSaving]=useState(false);
    const[saved,setSaved]=useState(false);
    const[avatarUploading,setAvatarUploading]=useState(false);
    const aRef=useRef(null);

    const save=async()=>{setSaving(true);await supabase.from("profiles").update(pf).eq("id",user.id);await refreshProfile();setSaving(false);setSaved(true);setTimeout(()=>setSaved(false),2500);};

    const uploadAvatar=async e=>{
      const file=e.target.files?.[0];if(!file)return;setAvatarUploading(true);
      const path=`${user.id}/avatar`;
      await supabase.storage.from("avatars").upload(path,file,{upsert:true});
      const{data}=supabase.storage.from("avatars").getPublicUrl(path);
      await supabase.from("profiles").update({avatar_url:data.publicUrl+"?t="+Date.now()}).eq("id",user.id);
      await refreshProfile();setAvatarUploading(false);
    };

    return<div style={{padding:16,maxWidth:600}}>
      <SecHead>Account Settings</SecHead>
      <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:20,padding:16,background:"#f0fbf5",borderRadius:12}}>
        <div style={{position:"relative"}}>
          <Av url={profile?.avatar_url} init={profile?.display_name||"?"} size={64}/>
          <button onClick={()=>aRef.current?.click()} style={{position:"absolute",bottom:0,right:0,width:22,height:22,borderRadius:"50%",background:G,color:"#fff",border:"none",fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✎</button>
          <input ref={aRef} type="file" accept="image/*" onChange={uploadAvatar} style={{display:"none"}}/>
        </div>
        <div><div style={{fontSize:15,fontWeight:700,color:"#0f172a"}}>{profile?.display_name}</div><div style={{fontSize:12,color:"#64748b"}}>{profile?.account_type} · {profile?.city}</div>{avatarUploading&&<div style={{fontSize:11,color:G}}>Uploading avatar…</div>}</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:13,marginBottom:16}}>
        {[["display_name","Display name","Your Name"],["org_name","Organization","Acme Corp"],["website","Website","https://yourorg.com"],["city","City","Atlanta, GA"],["country","Country","United States"]].map(([k,label,ph])=>(
          <TInp key={k} label={label} placeholder={ph} value={pf[k]||""} onChange={e=>setPf(f=>({...f,[k]:e.target.value}))}/>
        ))}
        <TSel label="Primary industry" value={pf.primary_industry} onChange={e=>setPf(f=>({...f,primary_industry:e.target.value}))} options={[{v:"",l:"Select…"},...INDUSTRIES.map(i=>({v:i,l:i}))]}/>
      </div>
      <Field label="Bio" style={{marginBottom:16}}><textarea rows={3} placeholder="Tell others about your organization…" value={pf.bio||""} onChange={e=>setPf(f=>({...f,bio:e.target.value}))} style={{...inp,resize:"none"}}/></Field>
      {saved&&<Alert icon="✅">Settings saved.</Alert>}
      <div style={{display:"flex",gap:10}}>
        <Btn v="primary" onClick={save} disabled={saving}>{saving?"Saving…":"Save settings"}</Btn>
        <Btn v="danger" onClick={signOut}>Sign out</Btn>
      </div>
    </div>;
  };

  const content={overview:<Overview/>,listings:<Listings/>,claims:<Claims/>,impact:<Impact/>,settings:<Settings/>};
  return<div>
    <div style={{background:"#fff",borderBottom:"1px solid #e0ede7",display:"flex",overflowX:"auto",paddingLeft:4}}>
      {tabs.map(([id,label])=><button key={id} onClick={()=>setTab(id)} style={{padding:"12px 15px",fontSize:12,cursor:"pointer",background:"none",border:"none",borderBottom:tab===id?`2.5px solid ${G}`:"2.5px solid transparent",color:tab===id?G:"#64748b",fontWeight:tab===id?700:400,whiteSpace:"nowrap",fontFamily:"inherit"}}>{label}</button>)}
    </div>
    {content[tab]}
  </div>;
}

// ─── STORE SCREEN (public profile) ────────────────────────────────────────────
function StoreScreen({profileData,onMsg,onGo}){
  const{user}=useAuth();
  const[tab,setTab]=useState("listings");
  const[listings,setListings]=useState([]);
  const[reviews,setReviews]=useState([]);
  const[loading,setLoading]=useState(true);

  useEffect(()=>{
    if(!profileData?.id)return;
    Promise.all([
      supabase.from("listings").select("*,profiles(display_name,org_name,avatar_url)").eq("user_id",profileData.id).eq("status","active").order("created_at",{ascending:false}).limit(24),
      supabase.from("reviews").select("*,reviewer:profiles!reviews_reviewer_id_fkey(display_name,org_name,avatar_url)").eq("reviewed_id",profileData.id).order("created_at",{ascending:false}),
    ]).then(([l,r])=>{setListings(l.data||[]);setReviews(r.data||[]);setLoading(false);});
  },[profileData?.id]);

  if(!profileData)return<Empty icon="🔍" title="Store not found"/>;

  const startMsg=async()=>{
    if(!user){onGo("auth");return;}
    await supabase.rpc("get_or_create_conversation",{other_user_id:profileData.id});
    onGo("msgs");
  };

  return<div>
    <div style={{background:G,padding:"22px 20px",display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
      <Av url={profileData.avatar_url} init={profileData.display_name||profileData.org_name||"?"} size={58} style={{border:"3px solid rgba(255,255,255,.3)"}}/>
      <div style={{flex:1}}>
        <h2 style={{fontFamily:"'DM Serif Display',serif",fontSize:22,color:"#fff",margin:"0 0 3px"}}>{profileData.org_name||profileData.display_name}</h2>
        <p style={{fontSize:12,color:G4,margin:"0 0 8px"}}>{profileData.primary_industry} · {profileData.city}{profileData.country?`, ${profileData.country}`:""}</p>
        <div style={{display:"flex",gap:14,flexWrap:"wrap"}}>
          {[`${profileData.total_listed||listings.length} items listed`,profileData.rating>0?`${Number(profileData.rating).toFixed(1)} rating`:null,`${profileData.follower_count||0} followers`,profileData.verified?"Verified":null].filter(Boolean).map(l=><span key={l} style={{fontSize:11,color:G4}}>{l}</span>)}
        </div>
      </div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        <Btn v="white">Follow</Btn>
        <Btn onClick={startMsg} style={{color:"#fff",background:"rgba(255,255,255,.14)",border:"1.5px solid rgba(255,255,255,.35)"}}>Message</Btn>
        <Btn onClick={()=>onGo("delivery")} style={{color:"#fff",background:"rgba(255,255,255,.14)",border:"1.5px solid rgba(255,255,255,.35)"}}>Delivery</Btn>
      </div>
    </div>
    <div style={{background:"#fff",borderBottom:"1px solid #e0ede7",display:"flex",paddingLeft:4}}>
      {[["listings","Listings"],["about","About"],["reviews","Reviews"]].map(([id,label])=><button key={id} onClick={()=>setTab(id)} style={{padding:"11px 16px",fontSize:12,cursor:"pointer",background:"none",border:"none",borderBottom:tab===id?`2.5px solid ${G}`:"2.5px solid transparent",color:tab===id?G:"#64748b",fontWeight:tab===id?700:400,fontFamily:"inherit"}}>{label}</button>)}
    </div>
    {tab==="listings"&&<div style={{padding:16}}>{loading?<Spinner/>:listings.length>0?<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))",gap:10}}>{listings.map(p=><ListingCard key={p.id} listing={p} onView={l=>onGo("listing",l)} onClaim={()=>{}} onMsg={startMsg}/>)}</div>:<Empty title="No active listings"/>}</div>}
    {tab==="about"&&<div style={{padding:20}}>{profileData.bio?<p style={{fontSize:14,color:"#374151",lineHeight:1.8}}>{profileData.bio}</p>:<Empty title="No bio yet"/>}</div>}
    {tab==="reviews"&&<div style={{padding:16}}>
      {reviews.length===0&&<Empty title="No reviews yet" sub="Reviews appear after successful transactions."/>}
      {reviews.map((r,i)=>(
        <div key={i} style={{...card,padding:14,marginBottom:10}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}><Av url={r.reviewer?.avatar_url} init={r.reviewer?.display_name||"?"} size={34}/><div style={{flex:1}}><div style={{fontSize:13,fontWeight:700}}>{r.reviewer?.org_name||r.reviewer?.display_name}</div><div style={{fontSize:11,color:"#64748b"}}>{new Date(r.created_at).toLocaleDateString()}</div></div><div style={{fontSize:14,color:"#f59e0b"}}>{"★".repeat(r.rating)}</div></div>
          {r.body&&<p style={{fontSize:13,color:"#374151",lineHeight:1.7,margin:0}}>{r.body}</p>}
        </div>
      ))}
    </div>}
  </div>;
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
function AppContent(){
  const{user,profile,loading}=useAuth();
  const[screen,setScreen]=useState("home");
  const[screenData,setScreenData]=useState(null);
  const[loc,setLoc]=useState("atlanta");
  const[role,setRole]=useState("vendor");
  const[unread,setUnread]=useState(0);

  const go=useCallback((s,data=null)=>{setScreen(s);setScreenData(data);},[]);

  useEffect(()=>{if(profile?.location_key)setLoc(profile.location_key);},[profile]);

  useEffect(()=>{
    if(!user){setUnread(0);return;}
    const sub=supabase.channel("unread-msgs").on("postgres_changes",{event:"INSERT",schema:"public",table:"messages"},()=>setUnread(n=>n+1)).subscribe();
    return()=>supabase.removeChannel(sub);
  },[user]);

  const handleClaim=useCallback(async listing=>{
    if(!user){go("auth");return;}
    if(user.id===listing.user_id)return; // owners cannot claim their own listing
    await supabase.from("claims").insert({listing_id:listing.id,claimant_id:user.id,vendor_id:listing.user_id,status:"pending"});
    await supabase.rpc("get_or_create_conversation",{other_user_id:listing.user_id,p_listing_id:listing.id});
    go("msgs");
  },[user,go]);

  const handleMsg=useCallback(async listing=>{
    if(!user){go("auth");return;}
    await supabase.rpc("get_or_create_conversation",{other_user_id:listing.user_id,p_listing_id:listing.id});
    go("msgs");
  },[user,go]);

  const locData=LOCS[loc]||LOCS.atlanta;
  const navItems=[{id:"home",label:"Home"},{id:"market",label:"Browse"},{id:"community",label:"Community"},{id:"local",label:"Nearby"},{id:"msgs",label:"Messages",badge:unread},{id:"delivery",label:"Delivery"},{id:"dash",label:"Dashboard"}];

  // ── After OAuth redirect, navigate to dashboard once user is set ──
  const[oauthLanding]=useState(()=>typeof window!=="undefined"&&(window.location.hash.includes("access_token")||window.location.search.includes("code=")));
  useEffect(()=>{if(oauthLanding&&user){window.history.replaceState({},"",window.location.pathname);go("dash");}},[oauthLanding,user,go]);

  if(loading)return<div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",fontFamily:"'Inter',system-ui,sans-serif",flexDirection:"column",gap:14}}><div style={{width:36,height:36,borderRadius:"50%",border:`3px solid #e5e7eb`,borderTopColor:G,animation:"spin .8s linear infinite"}}/><span style={{fontSize:13,color:MUTED,letterSpacing:".02em"}}>Loading UpGive…</span></div>;

  return(
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Inter:wght@300;400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;background:#fff;color:#111827}
        input,textarea,select,button{font-family:inherit}
        img{display:block}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-thumb{background:#d1d5db;border-radius:99px}
        ::-webkit-scrollbar-track{background:transparent}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
        .pg{animation:fadeUp .2s ease}
        .nav-link{transition:color .15s,background .15s}
        .nav-link:hover{color:#111827!important;background:#f9fafb!important}
        .nav-link.active{color:#15803d!important;background:#f0fdf4!important;font-weight:600!important}
      `}</style>
      <div style={{fontFamily:"'Inter',system-ui,sans-serif",background:"#f9fafb",minHeight:"100vh"}}>

        {/* ── TOP NAV ── */}
        <nav style={{background:"#fff",borderBottom:`1px solid ${BORDER}`,padding:"0 28px",display:"flex",alignItems:"center",gap:8,height:64,position:"sticky",top:0,zIndex:100,boxShadow:"0 1px 0 rgba(0,0,0,.06)"}}>
          {/* Logo */}
          <div style={{cursor:"pointer",flexShrink:0,marginRight:16,display:"flex",alignItems:"center",gap:8}} onClick={()=>go("home")}>
            <div style={{width:32,height:32,borderRadius:8,background:G,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2C8 2 3 5 3 9a5 5 0 0010 0C13 5 8 2 8 2z" fill="rgba(255,255,255,.9)"/><path d="M8 7v5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </div>
            <div>
              <div style={{fontFamily:"'DM Serif Display',serif",fontSize:18,color:TEXT,letterSpacing:"-0.3px",lineHeight:1.1}}>UpGive</div>
              <div style={{fontSize:9,color:MUTED,letterSpacing:"0.1em",textTransform:"uppercase",fontWeight:500}}>Surplus for Good</div>
            </div>
          </div>

          {/* Search */}
          <div style={{flex:1,maxWidth:400,position:"relative"}}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",flexShrink:0}}><circle cx="5.5" cy="5.5" r="3.75" stroke="#9ca3af" strokeWidth="1.5"/><line x1="8.5" y1="8.5" x2="12" y2="12" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round"/></svg>
            <input placeholder="Search goods, organizations…" onKeyDown={e=>{if(e.key==="Enter")go("market");}} style={{width:"100%",height:36,border:`1px solid ${BORDER}`,borderRadius:8,padding:"0 14px 0 34px",fontSize:13,background:"#f9fafb",outline:"none",color:TEXT,transition:"border-color .15s,box-shadow .15s"}} onFocus={e=>{e.target.style.borderColor=G;e.target.style.boxShadow="0 0 0 3px rgba(22,163,74,.1)";e.target.style.background="#fff";}} onBlur={e=>{e.target.style.borderColor=BORDER;e.target.style.boxShadow="none";e.target.style.background="#f9fafb";}}/>
          </div>

          {/* Mode toggle */}
          <div style={{display:"flex",background:"#f3f4f6",borderRadius:7,padding:2,flexShrink:0,border:`1px solid ${BORDER}`}}>
            {[["vendor","Donor"],["client","Recipient"]].map(([r,label])=>(
              <button key={r} onClick={()=>setRole(r)} style={{padding:"4px 13px",borderRadius:5,border:"none",background:role===r?"#fff":"transparent",color:role===r?G:MUTED,fontSize:11,fontWeight:role===r?600:400,cursor:"pointer",transition:"all .15s",boxShadow:role===r?"0 1px 3px rgba(0,0,0,.1)":""}}>{label}</button>
            ))}
          </div>

          {/* Nav links */}
          <div style={{display:"flex",alignItems:"center",gap:1}}>
            {navItems.map(item=>(
              <button key={item.id} onClick={()=>{go(item.id);if(item.id==="msgs")setUnread(0);}} className={`nav-link${screen===item.id?" active":""}`} style={{padding:"7px 11px",borderRadius:7,border:"none",background:screen===item.id?"#f0fdf4":"transparent",color:screen===item.id?G2:MUTED,fontSize:12,fontWeight:screen===item.id?600:400,cursor:"pointer",display:"flex",alignItems:"center",gap:4,whiteSpace:"nowrap",position:"relative"}}>
                {item.label}
                {item.badge>0&&<span style={{background:"#dc2626",color:"#fff",borderRadius:99,fontSize:9,padding:"1px 5px",fontWeight:700,minWidth:16,textAlign:"center",lineHeight:"14px"}}>{item.badge}</span>}
              </button>
            ))}
          </div>

          {/* Auth */}
          <div style={{display:"flex",alignItems:"center",gap:8,marginLeft:4,flexShrink:0}}>
            {user
              ?<div onClick={()=>go("dash")} style={{cursor:"pointer",display:"flex",alignItems:"center",gap:8,padding:"4px 8px",borderRadius:8,border:`1px solid ${BORDER}`,transition:"border-color .15s"}} onMouseEnter={e=>e.currentTarget.style.borderColor=G} onMouseLeave={e=>e.currentTarget.style.borderColor=BORDER}>
                  <Av url={profile?.avatar_url} init={profile?.display_name||"?"} size={26}/>
                  <span style={{fontSize:12,fontWeight:500,color:TEXT,maxWidth:100,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{profile?.display_name||"Account"}</span>
                </div>
              :<button onClick={()=>go("auth")} style={{padding:"7px 16px",borderRadius:7,border:`1px solid ${BORDER}`,background:"#fff",fontSize:12,fontWeight:500,cursor:"pointer",color:TEXT,transition:"border-color .15s"}} onMouseEnter={e=>e.currentTarget.style.borderColor="#9ca3af"} onMouseLeave={e=>e.currentTarget.style.borderColor=BORDER}>Sign in</button>}
            <button onClick={()=>go("list")} style={{padding:"8px 18px",borderRadius:7,border:"none",background:G,color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer",transition:"background .15s",letterSpacing:".01em",boxShadow:"0 1px 2px rgba(22,163,74,.2)"}} onMouseEnter={e=>e.currentTarget.style.background=G2} onMouseLeave={e=>e.currentTarget.style.background=G}>List Item</button>
          </div>
        </nav>

        {/* ── LOCATION BAR ── */}
        <div style={{background:"#111827",padding:"7px 28px",display:"flex",alignItems:"center",gap:10,fontSize:12}}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{flexShrink:0}}><circle cx="6" cy="5" r="2.5" stroke="#9ca3af" strokeWidth="1.2"/><path d="M6 1C3.79 1 2 2.79 2 5c0 3 4 7 4 7s4-4 4-7c0-2.21-1.79-4-4-4z" stroke="#9ca3af" strokeWidth="1.2" fill="none"/></svg>
          <span style={{color:"#9ca3af"}}>Location:</span>
          <strong style={{color:"#fff",fontWeight:500}}>{locData.label}</strong>
          <select value={loc} onChange={e=>setLoc(e.target.value)} style={{background:"none",border:"none",color:"#6b7280",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>
            {Object.entries(LOCS).map(([k,v])=><option key={k} value={k} style={{background:"#1f2937",color:"#fff"}}>{v.label}</option>)}
          </select>
          <span style={{marginLeft:"auto",fontSize:11,color:"#6b7280"}}>{role==="vendor"?"Donor view":"Recipient view"} · {locData.tz}</span>
        </div>

        {/* SCREENS */}
        <div className="pg" key={screen}>
          {screen==="home"     &&(user?<HomeScreen loc={loc} onGo={go} onClaim={handleClaim} onMsg={handleMsg}/>:<LandingScreen onGo={go}/>)}
          {screen==="market"   &&<MarketScreen onClaim={handleClaim} onView={l=>go("listing",l)} onMsg={handleMsg}/>}
          {screen==="local"     &&<LocalScreen loc={loc} onGoStore={org=>go("store",org)}/>}
          {screen==="community" &&<CommunityScreen onGo={go}/>}
          {screen==="msgs"      &&<MessagesScreen onGoDelivery={()=>go("delivery")}/>}
          {screen==="delivery"  &&<DeliveryScreen loc={loc}/>}
          {screen==="dash"      &&<DashboardScreen role={role} onGo={go}/>}
          {screen==="store"     &&<StoreScreen profileData={screenData} onMsg={()=>go("msgs")} onGo={go}/>}
          {screen==="list"      &&<ListScreen onGo={go} defaultType={screenData?.listingType}/>}
          {screen==="auth"     &&<AuthScreen onSuccess={()=>go("dash")}/>}
          {screen==="listing"  &&screenData&&(
            <div style={{maxWidth:700,margin:"0 auto",padding:24}}>
              <Btn v="ghost" onClick={()=>go("market")} style={{color:G,marginBottom:16}}>← Back to browse</Btn>
              <div style={{...card,padding:28}}>
                <div style={{height:240,background:"#f0fbf5",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:80,marginBottom:20,overflow:"hidden"}}>
                  {screenData.images?.[0]?<img src={screenData.images[0]} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<div style={{width:64,height:64,borderRadius:10,background:"#c5edd9"}}/>}
                </div>
                <h1 style={{fontFamily:"'DM Serif Display',serif",fontSize:26,color:"#0f172a",margin:"0 0 6px",letterSpacing:"-.3px"}}>{screenData.title}</h1>
                <div style={{fontSize:13,color:"#64748b",marginBottom:14}}>{screenData.profiles?.org_name||screenData.profiles?.display_name} · {screenData.category} · {screenData.city}</div>
                <div style={{fontSize:28,fontWeight:700,color:screenData.price?G2:AMBER,marginBottom:20}}>{screenData.price?`$${Number(screenData.price).toLocaleString()}`:"Free"}</div>
                {screenData.description&&<p style={{fontSize:14,color:"#374151",lineHeight:1.85,marginBottom:22}}>{screenData.description}</p>}
                <div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:24}}>
                  {screenData.pickup_available&&<Tag label="Pickup available" bg="#d1fae5" color="#064e3b"/>}
                  {screenData.domestic_shipping&&<Tag label="Domestic shipping" bg="#dbeafe" color="#1e40af"/>}
                  {screenData.international&&<Tag label="Ships internationally" bg="#ede9fe" color="#5b21b6"/>}
                  {screenData.cold_chain&&<Tag label="Cold chain" bg="#e0f2fe" color="#075985"/>}
                  {screenData.bulk_freight&&<Tag label="Bulk / freight" bg="#fef3c7" color="#92400e"/>}
                </div>
                {user?.id===screenData.user_id
                  ?<div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                      <Alert icon="ℹ️" type="blue" style={{margin:0,flex:1}}>This is your listing. Manage it from your Dashboard.</Alert>
                      <RemoveListingBtn listingId={screenData.id} onSuccess={()=>go("dash")}/>
                    </div>
                  :<div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                      {screenData.listing_type!=="buy"&&<Btn v="primary" sz="lg" onClick={()=>handleClaim(screenData)}>Claim This Item</Btn>}
                      <Btn v="outline" sz="lg" onClick={()=>handleMsg(screenData)}>Message Donor</Btn>
                      <Btn v="outline" sz="lg" onClick={()=>go("delivery")}>Delivery Options</Btn>
                    </div>}

              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function UpGive(){
  return<AuthProvider><AppContent/></AuthProvider>;
}
