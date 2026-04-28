# GenVedha Global AI & Software Solutions Website

A modern, professional website for GenVedha Global AI & Software Solutions with MongoDB integration for contact form submissions.

## Features

- **Modern Responsive Design**: Beautiful, mobile-friendly interface
- **Contact Form**: Integrated with MongoDB to store contact submissions
- **Service Showcase**: Display AI, software development, and cloud services
- **Industry Solutions**: Highlight solutions for various industries
- **Smooth Animations**: Professional animations and transitions
- **SEO Optimized**: Proper meta tags and semantic HTML

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Node.js, Express.js
- **Database**: MongoDB Atlas
- **Styling**: Custom CSS with modern design patterns

## Installation

1. Navigate to the project directory:
```bash
cd genvedha-website
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
The `.env` file is already configured with your MongoDB credentials:
- Username: ykmysuru27_db_user
- Password: QWLP9LcE3nIRcEaY

4. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

5. Open your browser and visit:
```
http://localhost:3000
```

## Project Structure

```
genvedha-website/
├── public/
│   ├── index.html      # Main HTML file
│   ├── styles.css      # Styling
│   └── script.js       # Frontend JavaScript
├── server.js           # Express server with MongoDB integration
├── package.json        # Dependencies
├── .env               # Environment variables (MongoDB credentials)
└── README.md          # This file
```

## API Endpoints

### POST /api/contact
Submit a new contact form
- **Body**: JSON with name, email, phone, company, service, message
- **Response**: Success/error message with contact ID

### GET /api/contacts
Retrieve all contacts (admin endpoint)
- **Response**: Array of all contact submissions

### GET /api/health
Health check endpoint
- **Response**: Server and database status

## MongoDB Schema

Contacts are stored with the following structure:
```javascript
{
  name: String,
  email: String,
  phone: String,
  company: String,
  message: String,
  service: String,
  submittedAt: Date,
  status: String
}
```

## Features Included

1. **Hero Section**: Eye-catching landing with call-to-action buttons
2. **Services Section**: 6 service cards with icons and descriptions
3. **Solutions Section**: Industry-specific solutions showcase
4. **About Section**: Company information with statistics
5. **Contact Form**: Fully functional form with MongoDB integration
6. **Responsive Design**: Works on all devices (mobile, tablet, desktop)
7. **Smooth Scrolling**: Navigation with smooth scroll behavior
8. **Form Validation**: Client-side and server-side validation
9. **Loading States**: Visual feedback during form submission
10. **Error Handling**: Comprehensive error handling and user feedback

## Customization

### Update Company Information
Edit the content in `public/index.html` to update:
- Company name and tagline
- Services and descriptions
- Contact information
- Statistics

### Modify Styling
Edit `public/styles.css` to customize:
- Colors (CSS variables in `:root`)
- Fonts
- Layout and spacing
- Animations

### Add More Features
Extend `server.js` to add:
- Email notifications
- Admin dashboard
- Authentication
- Additional API endpoints

## Security Notes

- The `.env` file contains sensitive credentials. In production, ensure it's not committed to version control
- Consider adding rate limiting for the contact form
- Implement CAPTCHA for spam prevention
- Add authentication for the admin endpoints

## Support

For issues or questions, contact: info@genvedha.com

## License

© 2026 GenVedha Global AI & Software Solutions. All rights reserved.
