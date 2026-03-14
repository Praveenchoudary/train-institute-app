import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Eye, EyeOff, GraduationCap, ArrowRight,
         BookOpen, Award, TrendingUp, Users } from 'lucide-react';
import toast from 'react-hot-toast';

const SLIDES = [
  { url:'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=900&q=80', tag:'Live Batches', headline:'Learn from Hyderabad\'s best tech instructors' },
  { url:'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=900&q=80', tag:'Hands-on Projects', headline:'Build real-world projects from day one' },
  { url:'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=900&q=80', tag:'Career Ready', headline:'Get job-ready in months, not years' },
];
const STATS = [
  { icon:Users,      val:'1,200+', lbl:'Students' },
  { icon:BookOpen,   val:'10+',    lbl:'Courses' },
  { icon:Award,      val:'94%',    lbl:'Placements' },
  { icon:TrendingUp, val:'4.9★',   lbl:'Rating' },
];

export default function Login() {
  const { login } = useAuth();
  const [form,    setForm]    = useState({ email:'', password:'' });
  const [showPw,  setShowPw]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [slide,   setSlide]   = useState(0);
  const set = k => e => setForm(f => ({...f,[k]:e.target.value}));

  useEffect(() => {
    const t = setInterval(() => setSlide(s => (s+1) % SLIDES.length), 4000);
    return () => clearInterval(t);
  }, []);

  const handleSubmit = async e => {
    e.preventDefault(); setLoading(true);
    try { await login(form.email, form.password); toast.success('Welcome back!'); }
    catch (err) { toast.error(err.response?.data?.error || 'Invalid credentials.'); }
    finally { setLoading(false); }
  };

  const S = SLIDES[slide];

  return (
    <div style={p.page}>
      {/* LEFT */}
      <div style={p.left}>
        <div style={p.logo}>
          <div style={p.logoBox}><GraduationCap size={20} color="#020209"/></div>
          <div>
            <div style={p.logoName}>Hyderabad Education Tech</div>
            <div style={p.logoClaim}>Knowledge. Skills. Careers.</div>
          </div>
        </div>

        <div style={p.heroCard}>
          <img key={slide} src={S.url} alt="" style={p.heroImg}/>
          <div style={p.heroOverlay}/>
          <div style={p.heroContent}>
            <div style={p.heroTag}>{S.tag}</div>
            <h2 style={p.heroHeadline}>{S.headline}</h2>
          </div>
          <div style={p.dots}>
            {SLIDES.map((_,i) => (
              <button key={i} style={{...p.dot,...(i===slide?p.dotOn:{})}} onClick={()=>setSlide(i)}/>
            ))}
          </div>
        </div>

        <div style={p.statsRow}>
          {STATS.map(({icon:Icon,val,lbl}) => (
            <div key={lbl} style={p.statItem}>
              <Icon size={16} color="var(--saffron)" style={{marginBottom:4}}/>
              <div style={p.statVal}>{val}</div>
              <div style={p.statLbl}>{lbl}</div>
            </div>
          ))}
        </div>

        <div style={p.trustBar}>
          <div style={p.trustDot}/>
          <span style={p.trustText}>Trusted by students across Telangana &amp; Andhra Pradesh</span>
        </div>
      </div>

      {/* RIGHT */}
      <div style={p.right}>
        <div style={p.card}>
          <div style={p.cardAccent}/>
          <div style={p.cardHead}>
            <h2 style={p.cardTitle}>Sign in</h2>
            <p style={p.cardSub}>Continue your learning journey</p>
          </div>
          <form onSubmit={handleSubmit} style={p.form}>
            <div className="field">
              <label>Email address</label>
              <div className="input-wrap">
                <Mail size={15}/>
                <input type="email" placeholder="you@example.com"
                  value={form.email} onChange={set('email')} required autoFocus/>
              </div>
            </div>
            <div className="field">
              <label>Password</label>
              <div className="input-wrap">
                <Lock size={15}/>
                <input type={showPw?'text':'password'} placeholder="••••••••"
                  value={form.password} onChange={set('password')} required/>
                <button type="button" className="eye-btn" onClick={()=>setShowPw(v=>!v)}>
                  {showPw?<EyeOff size={15}/>:<Eye size={15}/>}
                </button>
              </div>
            </div>
            <button type="submit" className="btn-primary full" disabled={loading}>
              {loading?'Signing in…':<><span>Sign in</span><ArrowRight size={15}/></>}
            </button>
          </form>

          <div style={p.divider}><span style={p.divLine}/><span style={p.divWord}>new here?</span><span style={p.divLine}/></div>

          <Link to="/register" style={p.regBtn}>
            Create a free account <ArrowRight size={13}/>
          </Link>
        </div>
      </div>
    </div>
  );
}

