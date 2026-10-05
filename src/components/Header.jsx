import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { 
  GraduationCap, 
  Home, 
  Info, 
  BookOpen, 
  Calendar, 
  Bell, 
  Mail, 
  Sun, 
  Moon, 
  Menu as MenuIcon, 
  X
} from 'lucide-react';

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  // Scroll listener for enhanced floating pill elevation
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileOpen]);

  const navItems = [
    { path: '/', label: 'முகப்பு', icon: Home },
    { path: '/about', label: 'பற்றி', icon: Info },
    { path: '/resources', label: 'வளங்கள்', icon: BookOpen },
    { path: '/events', label: 'நிகழ்வுகள்', icon: Calendar },
    { path: '/announcements', label: 'அறிவிப்புகள்', icon: Bell },
    { path: '/contact', label: 'தொடர்பு', icon: Mail }
  ];

  return (
    <>
      <header className={`site-header ${scrolled ? 'is-scrolled' : ''}`}>
        <div className="header-container">
          {/* Brand Logo & Title */}
          <NavLink to="/" className="brand-link">
            <img src="/logo.jpg" alt="Edufamily in Tamil" className="brand-logo-img" />
            <div className="brand-text-wrap">
              <span className="brand-title">Edufamily <b>in Tamil</b></span>
              <span className="brand-tag">கல்வி தளம்</span>
            </div>
          </NavLink>

          {/* Desktop Navigation Links */}
          <nav className="desktop-nav">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Actions & Mobile Toggle */}
          <div className="header-actions">
            <button
              className="icon-btn"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
              aria-label="Toggle Theme"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            <button
              className="icon-btn mobile-menu-btn"
              onClick={() => setMobileOpen(true)}
              aria-label="Open Navigation Menu"
            >
              <MenuIcon size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Backdrop & Menu */}
      <div 
        className={`mobile-drawer-backdrop ${mobileOpen ? 'open' : ''}`}
        onClick={() => setMobileOpen(false)}
      />
      <div className={`mobile-drawer ${mobileOpen ? 'open' : ''}`}>
        <div className="mobile-drawer-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src="/logo.jpg" alt="Edufamily in Tamil" className="brand-logo-img" style={{ width: 34, height: 34 }} />
            <div className="brand-text-wrap">
              <span className="brand-title">Edufamily <b>in Tamil</b></span>
            </div>
          </div>
          <button className="icon-btn" onClick={() => setMobileOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <div className="mobile-nav-links">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </>
  );
}
