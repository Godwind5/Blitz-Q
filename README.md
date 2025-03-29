# BLITZ-Q

## Overview
This project implements authentication using Google OAuth and integrates with Google's Gemini API for AI functionality.

## Environment Setup

### Prerequisites
- Node.js and npm installed
- A Google Cloud account with OAuth 2.0 credentials
- A Gemini API key

### Environment Variables
Create a `.env` file in the root directory of your project with the following variables:

```
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

# JWT Configuration
JWT_SECRET=your_jwt_secret

# Gemini API
GEMINI_API_KEY=your_gemini_api_key
```

⚠️ **IMPORTANT**: Never commit your `.env` file or API keys to version control. Add `.env` to your `.gitignore` file.

## Authentication Flow
1. Users are redirected to Google for authentication
2. After successful authentication, Google redirects to the callback URL
3. The application creates a JWT for maintaining user sessions

## API Integration
This project integrates with Google's Gemini API for AI functionality. Make sure your API key has the necessary permissions.

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Set up your environment variables as described above
4. Start the development server:
   ```
   npm run dev
   ```
5. Open http://localhost:3000 in your browser
