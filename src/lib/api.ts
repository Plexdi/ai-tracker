import { LiftLog, WorkoutPlan } from '../types/types';

export async function saveLiftLog(log: Omit<LiftLog, 'id'>) {
  const response = await fetch('/api/lifts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(log),
  });
  return response.json();
}

export async function getLiftLogs(userId: string) {
  const response = await fetch(`/api/lifts?userId=${userId}`);
  return response.json();
}

export async function getCurrentProgram(userId: string, week: number) {
  const response = await fetch(`/api/program?userId=${userId}&week=${week}`);
  return response.json();
}

export async function generateWorkoutPlan(userId: string, preferences: {
  focus: string;
  experience: string;
  daysPerWeek: number;
}) {
  const response = await fetch('/api/ai/plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, ...preferences }),
  });
  return response.json();
} 