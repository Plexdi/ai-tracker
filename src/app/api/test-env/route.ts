import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check for DeepSeek API key
    const hasDeepseekKey = !!process.env.DEEPSEEK_API_KEY;
    
    // Only show the first few characters of the key if it exists (for security)
    const keyPreview = hasDeepseekKey 
      ? `${process.env.DEEPSEEK_API_KEY?.substring(0, 7)}...` 
      : 'not found';
    
    // Check other environment variables
    const env = {
      NODE_ENV: process.env.NODE_ENV || 'not set',
      hasDeepseekKey,
      keyPreview,
      envFileLoaded: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      enableDeepseekChat: process.env.NEXT_PUBLIC_ENABLE_DEEPSEEK_CHAT === 'true',
    };
    
    return NextResponse.json({
      status: 'success',
      message: hasDeepseekKey 
        ? 'DeepSeek API key is properly configured' 
        : 'DeepSeek API key is missing',
      env
    }, { status: hasDeepseekKey ? 200 : 500 });
  } catch (error) {
    console.error('Error in test-env route:', error);
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
} 