import React from 'react';

const Portfolio = () => {
  const projects = [
    {
      name: 'Coorg Masala',
      type: 'E-commerce Platform',
      url: 'https://coorgmasala.com',
      domain: 'coorgmasala.com',
      description: 'Full-featured e-commerce platform for authentic Coorg spices with integrated payment gateway and inventory management.'
    },
    {
      name: 'Genvedha Guru',
      type: 'AI E-commerce App Creator',
      url: 'https://genvedha.com/genvedha-guru.html',
      domain: 'genvedha.com/genvedha-guru',
      description: 'AI-powered assistant that builds complete, fully-functional e-commerce applications from a simple conversation in under a minute.'
    }
  ];

  return (
    <section id="portfolio" className="portfolio">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">Our Projects</h2>
          <p className="section-subtitle">Software solutions we've delivered</p>
        </div>
        <div className="portfolio-grid">
          {projects.map((project, index) => (
            <div key={index} className="portfolio-card">
              <div className="portfolio-image">
                <div className="portfolio-overlay">
                  <h3>{project.name}</h3>
                  <p>{project.type}</p>
                  <a href={project.url} target="_blank" rel="noopener noreferrer" className="portfolio-link">Visit Site →</a>
                </div>
              </div>
              <div className="portfolio-info">
                <h4>{project.domain}</h4>
                <p>{project.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Portfolio;
