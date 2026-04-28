import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const ApplicationDevelopment = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const services = [
    {
      icon: '💻',
      title: 'Custom Application Development',
      description: 'Build tailored applications that perfectly align with your business processes and objectives. From web applications to enterprise software, we create solutions that scale with your growth.',
      features: [
        'Web Application Development',
        'Enterprise Software Solutions',
        'Progressive Web Apps (PWA)',
        'API Development & Integration'
      ]
    },
    {
      icon: '📱',
      title: 'Mobile Application Development',
      description: 'Create engaging mobile experiences for iOS and Android platforms. Native or cross-platform, we deliver high-performance mobile apps that users love.',
      features: [
        'Native iOS & Android Apps',
        'Cross-Platform Development (React Native, Flutter)',
        'Mobile UI/UX Design',
        'App Store Optimization'
      ]
    },
    {
      icon: '🔄',
      title: 'Legacy Application Modernization',
      description: 'Transform outdated systems into modern, efficient applications. We help you migrate legacy applications to contemporary platforms while preserving critical business logic.',
      features: [
        'Legacy System Assessment',
        'Platform Migration',
        'Code Refactoring & Optimization',
        'Database Modernization'
      ]
    },
    {
      icon: '☁️',
      title: 'Cloud-Native Development',
      description: 'Build applications designed for the cloud from day one. Leverage microservices, containers, and serverless architectures for maximum scalability and resilience.',
      features: [
        'Microservices Architecture',
        'Containerization (Docker, Kubernetes)',
        'Serverless Applications',
        'Cloud Migration Services'
      ]
    },
    {
      icon: '🔗',
      title: 'API Development & Integration',
      description: 'Connect your applications and systems seamlessly. We design and implement robust APIs and integrate third-party services to extend your application capabilities.',
      features: [
        'RESTful API Development',
        'GraphQL Implementation',
        'Third-Party Integrations',
        'API Security & Management'
      ]
    },
    {
      icon: '⚡',
      title: 'Application Performance Optimization',
      description: 'Enhance the speed, efficiency, and reliability of your applications. Our optimization services ensure your applications perform at their best under any load.',
      features: [
        'Performance Audits',
        'Code Optimization',
        'Database Tuning',
        'Load Testing & Monitoring'
      ]
    }
  ];

  const techStack = {
    Frontend: ['React', 'Angular', 'Vue.js', 'Next.js', 'TypeScript', 'HTML5/CSS3'],
    Backend: ['Node.js', 'Python', 'Java', '.NET', 'Go', 'PHP'],
    Mobile: ['React Native', 'Flutter', 'Swift', 'Kotlin', 'Xamarin'],
    'Cloud & DevOps': ['AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes', 'CI/CD'],
    Databases: ['PostgreSQL', 'MongoDB', 'MySQL', 'Redis', 'DynamoDB', 'Elasticsearch']
  };

  const processSteps = [
    {
      number: '01',
      title: 'Discovery & Planning',
      description: 'We begin by understanding your business goals, requirements, and challenges. Our team conducts thorough analysis to create a comprehensive project roadmap.'
    },
    {
      number: '02',
      title: 'Design & Architecture',
      description: 'Our architects and designers create intuitive user experiences and robust technical architectures that ensure scalability and maintainability.'
    },
    {
      number: '03',
      title: 'Agile Development',
      description: 'Using agile methodologies, we develop your application in iterative sprints, ensuring continuous feedback and rapid adaptation to changing needs.'
    },
    {
      number: '04',
      title: 'Quality Assurance',
      description: 'Rigorous testing at every stage ensures your application is bug-free, secure, and performs optimally across all platforms and devices.'
    },
    {
      number: '05',
      title: 'Deployment & Launch',
      description: 'We handle the entire deployment process, ensuring smooth transition to production with minimal disruption to your operations.'
    },
    {
      number: '06',
      title: 'Support & Maintenance',
      description: 'Post-launch, we provide ongoing support, monitoring, and maintenance to ensure your application continues to perform at its best.'
    }
  ];

  const benefits = [
    {
      icon: '🎯',
      title: 'Business-Focused Approach',
      description: 'We don\'t just write code – we solve business problems. Every solution is designed to deliver measurable business value and ROI.'
    },
    {
      icon: '🚀',
      title: 'Rapid Time-to-Market',
      description: 'Our agile methodology and experienced teams ensure faster delivery without compromising on quality.'
    },
    {
      icon: '🔒',
      title: 'Security First',
      description: 'Security is built into every layer of our applications, from design to deployment, ensuring your data and users are protected.'
    },
    {
      icon: '📈',
      title: 'Scalable Solutions',
      description: 'Our applications are built to grow with your business, handling increased load and new features seamlessly.'
    },
    {
      icon: '💡',
      title: 'Innovation-Driven',
      description: 'We stay ahead of technology trends, incorporating the latest innovations to give you a competitive edge.'
    },
    {
      icon: '🤝',
      title: 'Transparent Communication',
      description: 'Regular updates, clear documentation, and open communication ensure you\'re always in the loop.'
    }
  ];

  return (
    <>
      <Navbar />
      
      {/* Hero Section */}
      <section className="service-hero">
        <div className="container">
          <div className="service-hero-content">
            <div className="breadcrumb">
              <Link to="/">Home</Link> / <a href="/#services">Services</a> / <span>Application Development & Modernization</span>
            </div>
            <h1 className="service-hero-title">Application Development & Modernization</h1>
            <p className="service-hero-subtitle">Transform your business with custom-built applications and modernize legacy systems for the digital age</p>
          </div>
        </div>
      </section>

      {/* Overview Section */}
      <section className="service-overview">
        <div className="container">
          <div className="overview-content">
            <div className="overview-text">
              <h2>Empowering Digital Transformation</h2>
              <p>In today's fast-paced digital landscape, businesses need robust, scalable, and innovative applications to stay competitive. Our Application Development & Modernization services help you build new solutions from the ground up or transform existing systems to meet modern standards.</p>
              <p>We combine cutting-edge technologies, agile methodologies, and industry best practices to deliver applications that drive business growth, enhance user experiences, and provide measurable ROI.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Offered */}
      <section className="services-offered">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Our Application Development Services</h2>
            <p className="section-subtitle">Comprehensive solutions for every stage of your application lifecycle</p>
          </div>
          <div className="services-list">
            {services.map((service, index) => (
              <div key={index} className="service-item">
                <div className="service-icon">{service.icon}</div>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
                <ul className="feature-list">
                  {service.features.map((feature, idx) => (
                    <li key={idx}>{feature}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section className="tech-stack">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Technologies We Work With</h2>
            <p className="section-subtitle">Leveraging the latest and most reliable technologies</p>
          </div>
          <div className="tech-categories">
            {Object.entries(techStack).map(([category, technologies], index) => (
              <div key={index} className="tech-category">
                <h3>{category}</h3>
                <div className="tech-tags">
                  {technologies.map((tech, idx) => (
                    <span key={idx} className="tech-tag">{tech}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Development Process */}
      <section className="development-process">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Our Development Process</h2>
            <p className="section-subtitle">A proven methodology for successful project delivery</p>
          </div>
          <div className="process-steps">
            {processSteps.map((step, index) => (
              <div key={index} className="process-step">
                <div className="step-number">{step.number}</div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="benefits">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Why Choose GenVedha?</h2>
            <p className="section-subtitle">The advantages of partnering with us</p>
          </div>
          <div className="benefits-grid">
            {benefits.map((benefit, index) => (
              <div key={index} className="benefit-card">
                <div className="benefit-icon">{benefit.icon}</div>
                <h3>{benefit.title}</h3>
                <p>{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Transform Your Applications?</h2>
            <p>Let's discuss how we can help you build or modernize applications that drive your business forward.</p>
            <div className="cta-buttons">
              <Link to="/#contact" className="btn btn-primary">Get Started</Link>
              <Link to="/#services" className="btn btn-secondary">Explore More Services</Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
};

export default ApplicationDevelopment;
