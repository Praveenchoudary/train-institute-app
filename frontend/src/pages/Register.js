import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, User, Mail, Lock, Phone, Eye, EyeOff, ArrowRight, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const PERKS = [
  'Access 10+ expert-led courses',
  'Dashboard to track your progress',
  'Earn industry-recognised certificates',
  'Join Hyderabad\'s top EdTech community',
];

export default function Register() {
  const { register } = useAuth();
  const [form,  setForm]    = useState({firstName:'',lastName:'',email:'',password:'',phone:''});
  const [showPw,setShowPw]  = useState(false);
  const [loading,setLoading]= useState(false);
  const set = k => e => setForm(f=>({...f,[k]:e.target.value}));

  const handleSubmit = async e => {
    e.preventDefault();
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters.'); return; }
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created! Welcome aboard 🎉');
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Registration failed.');
    } finally { setLoading(false); }
  };

  return (
    <div style={p.page}>

      {/* LEFT */}
      <div style={p.left}>
        <div style={p.logo}>
          <div style={p.logoBox}><GraduationCap size={20} color="#020209"/></div>
          <div>
            <div style={p.logoName}>Hyderabad Education Tech</div>
            <div style={p.logoClaim}>Your career starts here.</div>
          </div>
        </div>

        <div style={p.heroBanner}>
          <div style={p.bannerDecor}/>
          <div style={p.bannerInner}>
            <div style={p.bannerPre}>JOIN THE COMMUNITY</div>
            <h2 style={p.bannerTitle}>Start your learning<br/>journey <em style={p.bannerEm}>today.</em></h2>
          </div>
        </div>

        <div style={p.perkList}>
          {PERKS.map(perk => (
            <div key={perk} style={p.perkItem}>
              <div style={p.perkCheck}><Check size={12} strokeWidth={3}/></div>
              <span style={p.perkText}>{perk}</span>
            </div>
          ))}
        </div>

        <div style={p.signInNote}>
          Already have an account?{' '}
          <Link to="/login" style={p.signInLink}>Sign in →</Link>
        </div>
      </div>

      {/* RIGHT */}
      <div style={p.right}>
        <div style={p.card}>
          <div style={p.cardAccent}/>
          <h2 style={p.cardTitle}>Create account</h2>
          <p style={p.cardSub}>Free forever · No credit card required</p>

          <form onSubmit={handleSubmit} style={p.form}>
            <div className="field-row">
              <div className="field">
                <label>First name</label>
                <div className="input-wrap">
                  <User size={14}/>
                  <input placeholder="Ravi" value={form.firstName} onChange={set('firstName')} required autoFocus/>
                </div>
              </div>
              <div className="field">
                <label>Last name</label>
                <div className="input-wrap">
                  <User size={14}/>
                  <input placeholder="Kumar" value={form.lastName} onChange={set('lastName')} required/>
                </div>
              </div>
            </div>
            <div className="field">
              <label>Email address</label>
              <div className="input-wrap">
                <Mail size={14}/>
                <input type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required/>
              </div>
            </div>
            <div className="field">
              <label>Phone (optional)</label>
              <div className="input-wrap">
                <Phone size={14}/>
                <input type="tel" placeholder="+91 98765 43210" value={form.phone} onChange={set('phone')}/>
              </div>
            </div>
            <div className="field">
              <label>Password</label>
              <div className="input-wrap">
                <Lock size={14}/>
                <input type={showPw?'text':'password'} placeholder="Min. 8 characters"
                  value={form.password} onChange={set('password')} required/>
                <button type="button" className="eye-btn" onClick={()=>setShowPw(v=>!v)}>
                  {showPw?<EyeOff size={14}/>:<Eye size={14}/>}
                </button>
              </div>
            </div>
            <button type="submit" className="btn-primary full" disabled={loading} style={{marginTop:4}}>
              {loading?'Creating account…':<><span>Create free account</span><ArrowRight size={15}/></>}
            </button>
          </form>

          <p style={p.terms}>
            By signing up you agree to our{' '}
            <span style={{color:'var(--saffron)',cursor:'pointer'}}>Terms of Service</span>{' '}and{' '}
            <span style={{color:'var(--saffron)',cursor:'pointer'}}>Privacy Policy</span>
          </p>
        </div>
      </div>
    </div>
  );
}

