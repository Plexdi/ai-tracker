export interface Workout {
  id?: string;
  userId: string;
  exercise: string;
  weight: number;
  unit: 'kg' | 'lbs';
  reps: number;
  sets: number;
  rpe: number;
  date: string;
  notes?: string;
  createdAt: number;
  updatedAt?: number;
}

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  currentPRs: Record<string, number>;
  createdAt: number;
}

export interface ChatGPTImport {
  id?: string;
  userId: string;
  content: string;
  timestamp: string;
  processed: boolean;
  suggestedPlan?: {
    exercises: Array<{
      name: string;
      sets: number;
      reps: number;
      weight?: number;
      notes?: string;
    }>;
    date?: string;
  };
}

export type WeekDay = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export const ALL_WEEK_DAYS: WeekDay[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export type BlockStatus = 'Upcoming' | 'Current' | 'Completed';

export interface ProgramWorkout {
  exercise: string;
  sets: number;
  reps: number;
  rpe?: number;
  notes?: string;
}

export interface WeekSchedule {
  days: Record<WeekDay, ProgramWorkout[]>;
  notes?: string;
}

export type TrainingBlock = {
  id: string;
  name: string;
  startWeek: number;
  endWeek: number;
  focus: 'Volume' | 'Intensity' | 'Peak' | 'Deload' | 'Custom';
  customFocus?: string;
  workoutDays: WeekDay[];
  weeks: Record<number, WeekSchedule>;  // Key is the week number
  notes?: string;
  status: BlockStatus;
  createdAt: number;
  updatedAt: number;
};

export interface Program {
  id: string;
  userId: string;
  name: string;
  blocks: TrainingBlock[];
  createdAt: number;
  updatedAt: number;
  currentBlockId?: string;
} 