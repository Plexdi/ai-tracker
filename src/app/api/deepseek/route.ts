import { NextResponse } from 'next/server';
import { Workout } from '@/lib/types';
import { getEnv } from '@/lib/env';

interface WorkoutContext {
  recentWorkouts: Workout[];
  currentPRs: Record<string, number>;
  weeklyVolume: number;
  trainingProgram?: {
    name: string;
    startDate?: string;
    endDate?: string;
    daysPerWeek?: number;
    blocks?: {
      name: string;
      startWeek: number;
      endWeek: number;
      focus: string;
      customFocus?: string;
      workoutDays?: string[];
    }[];
  };
}

function formatWorkoutContext(context?: WorkoutContext): string {
  if (!context) return '';

  const { recentWorkouts, currentPRs, weeklyVolume, trainingProgram } = context;
  
  const prSummary = Object.entries(currentPRs || {})
    .map(([exercise, weight]) => `${exercise}: ${Math.round(weight)}kg`)
    .join(', ');

  const recentWorkoutSummary = (recentWorkouts || [])
    .slice(0, 3)
    .map(w => `${w.exercise}: ${w.weight}${w.unit} × ${w.reps} × ${w.sets}`)
    .join(', ');

  // Format training program if provided
  let trainingProgramContext = '';
  if (trainingProgram) {
    trainingProgramContext = `
Current Training Program: ${trainingProgram.name}
Program Duration: ${trainingProgram.startDate ? new Date(trainingProgram.startDate).toLocaleDateString() : 'Not set'} to ${trainingProgram.endDate ? new Date(trainingProgram.endDate).toLocaleDateString() : 'Not set'}
Days Per Week: ${trainingProgram.daysPerWeek || 'Not set'}
Total Blocks: ${trainingProgram.blocks?.length || 0}

Training Blocks:
${(trainingProgram.blocks || []).map(block => `
  Block: ${block.name}
  Weeks: ${block.startWeek} to ${block.endWeek}
  Focus: ${block.focus}${block.customFocus ? ` (${block.customFocus})` : ''}
  Training Days: ${block.workoutDays?.join(', ') || 'None set'}
`).join('\n')}
`;
  }

  return `
Context:
- Weekly Volume: ${Math.round(weeklyVolume || 0)}kg
- Current PRs: ${prSummary}
- Recent Workouts: ${recentWorkoutSummary}
${trainingProgramContext}
`;
}

export async function POST(request: Request) {
  try {
    // Get DeepSeek API key from server environment
    const apiKey = process.env.DEEPSEEK_API_KEY;
    
    if (!apiKey) {
      console.error('Server error: DEEPSEEK_API_KEY is not set in environment variables');
      return NextResponse.json({ 
        error: 'Missing API key configuration on server',
        content: "I'm having trouble connecting to my AI service. Please contact support."
      }, { status: 500 });
    }
    
    // Get request data
    const { message, workoutContext, mock = false } = await request.json();
    
    if (!message) {
      return NextResponse.json({ 
        error: 'Missing message in request',
        content: "I couldn't understand your message. Please try again."
      }, { status: 400 });
    }
    
    // In development, use mock if requested
    if (process.env.NODE_ENV === 'development' && mock) {
      console.log('Using mock response in development mode');
      const response = await mockDeepseekResponse(message, formatWorkoutContext(workoutContext));
      return NextResponse.json({ content: response });
    }
    
    // Make actual API call
    const response = await callDeepseekAPI(
      message, 
      formatWorkoutContext(workoutContext), 
      apiKey
    );
    
    return NextResponse.json({ content: response });
  } catch (error) {
    console.error('Error in DeepSeek API route:', error);
    let errorMessage = 'An unexpected error occurred';
    let errorType = 'server_error';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      if (error.message.includes('timeout') || error.message.includes('ECONNREFUSED')) {
        errorType = 'connection_timeout';
      } else if (error.message.includes('429') || error.message.includes('rate limit')) {
        errorType = 'rate_limit_exceeded';
      } else if (error.message.includes('401') || error.message.includes('auth')) {
        errorType = 'authentication_failed';
      }
    }
    
    return NextResponse.json({
      error: errorType,
      content: `I'm having trouble processing your request. ${errorMessage}`
    }, { status: 500 });
  }
}

