import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offsetTop = element.offsetTop - 80;
      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
      });
    }
  };

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>GenVedha</h3>
            <p>Global AI & Software Solutions</p>
            <p className="footer-tagline">Intelligence. Innovation. Impact.</p>
          </div>
          <div className="footer-section">
            <h4>Quick Links</h4>
            <ul>
              <li><a href="#home" onClick={() => scrollToSection('home')}>Home</a></li>
              <li><a href="#services" onClick={() => scrollToSection('services')}>Services</a></li>
              <li><a href="#solutions" onClick={() => scrollToSection('solutions')}>Solutions</a></li>
              <li><a href="#about" onClick={() => scrollToSection('about')}>About</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Services</h4>
            <ul>
              <li><a href="#services" onClick={() => scrollToSection('services')}>AI & Machine Learning</a></li>
              <li><Link to="/application-development">Application Development</Link></li>
              <li><a href="#services" onClick={() => scrollToSection('services')}>Cloud Solutions</a></li>
              <li><a href="#services" onClick={() => scrollToSection('services')}>Data Analytics</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Connect</h4>
            <ul>
              <li><a href="#contact" onClick={() => scrollToSection('contact')}>Contact Us</a></li>
              <li><a href="mailto:support@genvedha.com">support@genvedha.com</a></li>
              <li><a href="tel:+15551234567">+1 (555) 123-4567</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 GenVedha Global AI & Software Solutions. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