const p = {
  page:{ minHeight:'100vh', display:'flex', background:'var(--base)', overflow:'hidden' },
  left:{
    width:'45%', padding:'36px 42px',
    display:'flex', flexDirection:'column', gap:26,
    borderRight:'1px solid var(--b1)', overflowY:'auto',
    background:'linear-gradient(160deg,rgba(255,107,53,.05) 0%,rgba(255,184,48,.03) 100%)',
  },
  logo:{ display:'flex', alignItems:'center', gap:12 },
  logoBox:{
    width:40, height:40, borderRadius:11, flexShrink:0,
    background:'var(--g-brand)',
    display:'flex', alignItems:'center', justifyContent:'center',
    boxShadow:'0 4px 20px var(--saffron-glow)',
  },
  logoName:{
    fontFamily:"'Bricolage Grotesque',sans-serif",
    fontSize:14, fontWeight:800, letterSpacing:'-.02em',
    background:'var(--g-text)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
  },
  logoClaim:{ fontSize:11, color:'var(--t3)', marginTop:1 },

  heroBanner:{
    borderRadius:20, height:218, overflow:'hidden',
    border:'1px solid var(--b1)', position:'relative',
    background:'var(--card)',
  },
  bannerDecor:{
    position:'absolute', inset:0,
    background:'linear-gradient(135deg, var(--ink) 0%, rgba(255,107,53,.1) 60%, rgba(255,184,48,.08) 100%)',
  },
  /* decorative corner blobs */
  bannerInner:{
    position:'absolute', inset:0, padding:'26px 28px',
    display:'flex', flexDirection:'column', justifyContent:'flex-end',
  },
  bannerPre:{
    fontFamily:"'DM Mono',monospace",
    fontSize:9, fontWeight:500, color:'var(--saffron)',
    letterSpacing:'.16em', marginBottom:12,
  },
  bannerTitle:{
    fontFamily:"'Bricolage Grotesque',sans-serif",
    fontSize:32, fontWeight:800, color:'#fff',
    lineHeight:1.15, letterSpacing:'-.04em',
  },
  bannerEm:{ fontStyle:'italic', color:'var(--turmeric)' },

  perkList:{ display:'flex', flexDirection:'column', gap:12 },
  perkItem:{ display:'flex', alignItems:'center', gap:11 },
  perkCheck:{
    width:22, height:22, borderRadius:7, flexShrink:0,
    background:'var(--saffron-dim)', color:'var(--saffron)',
    display:'flex', alignItems:'center', justifyContent:'center',
    border:'1px solid rgba(255,107,53,.25)',
  },
  perkText:{ fontSize:13.5, color:'var(--t2)', fontWeight:500 },

  signInNote:{ fontSize:13, color:'var(--t2)' },
  signInLink:{ color:'var(--saffron)', fontWeight:700 },

  right:{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'40px 44px', overflowY:'auto' },
  card:{
    background:'var(--card)', border:'1px solid var(--b3)',
    borderRadius:22, padding:'30px 28px', width:'100%', maxWidth:420,
    boxShadow:'0 32px 80px rgba(0,0,0,.65)', position:'relative',
  },
  cardAccent:{ position:'absolute', top:0, left:0, right:0, height:2, background:'var(--g-hero)', borderRadius:'22px 22px 0 0' },
  cardTitle:{
    fontFamily:"'Bricolage Grotesque',sans-serif",
    fontSize:25, fontWeight:800, color:'var(--t1)', letterSpacing:'-.04em', marginBottom:5,
  },
  cardSub:{ fontSize:13, color:'var(--t2)', marginBottom:24 },
  form:{ display:'flex', flexDirection:'column', gap:14 },
  terms:{ marginTop:16, fontSize:11.5, color:'var(--t3)', textAlign:'center', lineHeight:1.6 },
};