// Implementation of the actual API call to Deepseek
async function callDeepseekAPI(message: string, context: string, apiKey: string): Promise<string> {
  const systemPrompt = `You are an AI fitness coach who helps users with personalized training, recovery, nutrition, and goal-setting advice. But you're also friendly, emotionally intelligent, and open to casual conversation.

You have two core modes:
- ADVISOR: Provide expert, specific answers when users ask for fitness help
- COMPANION: Respond naturally when users want to chat, share feelings, or discuss off-topic subjects

Core guidelines:
- When users ask specific fitness questions, provide detailed, actionable advice
- Ask follow-up questions when you need more information to give personalized guidance
- When users just want to talk, be warm and conversational - not robotic
- Always maintain a supportive, encouraging tone
- Never use phrases like "Here's my response to..." - just speak directly like a real person would

When in ADVISOR mode:
- Provide evidence-based information about training, nutrition, and recovery
- Be specific with recommendations (weights, reps, sets, exercises, meal ideas)
- Acknowledge the user's current fitness level and goals

When in COMPANION mode:
- Be empathetic and emotionally intelligent
- Share appropriate encouragement and motivation
- Maintain a casual, friendly tone
- Keep responses concise and natural

TRAINING PLAN MANAGEMENT:
You can help the user manage their training plan. The user's current training plan data is included in your context if available.

Training Plan Structure:
- Each program has: name, startDate, endDate, daysPerWeek, and blocks
- Each block contains: startWeek, endWeek, focus, workoutDays, and exercises
- Exercise details include: name, sets, reps, RPE, notes

You can perform the following actions when users request them:
1. VIEW their training plan, blocks, and specific workouts
2. SUGGEST modifications to their plan, such as:
   - Adding new training blocks
   - Modifying existing blocks (changing sets/reps/RPE, swapping exercises)
   - Creating complete training programs based on user goals
   - Scheduling workouts for specific days

When suggesting changes:
- Verify that changes don't conflict with the program structure (e.g., adding a week 13 in a 12-week program)
- Provide summaries of your suggested changes
- Consider their current fitness level and training history

Example user requests you should recognize:
- "Can you add a hypertrophy block after week 8?"
- "Replace overhead press with incline dumbbell press on Tuesday."
- "Add 3x10 RDLs at RPE 7 to Friday in week 4."
- "Create a 6-week bench press peaking program based on my current max of 75kg."

When the user asks you to create or modify their training plan, follow these steps:
1. Acknowledge their request
2. Present your suggested changes with exercise specifics
3. End with a clear summary of the changes (e.g., "✅ Added Strength Block from Week 9-12 with Deadlifts, RDLs, and Leg Press.")

${context ? `Use this context about the user's workout history and training plan:\n${context}` : ''}`;
  
  // Retry logic
  let attempts = 0;
  const maxAttempts = 3;
  
  while (attempts < maxAttempts) {
    try {
      const response = await fetch('https://api.deepseek.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ],
          temperature: 0.7,
          max_tokens: 800
        }),
        // 10 second timeout
        signal: AbortSignal.timeout(10000)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API returned ${response.status}: ${JSON.stringify(errorData)}`);
      }
      
      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      attempts++;
      if (attempts >= maxAttempts) {
        throw error;
      }
      
      // Exponential backoff: wait 2^attempts seconds before retrying
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
    }
  }
  
  throw new Error('Maximum retry attempts exceeded');
}

// Mock response function for development
async function mockDeepseekResponse(message: string, context: string): Promise<string> {
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Convert message to lowercase for easier matching
  const lowerMessage = message.toLowerCase();
  
  // COMPANION MODE - Handle casual conversation
  if (lowerMessage.includes('how are you') || lowerMessage.includes('how\'s it going') || lowerMessage.includes('how are things')) {
    return `I'm doing great today, thanks for asking! Always energized and ready to talk fitness or just chat. How are you feeling today? Anything specific on your mind?`;
  }
  
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi ') || lowerMessage.match(/^hi$/) || lowerMessage.includes('hey') || lowerMessage.includes('good morning') || lowerMessage.includes('good afternoon') || lowerMessage.includes('good evening')) {
    return `Hey there! Great to connect with you today. How can I help with your fitness journey? Or if you just want to chat, I'm here for that too.`;
  }
  
  if (lowerMessage.includes('thank') || lowerMessage.includes('appreciate') || lowerMessage.includes('helpful')) {
    return `You're very welcome! I'm always happy to help. Building a fitness journey is better when you've got someone in your corner. Let me know if there's anything else you want to discuss!`;
  }
  
  if (lowerMessage.includes('tired') || lowerMessage.includes('exhausted') || lowerMessage.includes('no energy') || lowerMessage.includes('feeling down') || lowerMessage.includes('stressed')) {
    return `I hear you. Those feelings are totally normal and something we all experience. Sometimes our bodies and minds just need a break. Would you like to talk about recovery strategies or stress management techniques that might help? Or maybe today's just a day to be gentle with yourself.`;
  }
  
  // ADVISOR MODE - Fitness specific topics
  if (lowerMessage.includes('progress')) {
    return `Based on your workout history:${context}\n\nI've analyzed your progress and noticed consistent improvements in your lifts. Your volume has been steadily increasing, which is great. Keep focusing on progressive overload and recovery for continued gains. Is there a specific lift you're most proud of improving?`;
  }

  if (lowerMessage.includes('next workout')) {
    return `For your next session, I recommend focusing on compound movements like squats and deadlifts. Try 4 sets of 5 reps with 2-3 minute rest periods between sets. How does your body feel today - are you well recovered and ready for a challenging workout?`;
  }
  
  // Handle specific fitness goals and questions
  if (lowerMessage.includes('deadlift') || lowerMessage.includes('pull')) {
    // Extract numbers if present (for weight goals)
    const currentWeight = lowerMessage.match(/current(?:\s+max)?\s+is\s+(\d+)/i)?.[1] || '160';
    const targetWeight = lowerMessage.match(/(?:want|goal|target)(?:\s+to)?\s+(?:deadlift|lift|pull)\s+(\d+)/i)?.[1] || '170';
    
    return `To increase your deadlift from ${currentWeight}kg to ${targetWeight}kg, you'll need a structured approach. I recommend an 8-12 week program with:

1. Heavy triples (3 reps) at 85-90% of your max twice weekly
2. Technical work focusing on your setup and pull pattern
3. Accessory exercises for your posterior chain: Romanian deadlifts, good mornings, and hip thrusts
4. Adequate recovery with 48-72 hours between deadlift sessions
5. Proper nutrition with 1.6-2g protein per kg bodyweight

A sample weekly split:
- Monday: Heavy deadlifts 5×3 at 85-90%, accessories
- Wednesday: Upper body/recovery
- Friday: Technique deadlifts 6×2 at 75-80%, accessories
- Weekend: Active recovery

How does that sound? Do you have access to the equipment you'll need?`;
  }
  
  if (lowerMessage.includes('bench') || (lowerMessage.includes('chest') && (lowerMessage.includes('improve') || lowerMessage.includes('grow') || lowerMessage.includes('bigger')))) {
    return `To improve your chest development and bench press performance, focus on these key areas:

1. Training frequency: Hit chest 2-3 times per week with varied rep ranges
2. Form optimization: Ensure proper scapular retraction, arch, and leg drive
3. Progressive overload: Add weight or reps each week systematically
4. Exercise variety: Include flat bench, incline, decline, dumbbell variations, and flies
5. Mind-muscle connection: Focus on feeling the pecs work rather than just moving weight

A balanced chest routine would be:
- Heavy day: 4×5 bench press, 3×8 incline dumbbell press, 3×10 weighted dips
- Volume day: 3×10 bench press, 4×12 cable flies, 3×15 push-ups with 2sec pause
- Accessory work: Face pulls and external rotations for shoulder health

What's your current bench routine looking like? We might be able to make some targeted adjustments.`;
  }
  
  if (lowerMessage.includes('motivation') || lowerMessage.includes('give up') || lowerMessage.includes('can\'t do it') || lowerMessage.includes('struggling')) {
    return `Everyone hits rough patches in their fitness journey - that's completely normal and part of the process. Remember why you started, and try to find joy in the small wins along the way. 

Sometimes it helps to:
- Set smaller, achievable milestones instead of just focusing on the end goal
- Find a workout buddy or community for accountability
- Mix up your routine if things are getting stale
- Track your progress so you can see how far you've come

What part of your fitness routine feels most challenging right now? Maybe we can brainstorm some solutions together.`;
  }
  
  // For any other input, provide a relevant response rather than a generic greeting
  return `I'd love to help with your question about "${message}". To give you the best advice, could you share a bit more about your current fitness level, specific goals, and any limitations you're working with? The more details you provide, the more personalized my guidance can be.`;
} 