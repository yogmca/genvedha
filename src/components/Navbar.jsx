import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const scrollToSection = (sectionId) => {
    if (location.pathname !== '/') {
      window.location.href = `/#${sectionId}`;
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        const offsetTop = element.offsetTop - 80;
        window.scrollTo({
          top: offsetTop,
          behavior: 'smooth'
        });
      }
    }
    closeMenu();
  };

  const navbarStyle = {
    background: scrolled ? 'rgba(255, 255, 255, 0.98)' : 'rgba(255, 255, 255, 0.95)',
    boxShadow: scrolled ? '0 4px 16px rgba(0, 0, 0, 0.1)' : '0 2px 8px rgba(0, 0, 0, 0.1)'
  };

  return (
    <nav className="navbar" style={navbarStyle}>
      <div className="container">
        <div className="nav-wrapper">
          <div className="logo">
            <Link to="/" style={{ textDecoration: 'none' }}>
              <h1>GenVedha</h1>
              <span className="logo-subtitle">Global AI & Software Solutions</span>
            </Link>
          </div>
          <ul className={`nav-menu ${isMenuOpen ? 'active' : ''}`} id="navMenu">
            <li><a href="#home" className="nav-link" onClick={() => scrollToSection('home')}>Home</a></li>
            <li><a href="#services" className="nav-link" onClick={() => scrollToSection('services')}>Services</a></li>
            <li><a href="#solutions" className="nav-link" onClick={() => scrollToSection('solutions')}>Solutions</a></li>
            <li><a href="#about" className="nav-link" onClick={() => scrollToSection('about')}>About</a></li>
            <li><a href="#contact" className="nav-link" onClick={() => scrollToSection('contact')}>Contact</a></li>
          </ul>
          <button 
            className="mobile-menu-toggle" 
            id="mobileMenuToggle"
            onClick={toggleMenu}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
