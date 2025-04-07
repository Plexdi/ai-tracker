// A helper file to safely access environment variables
// and provide fallbacks or throw meaningful errors

export const getEnv = {
  // Feature flags (public)
  enableChatGptImport: () => process.env.NEXT_PUBLIC_ENABLE_CHATGPT_IMPORT === 'true',
  enableDeepseekChat: () => process.env.NEXT_PUBLIC_ENABLE_DEEPSEEK_CHAT === 'true',
  
  // App configuration
  appUrl: () => process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  
  // Helper to check if we're in development mode
  isDev: () => process.env.NODE_ENV === 'development',
  
  // Firebase configuration
  firebase: {
    apiKey: () => process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
    authDomain: () => process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
    projectId: () => process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
    storageBucket: () => process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: () => process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: () => process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
    databaseUrl: () => process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || '',
  }
}; 