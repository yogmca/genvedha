# GenVedha Global AI & Software Solutions Website

A modern, React-based website for GenVedha Global AI & Software Solutions, featuring a responsive design, contact form with email notifications, and MongoDB integration.

## 🚀 Features

- **React Frontend**: Modern JSX components with React Router for navigation
- **Responsive Design**: Mobile-first design that works on all devices
- **Contact Form**: Integrated contact form with backend API
- **Email Notifications**: Automatic email notifications for form submissions
- **MongoDB Integration**: Store contact form submissions in MongoDB
- **Service Pages**: Detailed service pages including Application Development
- **Portfolio Showcase**: Display of completed projects

## 📁 Project Structure

```
genvedha-website/
├── src/                          # React source files
│   ├── components/               # Reusable React components
│   │   ├── Navbar.jsx           # Navigation component
│   │   ├── Footer.jsx           # Footer component
│   │   ├── Hero.jsx             # Hero section
│   │   ├── Services.jsx         # Services grid
│   │   ├── Portfolio.jsx        # Portfolio showcase
│   │   ├── Solutions.jsx        # Industry solutions
│   │   ├── About.jsx            # About section
│   │   └── Contact.jsx          # Contact form
│   ├── pages/                   # Page components
│   │   ├── Home.jsx             # Home page
│   │   └── ApplicationDevelopment.jsx  # Service detail page
│   ├── styles/                  # CSS files
│   │   ├── main.css             # Main styles
│   │   └── service-page.css     # Service page styles
│   ├── App.jsx                  # Main app component with routing
│   └── index.js                 # Entry point
├── public/                      # Static assets
│   ├── logo.png                 # Company logo
│   └── index-template.html      # HTML template
├── dist/                        # Production build (generated)
├── server.js                    # Express backend server
├── webpack.config.js            # Webpack configuration
├── .babelrc                     # Babel configuration
├── .env                         # Environment variables
└── package.json                 # Dependencies and scripts

```

## 🛠️ Technology Stack

### Frontend
- **React 19.2.5**: UI library
- **React Router DOM 7.14.2**: Client-side routing
- **Webpack 5**: Module bundler
- **Babel**: JavaScript transpiler

### Backend
- **Node.js**: Runtime environment
- **Express 4.18.2**: Web framework
- **MongoDB 6.3.0**: Database
- **Nodemailer 8.0.7**: Email service
- **CORS**: Cross-origin resource sharing
- **dotenv**: Environment variable management

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd genvedha-website
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Copy `.env.example` to `.env` and update with your credentials:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your MongoDB and email settings:
   ```env
   # MongoDB Configuration
   MONGODB_USERNAME=your_username
   MONGODB_PASSWORD=your_password
   MONGODB_CLUSTER=your_cluster.mongodb.net
   MONGODB_DATABASE=genvedha

   # Email Configuration
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   EMAIL_FROM=your-email@gmail.com
   EMAIL_TO=support@genvedha.com

   # Server Configuration
   PORT=3000
   ```

## 🚀 Running the Application

### Development Mode

**Option 1: Run backend and frontend separately**

Terminal 1 - Backend server:
```bash
npm run dev
```

Terminal 2 - Frontend dev server:
```bash
npm run dev:client
```

**Option 2: Run both concurrently**
```bash
npm run dev:all
```

The backend will run on `http://localhost:3000` and the frontend dev server on `http://localhost:3001`.

### Production Mode

1. **Build the React app**
   ```bash
   npm run build
   ```

2. **Start the production server**
   ```bash
   npm start
   ```

The application will be available at `http://localhost:3000`.

## 📝 Available Scripts

- `npm start` - Start production server (serves built React app)
- `npm run dev` - Start backend server with nodemon (auto-restart)
- `npm run build` - Build React app for production
- `npm run dev:client` - Start webpack dev server for frontend development
- `npm run dev:all` - Run both backend and frontend dev servers concurrently

## 🔌 API Endpoints

### POST `/api/contact`
Submit a contact form

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "company": "Example Corp",
  "service": "AI & Machine Learning",
  "message": "I'm interested in your services"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Thank you for contacting us! We will get back to you soon.",
  "contactId": "507f1f77bcf86cd799439011",
  "emailSent": true
}
```

### GET `/api/contacts`
Get all contact submissions (admin endpoint)

**Response:**
```json
{
  "success": true,
  "contacts": [...]
}
```

### GET `/api/health`
Health check endpoint

**Response:**
```json
{
  "success": true,
  "message": "Server is running",
  "database": "connected",
  "email": "configured"
}
```

## 🎨 Component Architecture

### Frontend Components

- **Navbar**: Responsive navigation with mobile menu
- **Hero**: Landing section with call-to-action buttons
- **Services**: Grid of service offerings with links
- **Portfolio**: Showcase of completed projects
- **Solutions**: Industry-specific solutions
- **About**: Company information
- **Contact**: Contact form with validation and API integration
- **Footer**: Site footer with links and contact info

### Pages

- **Home**: Main landing page with all sections
- **ApplicationDevelopment**: Detailed service page with process, tech stack, and benefits

## 🔒 Security Features

- Environment variable protection
- CORS configuration
- Input validation on contact form
- Email validation
- MongoDB connection error handling
- Secure email transmission

## 📱 Responsive Design

The website is fully responsive and optimized for:
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (320px - 767px)

## 🌐 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Verify your MongoDB credentials in `.env`
- Check if your IP is whitelisted in MongoDB Atlas
- Ensure the cluster URL is correct

### Email Not Sending
- For Gmail, use an App Password instead of your regular password
- Enable "Less secure app access" or use OAuth2
- Verify SMTP settings are correct

### Build Warnings
- Large bundle size warnings are normal for production builds
- Consider code splitting for optimization if needed

## 📄 License

ISC

## 👥 Contact

For support or inquiries:
- Email: support@genvedha.com
- Phone: +1 (555) 123-4567

---

**GenVedha Global AI & Software Solutions**  
*Intelligence. Innovation. Impact.*
