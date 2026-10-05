import React, { useState } from 'react';
import {
  Mail,
  Youtube,
  MapPin,
  Send,
  Sparkles,
  CheckCircle2,
  PhoneCall,
  User
} from 'lucide-react';
import WhatsAppIcon from '../components/WhatsAppIcon';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';

export default function ContactPage() {
  const { addToast } = useToast();
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      addToast('தயவுசெய்து அனைத்து விவரங்களையும் பூர்த்தி செய்யவும்', 'error');
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase.from('inquiries').insert([
        {
          student_name: formData.name.trim(),
          email: formData.email.trim(),
          message: formData.message.trim(),
          subject: 'Website Contact Form',
          status: 'Unread',
          submitted_at: new Date().toISOString()
        }
      ]);

      if (error) {
        console.error('Inquiry error:', error);
        addToast(`செய்தி அனுப்புவதில் பிழை: ${error.message}`, 'error');
        return;
      }

      addToast('உங்கள் செய்தி வெற்றிகரமாக அனுப்பப்பட்டது! விரைவில் பதிலளிக்கப்படும்.', 'success');
      setFormData({ name: '', email: '', message: '' });
    } catch (err) {
      console.error(err);
      addToast('செய்தி அனுப்புவதில் பிழை ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="contact-page">
      {/* Header Banner */}
      <section style={{ background: 'radial-gradient(circle at 50% 0%, rgba(215, 25, 32, 0.12) 0%, transparent 60%)', padding: '60px 0 40px 0' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <div className="badge-tag">
            <Sparkles size={16} />
            <span>24/7 STUDENT SUPPORT</span>
          </div>
          <h1 className="section-title page-hero-title">
            எங்களைத் <span style={{ color: '#d71920' }}>தொடர்புகொள்ளுங்கள்</span> (Contact)
          </h1>
          <p className="section-desc">
            கல்வி தகவல்கள், சந்தேகங்கள் மற்றும் ஆலோசனைகளுக்கு எங்களை உடனுக்குடன் தொடர்பு கொள்ளவும்.
          </p>
        </div>
      </section>

      {/* Main Content Grid */}
      <section style={{ padding: '0 0 80px 0' }}>
        <div className="container">
          <div className="contact-grid">
            {/* Left Column: Instant Helplines */}
            <div className="contact-col">
              <h2 className="contact-col-title">எங்கள் தொடர்புகள்</h2>
              <p className="contact-col-subtitle">கீழுள்ள வழிகளில் நீங்கள் நேரடியாக எம்மைத் தொடர்பு கொள்ளலாம்:</p>

              {/* WhatsApp Card */}
              <div className="contact-card-item">
                <div className="contact-item-icon wa">
                  <WhatsAppIcon size={22} color="#25D366" />
                </div>
                <div className="contact-details">
                  <span className="contact-label">WhatsApp Helpline</span>
                  <div className="contact-val">+94 78 467 4025</div>
                </div>
                <a href="https://wa.me/94784674025" target="_blank" rel="noreferrer" className="btn btn-secondary contact-action-btn" style={{ color: '#25D366', borderColor: 'rgba(37, 211, 102, 0.4)' }}>
                  Chat Now
                </a>
              </div>

              {/* Email Card */}
              <div className="contact-card-item">
                <div className="contact-item-icon mail">
                  <Mail size={22} />
                </div>
                <div className="contact-details">
                  <span className="contact-label">Official Email</span>
                  <div className="contact-val">edufamily0000@gmail.com</div>
                </div>
                <a href="mailto:edufamily0000@gmail.com" className="btn btn-secondary contact-action-btn">
                  Send Email
                </a>
              </div>

              {/* YouTube Card */}
              <div className="contact-card-item">
                <div className="contact-item-icon yt">
                  <Youtube size={22} />
                </div>
                <div className="contact-details">
                  <span className="contact-label">YouTube Channel</span>
                  <div className="contact-val">Edufamily in Tamil</div>
                </div>
                <a href="https://youtube.com/@edufamilyintamil" target="_blank" rel="noreferrer" className="btn btn-secondary contact-action-btn" style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.4)' }}>
                  Subscribe
                </a>
              </div>

              {/* Location Card */}
              <div className="contact-card-item">
                <div className="contact-item-icon loc">
                  <MapPin size={22} />
                </div>
                <div className="contact-details">
                  <span className="contact-label">Location / இலங்கை</span>
                  <div className="contact-val">Sri Lanka • ஆன்லைன் தளம்</div>
                </div>
              </div>
            </div>

            {/* Right Column: Direct Message Form */}
            <div className="contact-col">
              <h2 className="contact-col-title">செய்தி அனுப்பவும்</h2>
              <p className="contact-col-subtitle">
                உங்கள் வினாக்கள் மற்றும் கோரிக்கைகளை கீழே பதிவு செய்யுங்கள்:
              </p>

              <div className="glass-form-card">
                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label>உங்கள் பெயர் (Full Name)</label>
                    <div className="input-icon-wrap">
                      <User size={18} className="field-icon" />
                      <input
                        type="text"
                        placeholder="எ.கா: குகன் திலகன்"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>மின்னஞ்சல் (Email Address)</label>
                    <div className="input-icon-wrap">
                      <Mail size={18} className="field-icon" />
                      <input
                        type="email"
                        placeholder="example@gmail.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>உங்கள் செய்தி (Message Details)</label>
                    <div className="input-icon-wrap">
                      <Send size={18} className="field-icon" />
                      <textarea
                        placeholder="உங்களுக்குத் தேவையான கல்வித் தகவல் அல்லது வினா..."
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submitting}>
                    {submitting ? <span>செய்தி அனுப்புகிறது...</span> : (
                      <>
                        <span>செய்தியை அனுப்பு (Send Message)</span>
                        <Send size={16} />
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