const p = {
  page:{ minHeight:'100vh', display:'flex', background:'var(--base)', overflow:'hidden', position:'relative' },
  left:{
    width:'54%', padding:'36px 42px', display:'flex', flexDirection:'column', gap:22,
    borderRight:'1px solid var(--b1)',
    background:'linear-gradient(160deg,rgba(255,107,53,.05) 0%,rgba(139,92,246,.03) 100%)',
    overflowY:'auto',
  },
  logo:{ display:'flex', alignItems:'center', gap:12 },
  logoBox:{
    width:42, height:42, borderRadius:12, flexShrink:0,
    background:'var(--g-brand)',
    display:'flex', alignItems:'center', justifyContent:'center',
    boxShadow:'0 4px 22px var(--saffron-glow)',
  },
  logoName:{
    fontFamily:"'Bricolage Grotesque',sans-serif",
    fontSize:15, fontWeight:800, letterSpacing:'-.02em',
    background:'var(--g-text)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
  },
  logoClaim:{ fontSize:11, color:'var(--t3)', marginTop:1 },
  heroCard:{
    borderRadius:20, overflow:'hidden', height:248, position:'relative',
    border:'1px solid var(--b2)', boxShadow:'0 24px 64px rgba(0,0,0,.6)', flexShrink:0,
  },
  heroImg:{ width:'100%', height:'100%', objectFit:'cover', opacity:.72, display:'block', transition:'opacity .5s' },
  heroOverlay:{ position:'absolute', inset:0, background:'linear-gradient(to bottom,rgba(2,2,9,.05) 0%,rgba(2,2,9,.88) 100%)' },
  heroContent:{ position:'absolute', bottom:20, left:22, right:22 },
  heroTag:{
    display:'inline-block',
    background:'rgba(255,107,53,.18)', border:'1px solid rgba(255,107,53,.4)',
    color:'var(--saffron-light)', padding:'3px 10px', borderRadius:20,
    fontSize:10.5, fontWeight:600, marginBottom:9,
    fontFamily:"'DM Mono',monospace", letterSpacing:'.04em',
  },
  heroHeadline:{
    fontFamily:"'Bricolage Grotesque',sans-serif",
    fontSize:20, fontWeight:800, color:'#fff', lineHeight:1.25, letterSpacing:'-.03em',
  },
  dots:{ position:'absolute', top:14, right:14, display:'flex', gap:5 },
  dot:{ width:6, height:6, borderRadius:'50%', background:'rgba(255,255,255,.28)', border:'none', cursor:'pointer', padding:0, transition:'all .25s' },
  dotOn:{ width:18, borderRadius:4, background:'var(--saffron)' },
  statsRow:{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:10 },
  statItem:{
    background:'var(--card)', border:'1px solid var(--b1)',
    borderRadius:12, padding:'14px 10px', textAlign:'center',
    display:'flex', flexDirection:'column', alignItems:'center',
  },
  statVal:{ fontFamily:"'DM Mono',monospace", fontSize:18, fontWeight:500, color:'var(--turmeric)', lineHeight:1, marginBottom:3 },
  statLbl:{ fontSize:10.5, color:'var(--t2)' },
  trustBar:{ display:'flex', alignItems:'center', gap:9, padding:'11px 16px', background:'rgba(255,184,48,.05)', border:'1px solid rgba(255,184,48,.12)', borderRadius:12 },
  trustDot:{ width:7, height:7, borderRadius:'50%', background:'var(--turmeric)', flexShrink:0, boxShadow:'0 0 8px var(--turmeric-glow)' },
  trustText:{ fontSize:12.5, color:'var(--turmeric)', fontWeight:500 },
  right:{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'40px 44px', overflowY:'auto' },
  card:{
    background:'var(--card)', border:'1px solid var(--b3)',
    borderRadius:22, padding:'32px 30px', width:'100%', maxWidth:400,
    boxShadow:'0 32px 80px rgba(0,0,0,.65)', position:'relative',
  },
  cardAccent:{ position:'absolute', top:0, left:0, right:0, height:2, background:'var(--g-hero)', borderRadius:'22px 22px 0 0' },
  cardHead:{ marginBottom:28 },
  cardTitle:{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:28, fontWeight:800, color:'var(--t1)', letterSpacing:'-.04em', marginBottom:5 },
  cardSub:{ fontSize:14, color:'var(--t2)' },
  form:{ display:'flex', flexDirection:'column', gap:16 },
  divider:{ display:'flex', alignItems:'center', gap:10, margin:'20px 0 14px' },
  divLine:{ flex:1, height:1, background:'var(--b1)' },
  divWord:{ fontSize:11, color:'var(--t3)', fontFamily:"'DM Mono',monospace" },
  regBtn:{
    display:'flex', alignItems:'center', justifyContent:'center', gap:7,
    width:'100%', padding:'11px',
    border:'1px solid rgba(255,107,53,.22)', borderRadius:'var(--rs)',
    background:'rgba(255,107,53,.05)',
    color:'var(--saffron-light)', fontSize:13.5, fontWeight:600,
    fontFamily:"'Bricolage Grotesque',sans-serif",
  },
};
