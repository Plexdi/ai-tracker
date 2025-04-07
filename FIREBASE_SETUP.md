# Firebase Setup Guide

This document provides instructions for properly configuring Firebase for the AI-Tracker application.

## Firebase Realtime Database Rules Setup

To fix the "Index not defined" error for the AI Assistant, you need to update your Firebase Realtime Database rules to include the `.indexOn` for the messages collection:

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. In the left navigation panel, navigate to **Realtime Database**
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

## Environment Variables Setup

Ensure you have the following environment variables set up in your local `.env.local` file and in your Vercel deployment settings:

```
# AI Service Keys - Required for the AI Assistant to function properly
DEEPSEEK_API_KEY=your-deepseek-api-key

# Feature Flags
NEXT_PUBLIC_ENABLE_DEEPSEEK_CHAT=true
```

### Setting up Environment Variables in Vercel

1. Go to your Vercel dashboard
2. Select your project
3. Navigate to **Settings** > **Environment Variables**
4. Add the `DEEPSEEK_API_KEY` variable with your API key
5. Click **Save**
6. Redeploy your application to apply the changes

## Troubleshooting

If you're still experiencing issues with the AI Assistant after updating the Firebase rules and environment variables:

1. **Check your browser console** for any error messages
2. **Clear your browser cache** and reload the page
3. **Verify API key validity** by checking your Deepseek dashboard
4. **Check Firebase logs** for any database access issues
5. **Try reinstalling dependencies** with `npm ci` and restart your development server 