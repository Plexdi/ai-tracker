# AI-Tracker Deployment Guide

This guide provides comprehensive instructions for deploying the AI-Tracker application in both development and production environments.

## Prerequisites

- Node.js (v16+)
- npm or yarn
- Firebase account
- DeepSeek API key (for AI assistant functionality)

## Local Development Setup

1. Clone the repository
2. Create a `.env.local` file in the root directory with the following variables:

```
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your-project-id.firebasedatabase.app

# AI Service Keys - Required for the AI Assistant to function properly
DEEPSEEK_API_KEY=your-deepseek-api-key

# Feature Flags
NEXT_PUBLIC_ENABLE_CHATGPT_IMPORT=true
NEXT_PUBLIC_ENABLE_DEEPSEEK_CHAT=true

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. Install dependencies:

```bash
npm install
# or
yarn install
```

4. Start the development server:

```bash
npm run dev
# or
yarn dev
```

## Firebase Setup

### Firebase Realtime Database Rules

To fix the "Index not defined" error and ensure proper data access, you need to update your Firebase Realtime Database rules:

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Realtime Database** in the left sidebar
4. Click on the **Rules** tab
5. Update your rules to include the `.indexOn` rule for messages:

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid",
        
        "messages": {
          ".indexOn": ["createdAt"]
        }
      }
    }
  }
}
```

6. Click **Publish** to save your changes

## Production Deployment (Vercel)

1. Push your code to GitHub
2. Create a new project in Vercel
3. Link your GitHub repository
4. Configure the following environment variables in your Vercel project:

   - All Firebase configuration variables (as listed in .env.local)
   - `DEEPSEEK_API_KEY`
   - `NEXT_PUBLIC_ENABLE_CHATGPT_IMPORT`
   - `NEXT_PUBLIC_ENABLE_DEEPSEEK_CHAT`
   - `NEXT_PUBLIC_APP_URL` (set to your production URL)

5. Deploy your application

## Troubleshooting

### AI Assistant Issues

1. **Missing DEEPSEEK_API_KEY error**:
   - Verify the API key is correctly set in environment variables
   - Restart the development server after adding the key
   - For Vercel deployments, redeploy after updating the variables

2. **Index not defined error**:
   - Ensure you've updated the Firebase Database Rules as specified above
   - The error looks like: `Error: Index not defined, add ".indexOn": "createdAt" for /messages path`

3. **Error fetching messages**:
   - Check that your Firebase Realtime Database rules allow proper user access
   - Verify that you're correctly authenticated before trying to fetch messages

### PlanPage Issues

If you encounter `Cannot read properties of undefined (reading 'length')` errors:
- This typically happens when the program data is being accessed before it's fully loaded
- The application now includes safeguards to handle undefined values
- If issues persist, clear browser cache and local storage

## Regular Maintenance

1. **Update Dependencies**:
   ```bash
   npm update
   # or
   yarn upgrade
   ```

2. **Monitor API Usage**:
   - Keep an eye on your DeepSeek API usage to avoid hitting rate limits
   - Consider implementing a usage tracking system for production

3. **Database Backups**:
   - Regularly backup your Firebase Realtime Database
   - You can automate this using Firebase Admin SDK and scheduled functions 