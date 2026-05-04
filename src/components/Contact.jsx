import React, { useState } from 'react';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    service: 'General Inquiry',
    message: ''
  });
  const [formMessage, setFormMessage] = useState({ text: '', type: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormMessage({ text: '', type: '' });

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (result.success) {
        setFormMessage({ text: result.message, type: 'success' });
        setFormData({
          name: '',
          email: '',
          phone: '',
          company: '',
          service: 'General Inquiry',
          message: ''
        });
        setTimeout(() => {
          setFormMessage({ text: '', type: '' });
        }, 5000);
      } else {
        setFormMessage({ text: result.message || 'An error occurred. Please try again.', type: 'error' });
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setFormMessage({ text: 'Network error. Please check your connection and try again.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="contact">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">Get In Touch</h2>
          <p className="section-subtitle">Let's discuss how we can help transform your business</p>
        </div>
        <div className="contact-wrapper">
          <div className="contact-info">
            <h3>Contact Information</h3>
            <div className="info-item">
              <span className="info-icon">📧</span>
              <div>
                <h4>Email</h4>
                <p>support@genvedha.com</p>
              </div>
            </div>
            <div className="info-item">
              <span className="info-icon">📞</span>
              <div>
                <h4>Phone</h4>
                <p>+918867487656</p>
              </div>
            </div>
            <div className="info-item">
              <span className="info-icon">📍</span>
              <div>
                <h4>Address</h4>
                <p>Global Technology Hub<br />Innovation District</p>
              </div>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="contact-form">
            <div className="form-group">
              <label htmlFor="name">Full Name *</label>
              <input 
                type="text" 
                id="name" 
                name="name" 
                value={formData.name}
                onChange={handleChange}
                required 
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
              <input 
                type="email" 
                id="email" 
                name="email" 
                value={formData.email}
                onChange={handleChange}
                required 
              />
            </div>
            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input 
                type="tel" 
                id="phone" 
                name="phone" 
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="company">Company Name</label>
              <input 
                type="text" 
                id="company" 
                name="company" 
                value={formData.company}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="service">Service Interest</label>
              <select 
                id="service" 
                name="service"
                value={formData.service}
                onChange={handleChange}
              >
                <option value="General Inquiry">General Inquiry</option>
                <option value="AI & Machine Learning">AI & Machine Learning</option>
                <option value="Custom Software Development">Custom Software Development</option>
                <option value="Cloud Solutions">Cloud Solutions</option>
                <option value="Data Analytics">Data Analytics</option>
                <option value="Cybersecurity">Cybersecurity</option>
                <option value="Mobile App Development">Mobile App Development</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="message">Message *</label>
              <textarea 
                id="message" 
                name="message" 
                rows="5" 
                value={formData.message}
                onChange={handleChange}
                required
              ></textarea>
            </div>
            <button type="submit" className="btn btn-primary btn-submit" disabled={isSubmitting}>
              {isSubmitting ? 'Sending...' : 'Send Message'}
            </button>
            {formMessage.text && (
              <div className={`form-message ${formMessage.type}`} style={{ display: 'block' }}>
                {formMessage.text}
              </div>
            )}
          </form>
        </div>
      </div>
    </section>
  );
};

export default Contact;
