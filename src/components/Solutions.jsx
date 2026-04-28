import React from 'react';

const Solutions = () => {
  const solutions = [
    {
      title: 'Healthcare',
      description: 'AI-powered diagnostic tools, patient management systems, and healthcare analytics platforms.'
    },
    {
      title: 'Finance',
      description: 'Fraud detection, algorithmic trading, risk assessment, and financial forecasting solutions.'
    },
    {
      title: 'Retail & E-commerce',
      description: 'Personalization engines, inventory optimization, and customer behavior analytics.'
    },
    {
      title: 'Manufacturing',
      description: 'Predictive maintenance, quality control automation, and supply chain optimization.'
    },
    {
      title: 'Education',
      description: 'Learning management systems, adaptive learning platforms, and educational analytics.'
    },
    {
      title: 'Logistics',
      description: 'Route optimization, fleet management, and real-time tracking solutions.'
    }
  ];

  return (
    <section id="solutions" className="solutions">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">Industry Solutions</h2>
          <p className="section-subtitle">Specialized solutions for diverse industries</p>
        </div>
        <div className="solutions-grid">
          {solutions.map((solution, index) => (
            <div key={index} className="solution-card">
              <h3>{solution.title}</h3>
              <p>{solution.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Solutions;
