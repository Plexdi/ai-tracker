export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
}

export interface LiftLog {
  id: string;
  userId: string;
  exercise: string;
  weight: number;
  sets: number;
  reps: number;
  rpe: number;
  date: string;
  notes?: string;
}

export interface Exercise {
  name: string;
  sets: number;
  reps: number;
  weight?: number;
  rpe?: number;
}

export interface WorkoutPlan {
  id: string;
  userId: string;
  week: number;
  day: number;
  exercises: Exercise[];
  aiGenerated: boolean;
  created: string;
}

export interface WeeklyProgress {
  date: string;
  maxWeight: number;
  exercise: string;
} 

export interface Message {
  id: string;
  type: 'assistant' | 'user'; // ← Add this
  content: string;
  timestamp: string;
  sessionDate?: string;
}
