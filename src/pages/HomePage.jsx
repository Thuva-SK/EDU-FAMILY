import React from 'react';
import { Link } from 'react-router-dom';
import { 
  GraduationCap, 
  BookOpen, 
  Calendar, 
  Bell, 
  ArrowRight, 
  Users, 
  Sparkles, 
  Youtube
} from 'lucide-react';
import WhatsAppIcon from '../components/WhatsAppIcon';

export default function HomePage() {
  return (
    <div className="home-page">
      {/* Hero Banner Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-grid">
            <div>
              <div className="badge-tag">
                <Sparkles size={16} />
                <span>EDUCATION • INFORMATION • OPPORTUNITIES</span>
              </div>
              <h1 className="hero-title">
                கல்வியை அறிந்து<br />
                <span>எதிர்காலத்தை உருவாக்குங்கள்.</span>
              </h1>
              <p className="hero-desc">
                Edufamily in Tamil — மாணவர்களுக்கான கல்வி செய்திகள், அறிவிப்புகள், கருத்தரங்குகள், பயனுள்ள வளங்கள் மற்றும் கல்வி தகவல்களை ஒரே இடத்தில் வழங்கும் தளம்.
              </p>
              <div className="hero-actions">
                <Link to="/resources" className="btn btn-primary">
                  <span>Explore Resources</span>
                  <ArrowRight size={18} />
                </Link>
                <Link to="/about" className="btn btn-secondary">
                  <span>Learn About Us</span>
                </Link>
              </div>
            </div>

            <div className="hero-card-preview">
              <div className="hero-logo-img">
                <img src="/logo.jpg" alt="Edufamily in Tamil" />
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '8px' }}>
                Edufamily <span style={{ color: '#d71920' }}>in Tamil</span>
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                இலங்கை மாணவர்களுக்கான முதன்மை இலவச கல்வி தகவல் & வளங்கள் மையம்.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Overview Section */}
      <section style={{ background: 'var(--card-bg)', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
        <div className="container">
          <div className="section-head">
            <div className="section-mini">What We Provide</div>
            <h2 className="section-title">Edufamily மூலம் உங்களுக்குக் கிடைப்பவை</h2>
            <p className="section-desc">உங்களின் கல்வி வளர்ச்சிக்குத் தேவையான அனைத்து முக்கிய அம்சங்களும் ஒரே இடத்தில்.</p>
          </div>

          <div className="grid-4 home-features-grid">
            <div className="card feature-card">
              <div className="feature-icon">
                <Bell size={26} />
              </div>
              <h3 className="feature-title">Education Updates</h3>
              <p className="feature-text">முக்கிய கல்வி அறிவிப்புகள் மற்றும் பரீட்சை செய்திகள் உடனுக்குடன்.</p>
            </div>

            <div className="card feature-card">
              <div className="feature-icon">
                <Calendar size={26} />
              </div>
              <h3 className="feature-title">Seminars</h3>
              <p className="feature-text">இலவச நேரலை கருத்தரங்குகள் மற்றும் பாட வழிகாட்டல்கள்.</p>
            </div>

            <div className="card feature-card">
              <div className="feature-icon">
                <BookOpen size={26} />
              </div>
              <h3 className="feature-title">Resources</h3>
              <p className="feature-text">வினாத்தாள்கள், குறிப்புகள் மற்றும் இலவச கல்வி ஆவணங்கள்.</p>
            </div>

            <div className="card feature-card">
              <div className="feature-icon">
                <Users size={26} />
              </div>
              <h3 className="feature-title">Community</h3>
              <p className="feature-text">வாட்ஸ்அப் மற்றும் யூடியூப் வாயிலான மாணவர் சமூகம்.</p>
            </div>
          </div>
        </div>
      </section>



      {/* Media & Social Section */}
      <section>
        <div className="container">
          <div className="section-head">
            <div className="section-mini">Media & Social</div>
            <h2 className="section-title">எங்கள் கல்வி காணொளிகள் & சமூகம்</h2>
            <p className="section-desc">எங்கள் YouTube மற்றும் WhatsApp சேனல்களில் இணைந்து கல்வி அறிவிப்புகளை உடனுக்குடன் பெறுங்கள்.</p>
          </div>

          <div className="grid-2">
            <div className="card" style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(255,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Youtube size={36} color="#ff0000" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '4px' }}>YouTube Channel</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '12px' }}>Edufamily in Tamil YouTube Channel-ல் கல்வி வீடியோக்களைப் பாருங்கள்.</p>
                <a href="https://youtube.com/@edufamilyintamil" target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ padding: '6px 16px', fontSize: '0.85rem' }}>
                  Visit YouTube
                </a>
              </div>
            </div>

            <div className="card" style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(37,211,102,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <WhatsAppIcon size={36} color="#25D366" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '4px' }}>WhatsApp Channel</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '12px' }}>புதிய கல்வி அறிவிப்புகளை நேரடியாகப் பெற எங்கள் WhatsApp Channel-ஐ Follow செய்யுங்கள்.</p>
                <a href="https://whatsapp.com/channel/0029VafVyoB2ZjCuGohiJe2V" target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ padding: '6px 16px', fontSize: '0.85rem' }}>
                  Follow Channel
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
