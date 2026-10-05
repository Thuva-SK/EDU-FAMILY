import React from 'react';
import { Link } from 'react-router-dom';
import {
  Target,
  Eye,
  Award,
  Users,
  BookOpen,
  CheckCircle2,
  Sparkles,
  GraduationCap,
  ArrowRight,
  ShieldCheck,
  HeartHandshake
} from 'lucide-react';

export default function AboutPage() {
  const stats = [
    { label: 'பயனடைந்த மாணவர்கள்', val: '1000+', icon: Users },
    { label: 'கல்வி வளங்கள்', val: '100+', icon: BookOpen },
    { label: 'கருத்தரங்குகள்', val: '10+', icon: Award },
    { label: 'இலவச சேவை', val: '100%', icon: HeartHandshake }
  ];

  const pillars = [
    {
      title: 'நம்பகமான தகவல்கள்',
      desc: 'அரசாங்க மற்றும் கல்வித் திணைக்களங்களின் உத்தியோகபூர்வ அறிவிப்புகள் துல்லியமாக வழங்கப்படுகின்றன.',
      icon: ShieldCheck
    },
    {
      title: 'எளிமையான தமிழ் மொழி',
      desc: 'அனைத்து மாணவர்களும் எளிதாகப் புரிந்து கொள்ளக்கூடிய தெளிவான தமிழ் வடிவில் தகவல்கள் உருவாக்கப்படுகின்றன.',
      icon: GraduationCap
    },
    {
      title: 'நேரடி வாட்ஸ்அப் உதவி',
      desc: 'மாணவர்களுக்கு சந்தேகங்களைத் தீர்க்க உடனடி வாட்ஸ்அப் வழிகாட்டல் மற்றும் ஆதரவு மையம்.',
      icon: CheckCircle2
    }
  ];

  return (
    <div className="about-page">
      {/* Header Banner */}
      <section style={{ background: 'radial-gradient(circle at 50% 0%, rgba(215, 25, 32, 0.12) 0%, transparent 60%)', padding: '80px 0 60px 0' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <div className="badge-tag">
            <Sparkles size={16} />
            <span>ABOUT EDUFAMILY IN TAMIL</span>
          </div>
          <h1 className="section-title page-hero-title">
            கல்விக்கான <span style={{ color: '#d71920' }}>ஒரு குடும்பம்</span>
          </h1>
          <p className="section-desc" style={{ fontSize: '1.15rem' }}>
            இலங்கை மாணவர்கள் மற்றும் கல்வி சமூகத்திற்குத் தேவையான தகவல்களை எளிமையாகவும் விரைவாகவும் வழங்கும் முன்னோடித் தளம்.
          </p>
        </div>
      </section>

      {/* Platform Statistics */}
      <section style={{ background: 'var(--card-bg)', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', padding: '48px 0' }}>
        <div className="container">
          <div className="grid-4">
            {stats.map((st, idx) => {
              const Icon = st.icon;
              return (
                <div key={idx} className="card" style={{ textAlign: 'center', padding: '24px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto' }}>
                    <Icon size={24} />
                  </div>
                  <h3 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '4px' }}>{st.val}</h3>
                  <p style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.9rem' }}>{st.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section>
        <div className="container">
          <div className="grid-2">
            <div className="card" style={{ padding: '36px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(215, 25, 32, 0.1)', color: '#d71920', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Target size={24} />
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>எங்கள் நோக்கம் (Our Mission)</h2>
              </div>
              <p style={{ fontSize: '1.05rem', color: 'var(--text-muted)', lineHeight: '1.7' }}>
                இலங்கையின் மூலை முடுக்கெல்லாம் வாழும் தமிழ் மொழி பேசும் மாணவர்களுக்குத் தேவையான கல்வி வளங்கள், பரீட்சை வழிகாட்டல்கள், மாதிரி வினாத்தாள்கள் மற்றும் உயர்கல்வி வாய்ப்புகளை முற்றிலும் இலவசமாக உடனுக்குடன் கொண்டு சேர்ப்பதே எமது முதன்மை நோக்கமாகும்.
              </p>
            </div>

            <div className="card" style={{ padding: '36px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(215, 25, 32, 0.1)', color: '#d71920', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Eye size={24} />
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>எங்கள் பார்வை (Our Vision)</h2>
              </div>
              <p style={{ fontSize: '1.05rem', color: 'var(--text-muted)', lineHeight: '1.7' }}>
                தமிழ் மொழியில் மிகவும் நம்பகமான, நவீன தொழில்நுட்ப வசதிகளுடன் கூடிய, மாணவர் நட்பு முதன்மை கல்வி சமூகமாக வளர்ச்சி அடைவதும், ஒவ்வொரு மாணவனின் எதிர்காலக் கனவுகளுக்கும் வழிகாட்டியாக நிலைத்திருப்பவதும் எமது தொலைநோக்குப் பார்வையாகும்.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pillars of Excellence */}
      <section style={{ background: 'var(--card-bg)', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
        <div className="container">
          <div className="section-head">
            <div className="section-mini">Why Choose Edufamily</div>
            <h2 className="section-title">Edufamily-யின் சிறப்பு தூண்கள்</h2>
            <p className="section-desc">மாணவர்களின் நம்பிக்கையைப் பெற்ற எமது செயற்பாட்டு வழிகள்.</p>
          </div>

          <div className="grid-3">
            {pillars.map((pil, idx) => {
              const Icon = pil.icon;
              return (
                <div key={idx} className="card feature-card">
                  <div className="feature-icon">
                    <Icon size={26} />
                  </div>
                  <h3 className="feature-title">{pil.title}</h3>
                  <p className="feature-text">{pil.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section style={{ padding: '60px 0' }}>
        <div className="container">
          <div className="card cta-card" style={{ background: 'linear-gradient(135deg, #090d16 0%, #1e293b 100%)', color: '#ffffff', textAlign: 'center' }}>
            <h2 className="section-title cta-banner-title" style={{ color: '#ffffff', marginBottom: '16px' }}>
              எங்களோடு இணைந்து உங்கள் கல்விப் பயணத்தைத் தொடருங்கள்
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto 28px auto' }}>
              ஆயிரக்கணக்கான மாணவர்களோடு இணைந்து கல்வி வளங்கள் மற்றும் அறிவிப்புகளை உடனுக்குடன் பெற இப்போது செயற்படுங்கள்.
            </p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/resources" className="btn btn-primary">
                <span>கல்வி வளங்களை ஆராயுங்கள்</span>
                <ArrowRight size={18} />
              </Link>
              <a href="https://whatsapp.com/channel/0029VafVyoB2ZjCuGohiJe2V" target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ background: '#25D366', color: '#ffffff', borderColor: '#25D366' }}>
                <span>WhatsApp Channel-ல் இணையுங்கள்</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
