import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import '../styles/service-page.css';

const AIEcommerceSolution = () => {
  return (
    <div>
      <Navbar />
      
      {/* Hero Section */}
      <section className="service-hero">
        <div className="container">
          <div className="service-hero-content">
            <div className="breadcrumb">
              <Link to="/">Home</Link> / <Link to="/#services">Services</Link> / <span>AI-Powered E-commerce Solutions</span>
            </div>
            <h1 className="service-hero-title">AI-Powered E-commerce Solutions</h1>
            <p className="service-hero-subtitle">We've reimagined how e-commerce businesses get built. From concept to live store in minutes, not months.</p>
          </div>
        </div>
      </section>

      {/* Overview Section */}
      <section className="service-overview">
        <div className="container">
          <div className="overview-content">
            <div className="overview-text">
              <h2>Revolutionizing E-commerce Development</h2>
              <p>At GenVedha Global AI & Software Solutions, we've reimagined how e-commerce businesses get built.</p>
              <p>Traditionally, launching an online store means weeks of development, back-and-forth with agencies, and thousands of dollars before you even see a working product. We've compressed that timeline dramatically.</p>
              <p><strong>How it works:</strong> Our proprietary AI crews — a coordinated system of specialized AI agents — generate a fully-functional e-commerce application tailored to your business, combined with manual engineering review at every critical step to ensure production-grade quality. No shortcuts, no half-built templates.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Included */}
      <section className="services-offered">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Every Store We Generate Includes</h2>
            <p className="section-subtitle">Complete, production-ready e-commerce functionality out of the box</p>
          </div>
          <div className="services-list">
            <div className="service-item">
              <div className="service-icon">🛍️</div>
              <h3>Product Catalog with Images</h3>
              <p>Fully-featured product catalog system with high-quality image support, product descriptions, pricing, and inventory management. Your products displayed beautifully from day one.</p>
            </div>

            <div className="service-item">
              <div className="service-icon">🗂️</div>
              <h3>Category Filtering</h3>
              <p>Intuitive category organization and filtering system that helps customers find exactly what they're looking for. Multi-level categories and smart search functionality included.</p>
            </div>

            <div className="service-item">
              <div className="service-icon">🛒</div>
              <h3>Shopping Cart</h3>
              <p>Full-featured shopping cart with add/remove items, quantity adjustment, real-time price calculation, and persistent cart state across sessions.</p>
            </div>

            <div className="service-item">
              <div className="service-icon">🔐</div>
              <h3>Admin Panel</h3>
              <p>Comprehensive admin dashboard to manage products, orders, customers, and inventory. Full control over your store with an intuitive interface.</p>
            </div>

            <div className="service-item">
              <div className="service-icon">🗄️</div>
              <h3>Database Integration</h3>
              <p>Robust database architecture with MongoDB integration for reliable data storage, fast queries, and seamless scalability as your business grows.</p>
            </div>

            <div className="service-item">
              <div className="service-icon">📱</div>
              <h3>Responsive Design</h3>
              <p>Mobile-first, responsive design that looks perfect on every device. Your customers get a seamless shopping experience whether on phone, tablet, or desktop.</p>
            </div>

            <div className="service-item">
              <div className="service-icon">💳</div>
              <h3>Payment Gateway Integration</h3>
              <p>Secure payment processing with industry-standard payment gateway integration. Accept credit cards, debit cards, and digital payments with confidence.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Then We Go Further */}
      <section className="tech-stack">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Then We Go Further</h2>
            <p className="section-subtitle">Complete hosting and domain setup included</p>
          </div>
          <div className="benefits-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginTop: '3rem' }}>
            <div className="benefit-card">
              <div className="benefit-icon">🌐</div>
              <h3>AWS Cloud Hosting</h3>
              <p>Your app is hosted directly on GenVedha's AWS cloud infrastructure — secure, scalable, and production-ready from day one. No need to worry about servers, uptime, or infrastructure management.</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">🔗</div>
              <h3>Custom Domain Mapping</h3>
              <p>We map your custom domain from GoDaddy.com directly to your new store, so you go live under your own brand — no manual DNS headaches. Your business, your domain, fully professional.</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">⚡</div>
              <h3>Production-Grade Quality</h3>
              <p>Manual engineering review at every critical step ensures your store meets production standards. AI-powered generation combined with human expertise for the best of both worlds.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Development Process */}
      <section className="development-process">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">How It Works</h2>
            <p className="section-subtitle">From concept to live store in record time</p>
          </div>
          <div className="process-steps">
            <div className="process-step">
              <div className="step-number">01</div>
              <h3>Tell Us About Your Business</h3>
              <p>Share your business concept, product categories, branding preferences, and any specific requirements. Our team captures your vision in detail.</p>
            </div>
            <div className="process-step">
              <div className="step-number">02</div>
              <h3>AI Crews Generate Your Store</h3>
              <p>Our proprietary AI crews — specialized AI agents working in coordination — generate your complete e-commerce application with all features tailored to your business.</p>
            </div>
            <div className="process-step">
              <div className="step-number">03</div>
              <h3>Engineering Review</h3>
              <p>Our expert engineers review every critical component to ensure production-grade quality, security, and performance. No shortcuts, no compromises.</p>
            </div>
            <div className="process-step">
              <div className="step-number">04</div>
              <h3>AWS Deployment</h3>
              <p>Your store is deployed to GenVedha's secure AWS cloud infrastructure with automatic scaling, monitoring, and backup systems in place.</p>
            </div>
            <div className="process-step">
              <div className="step-number">05</div>
              <h3>Domain Mapping</h3>
              <p>We handle the complete DNS configuration and map your custom domain from GoDaddy.com to your new store. No technical knowledge required on your part.</p>
            </div>
            <div className="process-step">
              <div className="step-number">06</div>
              <h3>Go Live</h3>
              <p>Your fully-functional, branded e-commerce store goes live. Start selling immediately with confidence in your production-ready platform.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="benefits">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">The GenVedha Advantage</h2>
            <p className="section-subtitle">Why business owners choose our AI-powered e-commerce solution</p>
          </div>
          <div className="benefits-grid">
            <div className="benefit-card">
              <div className="benefit-icon">⚡</div>
              <h3>Dramatically Faster Launch</h3>
              <p>Go from concept to live store in a fraction of the traditional time. What used to take weeks now takes minutes with our AI-powered generation.</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">💰</div>
              <h3>Cost-Effective</h3>
              <p>Save thousands of dollars compared to traditional agency development. Get a production-grade store without the enterprise price tag.</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">🎯</div>
              <h3>Tailored to Your Business</h3>
              <p>Not a generic template — every store is generated specifically for your business with your products, categories, and branding.</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">🔒</div>
              <h3>Enterprise-Grade Security</h3>
              <p>Built with security best practices from the ground up. Secure payment processing, data encryption, and regular security updates included.</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">📈</div>
              <h3>Scalable Infrastructure</h3>
              <p>AWS cloud hosting means your store can handle traffic spikes and grow with your business. No performance bottlenecks as you scale.</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">🤝</div>
              <h3>Human + AI Excellence</h3>
              <p>AI-powered generation combined with manual engineering review ensures you get the speed of automation with the quality of human expertise.</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">🌐</div>
              <h3>Complete Hosting Solution</h3>
              <p>No need to find hosting or manage servers. Your store runs on our secure, monitored AWS infrastructure from day one.</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">🎨</div>
              <h3>Professional Branding</h3>
              <p>Custom domain mapping means your store launches under your own brand. Look professional and established from the start.</p>
            </div>
          </div>
        </div>
      </section>

      {/* The Result */}
      <section className="service-overview" style={{ 
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', 
        color: 'white', 
        padding: '5rem 0' 
      }}>
        <div className="container">
          <div className="overview-content">
            <div className="overview-text" style={{ 
              textAlign: 'center', 
              maxWidth: '900px', 
              margin: '0 auto', 
              padding: '2rem' 
            }}>
              <h2 style={{ 
                color: '#ffffff', 
                fontSize: '3rem', 
                fontWeight: '700', 
                marginBottom: '2rem', 
                textTransform: 'uppercase', 
                letterSpacing: '2px' 
              }}>The Result</h2>
              <p style={{ 
                fontSize: '1.35rem', 
                lineHeight: '2', 
                marginBottom: '2rem', 
                color: '#e0e0e0', 
                fontWeight: '400' 
              }}>A business owner can go from concept to a live, hosted, brandable e-commerce store in a fraction of the traditional time — powered by AI, backed by human expertise.</p>
              <p style={{ 
                fontSize: '1.6rem', 
                fontWeight: '700', 
                marginTop: '2.5rem', 
                color: '#ffd700', 
                lineHeight: '1.6', 
                textShadow: '0 2px 4px rgba(0,0,0,0.3)' 
              }}>This is what "Intelligence. Innovation. Impact." looks like in practice.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Launch Your E-commerce Store?</h2>
            <p>Let's discuss how we can generate a fully-functional, production-ready e-commerce store tailored to your business.</p>
            <div className="cta-buttons">
              <a href="/#contact" className="btn btn-primary">Get Started Today</a>
              <a href="/genvedha-guru" className="btn btn-secondary">Try GenVedha Guru</a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AIEcommerceSolution;
