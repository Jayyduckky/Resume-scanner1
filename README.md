# ResumeAI Scanner

ResumeAI Scanner is a professional web application that uses AI to analyze resumes against job descriptions. It helps job seekers optimize their resumes by identifying matches, gaps, and providing intelligent insights.

## Features

- **AI-Powered Resume Analysis**: Compare resumes to job descriptions with advanced natural language processing
- **Custom Queries**: Ask specific questions about a resume (e.g., "What is the candidate's name?")
- **Scan History**: Keep track of all your previous resume scans
- **PRO Subscription**: Premium features for serious job seekers and recruiters

## Project Structure

- `index.html` - Main application page with resume scanner
- `history.html` - View and manage scan history
- `pricing.html` - PRO subscription plans and payment processing
- `/css/styles.css` - Custom styling for the application
- `/js/app.js` - Core application functionality
- `/js/history.js` - History page functionality
- `/js/pricing.js` - Pricing and subscription functionality

## Technologies Used

- HTML5, CSS3, JavaScript (ES6+)
- Bootstrap 5 for responsive design
- Font Awesome for icons
- Local Storage for data persistence (in this demo version)

## Setup and Usage

1. Clone this repository
2. Open `index.html` in your browser
3. Upload a resume (PDF, DOCX, or DOC)
4. Enter a job description
5. Optionally enter a specific query
6. Click "Scan Resume" to analyze

## Payment Integration

This is a demonstration project. In a production environment, you would integrate with a payment processor like:

1. **Stripe**: For credit card processing
   - Sign up for a Stripe account
   - Install the Stripe SDK
   - Replace the demo payment code with Stripe's API calls

2. **PayPal**: For PayPal processing
   - Register for a PayPal Developer account
   - Integrate with PayPal's Checkout SDK
   - Configure webhooks for payment notifications

## Future Enhancements

- Backend integration for AI processing
- User authentication system
- Resume improvement suggestions
- Cover letter generation
- Integration with job boards

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

*This is a demonstration project. In a real-world implementation, you would need to implement proper security measures and backend services.*
