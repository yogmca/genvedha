import React from 'react';

const Hero = () => {
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
    <section id="home" className="hero">
      <div className="container">
        <div className="hero-content">
          <h1 className="hero-title">Intelligence. Innovation. Impact.</h1>
          <p className="hero-subtitle">Transforming businesses through cutting-edge AI and software solutions</p>
          <div className="hero-buttons">
            <a href="#contact" className="btn btn-primary" onClick={(e) => { e.preventDefault(); scrollToSection('contact'); }}>Get Started</a>
            <a href="#services" className="btn btn-secondary" onClick={(e) => { e.preventDefault(); scrollToSection('services'); }}>Our Services</a>
          </div>
        </div>
      </div>
      <div className="hero-background">
        <img src="/logo.png" alt="GenVedha Logo" className="hero-logo-bg" />
      </div>
    </section>
  );
};

export default Hero;
