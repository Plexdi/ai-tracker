import { Workout } from './types';
import { getEnv } from './env';

interface AIResponse {
  content: string;
  error?: string;
}

interface WorkoutContext {
  recentWorkouts: Workout[];
  currentPRs: Record<string, number>;
  weeklyVolume: number;
  trainingProgram?: {
    userId: string;
    details?: any;
    [key: string]: any;
  };
}

interface TrainingPlanAction {
  action: 'fetch' | 'create_program' | 'add_block' | 'update_block' | 'add_exercise' | 'remove_exercise' | 'modify_exercise';
  userId: string;
  programId?: string;
  data?: any;
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
  if (!getEnv.enableDeepseekChat()) {
    console.warn('Deepseek chat is disabled via environment variable');
    return {
      content: "The AI chat feature is currently disabled by the administrator.",
      error: "Deepseek chat is disabled"
    };
  }

  try {
    // If we have a user ID, fetch their current training program
    const userId = workoutContext?.trainingProgram?.userId;
    if (userId && workoutContext && !workoutContext.trainingProgram?.details) {
      try {
        const trainingProgramData = await fetchTrainingPlan(userId);
        if (trainingProgramData) {
          // Update context with training program data
          workoutContext = {
            ...workoutContext,
            trainingProgram: {
              userId,
              ...workoutContext.trainingProgram,
              details: trainingProgramData
            }
          };
        }
      } catch (error) {
        console.error('Error fetching training plan:', error);
        // Continue even if we can't fetch the training plan
      }
    }
    
    // Use the new server-side API route
    const response = await fetch('/api/deepseek', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        workoutContext,
        // For development, we can use mock responses
        mock: getEnv.isDev() && !process.env.FORCE_API_CALLS
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (errorData.error === 'Missing API key configuration on server') {
        console.error('Missing DEEPSEEK_API_KEY environment variable on the server');
        return {
          content: "I'm currently unavailable because my API key is not configured. Please contact support.",
          error: "Missing DEEPSEEK_API_KEY environment variable"
        };
      }
      throw new Error(`API returned ${response.status}: ${JSON.stringify(errorData)}`);
    }
    
    const data = await response.json();
    return { content: data.content };
  } catch (error) {
    console.error('Error calling AI service:', error);
    
    // Provide more specific error messages based on the error type
    if (error instanceof Error) {
      if (error.message.includes('timeout') || error.message.includes('ECONNREFUSED')) {
        return {
          content: "I'm having trouble connecting to my AI service right now. Please try again in a moment.",
          error: "Connection timeout"
        };
      }
      
      if (error.message.includes('429') || error.message.includes('rate limit')) {
        return {
          content: "I've reached my rate limit. Please try again in a few minutes.",
          error: "Rate limit exceeded"
        };
      }
      
      if (error.message.includes('401') || error.message.includes('auth')) {
        return {
          content: "There's an issue with my authentication. Please contact support.",
          error: "Authentication failed"
        };
      }
    }
    
    return FALLBACK_RESPONSE;
  }
}

// Function to fetch the user's current training plan
export async function fetchTrainingPlan(userId: string): Promise<any> {
  try {
    const response = await fetch('/api/training-plan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'fetch',
        userId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API returned ${response.status}: ${JSON.stringify(errorData)}`);
    }
    
    const data = await response.json();
    return data.program;
  } catch (error) {
    console.error('Error fetching training plan:', error);
    throw error;
  }
}

// Function to create a new training program
export async function createTrainingProgram(
  userId: string, 
  name: string, 
  startDate?: number, 
  daysPerWeek?: number, 
  initialBlock?: any
): Promise<any> {
  try {
    const response = await fetch('/api/training-plan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'create_program',
        userId,
        data: {
          name,
          startDate,
          daysPerWeek,
          initialBlock
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API returned ${response.status}: ${JSON.stringify(errorData)}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating training program:', error);
    throw error;
  }
}

// Function to add a training block to an existing program
export async function addTrainingBlock(
  userId: string,
  programId: string,
  blockData: any
): Promise<any> {
  try {
    const response = await fetch('/api/training-plan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'add_block',
        userId,
        programId,
        data: blockData
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API returned ${response.status}: ${JSON.stringify(errorData)}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error adding training block:', error);
    throw error;
  }
}

// Function to add an exercise to a training program
export async function addExerciseToProgram(
  userId: string,
  programId: string,
  blockId: string,
  weekNumber: number,
  day: string,
  exercise: string,
  sets: number,
  reps: number,
  rpe?: number,
  notes?: string
): Promise<any> {
  try {
    const response = await fetch('/api/training-plan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'add_exercise',
        userId,
        programId,
        data: {
          blockId,
          weekNumber,
          day,
          exercise,
          sets,
          reps,
          rpe,
          notes
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API returned ${response.status}: ${JSON.stringify(errorData)}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error adding exercise to program:', error);
    throw error;
  }
}

// Function to modify an existing exercise in a training program
export async function modifyExerciseInProgram(
  userId: string,
  programId: string,
  blockId: string,
  weekNumber: number,
  day: string,
  exerciseIndex: number,
  updates: any
): Promise<any> {
  try {
    const response = await fetch('/api/training-plan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'modify_exercise',
        userId,
        programId,
        data: {
          blockId,
          weekNumber,
          day,
          exerciseIndex,
          ...updates
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API returned ${response.status}: ${JSON.stringify(errorData)}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error modifying exercise in program:', error);
    throw error;
  }
} 