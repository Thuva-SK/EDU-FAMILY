import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Youtube } from 'lucide-react';
import WhatsAppIcon from './WhatsAppIcon';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-simple-wrap">
          {/* Brand & Tagline */}
          <div className="footer-simple-brand">
            <Link to="/" className="brand-link">
              <img src="/logo.jpg" alt="Edufamily in Tamil" className="brand-logo-img" style={{ width: 38, height: 38 }} />
              <div className="brand-text-wrap">
                <span className="brand-title" style={{ fontSize: '1.15rem' }}>Edufamily <b>in Tamil</b></span>
              </div>
            </Link>
            <p className="footer-simple-tagline">
              மாணவர்களுக்கான கல்வி செய்திகள், அறிவிப்புகள் மற்றும் இலவசக் கல்வி வளங்கள்.
            </p>
          </div>

          {/* Quick Nav Links */}
          <nav className="footer-simple-nav">
            <Link to="/">முகப்பு</Link>
            <Link to="/about">பற்றி</Link>
            <Link to="/resources">வளங்கள்</Link>
            <Link to="/events">நிகழ்வுகள்</Link>
            <Link to="/announcements">அறிவிப்புகள்</Link>
            <Link to="/contact">தொடர்பு</Link>
          </nav>

          {/* Social Links */}
          <div className="footer-simple-social">
            <a 
              href="https://youtube.com/@edufamilyintamil" 
              target="_blank" 
              rel="noreferrer" 
              className="icon-btn" 
              title="YouTube"
              aria-label="YouTube Channel"
            >
              <Youtube size={18} color="#ef4444" />
            </a>
            <a 
              href="https://whatsapp.com/channel/0029VafVyoB2ZjCuGohiJe2V" 
              target="_blank" 
              rel="noreferrer" 
              className="icon-btn" 
              title="WhatsApp Channel"
              aria-label="WhatsApp Channel"
            >
              <WhatsAppIcon size={18} color="#25D366" />
            </a>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Edufamily in Tamil. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
}
