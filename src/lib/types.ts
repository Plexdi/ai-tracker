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
  type?: 'user' | 'assistant';
  role?: 'user' | 'assistant';
  timestamp?: string;
  createdAt: number;
  currentPRs?: Record<string, number>;
  sessionDate?: string;
  workoutContext?: {
    recentWorkouts?: Workout[];
    currentPRs?: Record<string, number>;
    weeklyVolume?: number;
  };
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
  intensity: {
    type: 'kg' | 'rpe' | 'percent';
    value: number;
  };
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
  startDate?: number; // timestamp in milliseconds
  endDate?: number; // timestamp in milliseconds
  daysPerWeek?: number;
}

// Split Types
export type SplitTemplateType = 'PPL' | 'Arnold' | 'UpperLower' | 'FullBody' | 'Custom' | 'Combined';

export interface SplitDay {
  name: string;
  focus: string[];
  exercises: ProgramWorkout[];
  programId?: string;
  blockId?: string;
}

export interface Split {
  id: string;
  userId: string;
  name: string;
  daysPerWeek: number;
  template: SplitTemplateType;
  days: SplitDay[];
  createdAt: number;
  updatedAt: number;
  isFavorite?: boolean;
  combinedTemplates?: {
    templates: SplitTemplateType[];
    daysPerTemplate: number[];
  };
} 