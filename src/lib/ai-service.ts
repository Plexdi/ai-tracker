import { Workout } from './types';

interface AIResponse {
  content: string;
  error?: string;
}

interface WorkoutContext {
  recentWorkouts: Workout[];
  currentPRs: Record<string, number>;
  weeklyVolume: number;
}

const FALLBACK_RESPONSE = {
  content: "I'm having trouble connecting to the AI service. Please try again in a moment.",
  error: "AI service unavailable"
};

function formatWorkoutContext(context?: WorkoutContext): string {
  if (!context) return '';

  const { recentWorkouts, currentPRs, weeklyVolume } = context;
  
  const prSummary = Object.entries(currentPRs)
    .map(([exercise, weight]) => `${exercise}: ${Math.round(weight)}kg`)
    .join(', ');

  const recentWorkoutSummary = recentWorkouts
    .slice(0, 3)
    .map(w => `${w.exercise}: ${w.weight}${w.unit} × ${w.reps} × ${w.sets}`)
    .join(', ');

  return `
Context:
- Weekly Volume: ${Math.round(weeklyVolume)}kg
- Current PRs: ${prSummary}
- Recent Workouts: ${recentWorkoutSummary}
`;
}

export async function getAIResponse(
  message: string,
  workoutContext?: WorkoutContext
): Promise<AIResponse> {
  if (!process.env.DEEPSEEK_API_KEY) {
    console.error('Missing DEEPSEEK_API_KEY environment variable');
    return FALLBACK_RESPONSE;
  }

  try {
    // TODO: Replace with actual Deepseek API integration
    const contextStr = formatWorkoutContext(workoutContext);
    const response = await mockDeepseekResponse(message, contextStr);
    return { content: response };
  } catch (error) {
    console.error('Error calling AI service:', error);
    return FALLBACK_RESPONSE;
  }
}

// Temporary mock function - to be replaced with actual API call
async function mockDeepseekResponse(message: string, context: string): Promise<string> {
  if (!process.env.NEXT_PUBLIC_ENABLE_DEEPSEEK_CHAT) {
    throw new Error('Deepseek chat is disabled');
  }
  
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Use context to provide more relevant responses
  if (message.toLowerCase().includes('progress')) {
    return `Based on your workout history:${context}\n\nHere's my analysis of your progress...`;
  }

  if (message.toLowerCase().includes('next workout')) {
    return `Looking at your recent workouts:${context}\n\nI recommend the following for your next session...`;
  }

  return `Here's my response to "${message}". I'm your AI fitness coach powered by Deepseek. I can help you with workout planning, form checks, and nutrition advice.`;
} 