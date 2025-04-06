import { create } from 'zustand';
import { User, LiftLog, WorkoutPlan } from '../types/types';

interface AppState {
  currentUser: User | null;
  currentWeek: number;
  liftLogs: LiftLog[];
  workoutPlans: WorkoutPlan[];
  setCurrentUser: (user: User | null) => void;
  setCurrentWeek: (week: number) => void;
  setLiftLogs: (logs: LiftLog[]) => void;
  addLiftLog: (log: LiftLog) => void;
  setWorkoutPlans: (plans: WorkoutPlan[]) => void;
  addWorkoutPlan: (plan: WorkoutPlan) => void;
}

export const useStore = create<AppState>((set) => ({
  currentUser: null,
  currentWeek: 1,
  liftLogs: [],
  workoutPlans: [],
  
  setCurrentUser: (user) => set({ currentUser: user }),
  setCurrentWeek: (week) => set({ currentWeek: week }),
  setLiftLogs: (logs) => set({ liftLogs: logs }),
  addLiftLog: (log) => set((state) => ({ 
    liftLogs: [...state.liftLogs, log] 
  })),
  setWorkoutPlans: (plans) => set({ workoutPlans: plans }),
  addWorkoutPlan: (plan) => set((state) => ({ 
    workoutPlans: [...state.workoutPlans, plan] 
  })),
})); 