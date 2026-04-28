import React from 'react';
import { Link } from 'react-router-dom';

const Services = () => {
  const services = [
    {
      icon: '🤖',
      title: 'AI & Machine Learning',
      description: 'Advanced AI solutions including predictive analytics, natural language processing, and computer vision to drive intelligent automation.',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    {
      icon: '💻',
      title: 'Custom Software Development',
      description: 'Tailored software solutions built with modern technologies to meet your unique business requirements and scale with your growth.',
      gradient: 'linear-gradient(135deg, #0066ff 0%, #00d4ff 100%)',
      link: '/application-development'
    },
    {
      icon: '☁️',
      title: 'Cloud Solutions',
      description: 'Cloud migration, architecture design, and optimization services for AWS, Azure, and Google Cloud platforms.',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    },
    {
      icon: '📊',
      title: 'Data Analytics',
      description: 'Transform raw data into actionable insights with our comprehensive data analytics and business intelligence solutions.',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    },
    {
      icon: '🔒',
      title: 'Cybersecurity',
      description: 'Protect your digital assets with our advanced security solutions, including threat detection and compliance management.',
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
    },
    {
      icon: '📱',
      title: 'Mobile App Development',
      description: 'Native and cross-platform mobile applications that deliver exceptional user experiences on iOS and Android.',
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
    }
  ];

  return (
    <section id="services" className="services">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">Our Services</h2>
          <p className="section-subtitle">Comprehensive AI and software solutions tailored to your needs</p>
        </div>
        <div className="services-grid">
          {services.map((service, index) => (
            <div key={index} className="service-card">
              <div className="service-image">
                <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id={`grad${index + 1}`} x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{ stopColor: service.gradient.match(/#[0-9a-f]{6}/gi)[0], stopOpacity: 1 }} />
                      <stop offset="100%" style={{ stopColor: service.gradient.match(/#[0-9a-f]{6}/gi)[1], stopOpacity: 1 }} />
                    </linearGradient>
                  </defs>
                  <rect width="200" height="200" rx="20" fill={`url(#grad${index + 1})`} opacity="0.1"/>
                  <text x="100" y="120" fontSize="80" textAnchor="middle" fill={`url(#grad${index + 1})`}>{service.icon}</text>
                </svg>
              </div>
              <h3>{service.title}</h3>
              <p>{service.description}</p>
              {service.link && (
                <Link to={service.link} className="service-link">Learn More →</Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
