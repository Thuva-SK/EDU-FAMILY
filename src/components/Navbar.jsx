import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen((prev) => !prev);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className="site-header">
      <nav className="navbar container" aria-label="Primary navigation">
        <Link className="brand" to="/" onClick={closeMobileMenu} aria-label="EDU FAMILY home">
          <img className="brand-logo" src="/assets/edu-family-logo.jpeg" alt="EDU FAMILY logo" />
          <span>EDU FAMILY</span>
        </Link>
        <div className="nav-actions">
          <button
            className="theme-toggle"
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
            title="Toggle dark mode"
          >
            <span className="icon-sun">☀️</span>
            <span className="icon-moon">🌙</span>
          </button>
          <button
            className="nav-toggle"
            type="button"
            onClick={toggleMobileMenu}
            aria-label="Open navigation"
            aria-expanded={mobileMenuOpen}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
        <div className={`nav-menu ${mobileMenuOpen ? 'open' : ''}`}>
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')} onClick={closeMobileMenu}>
            Home
          </NavLink>
          <NavLink to="/notes" className={({ isActive }) => (isActive ? 'active' : '')} onClick={closeMobileMenu}>
            Notes
          </NavLink>
          <NavLink to="/news" className={({ isActive }) => (isActive ? 'active' : '')} onClick={closeMobileMenu}>
            News
          </NavLink>
          <NavLink to="/about" className={({ isActive }) => (isActive ? 'active' : '')} onClick={closeMobileMenu}>
            About
          </NavLink>
        </div>
      </nav>
    </header>
  );
}
