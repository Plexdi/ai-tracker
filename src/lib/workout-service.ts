import { ref, set, get, onValue, push, query, orderByChild, limitToLast, off } from 'firebase/database';
import { db } from './firebase';
import { Workout } from './types';

export type WorkoutInput = Omit<Workout, 'id' | 'userId' | 'createdAt'>;

export const SUPPORTED_EXERCISES = ['Squat', 'Bench Press', 'Deadlift', 'Overhead Press'] as const;
export type SupportedExercise = typeof SUPPORTED_EXERCISES[number];

export async function createWorkout(
  workout: WorkoutInput,
  userId: string
): Promise<string> {
  if (!userId) {
    throw new Error('User must be authenticated to create workouts');
  }

  // Validate workout data
  if (!workout.exercise?.trim()) throw new Error('Exercise is required');
  if (!workout.weight || workout.weight <= 0) throw new Error('Valid weight is required');
  if (!workout.reps || workout.reps <= 0) throw new Error('Valid reps are required');
  if (!workout.sets || workout.sets <= 0) throw new Error('Valid sets are required');
  if (!workout.date) throw new Error('Date is required');
  if (workout.rpe && (workout.rpe < 1 || workout.rpe > 10)) {
    throw new Error('RPE must be between 1 and 10');
  }

  try {
    const workoutRef = push(ref(db, `workouts/${userId}`));
    const newWorkout = {
      ...workout,
      id: workoutRef.key,
      userId,
      createdAt: new Date().toISOString()
    };
    await set(workoutRef, newWorkout);
    return workoutRef.key!;
  } catch (error) {
    console.error('Error creating workout:', error);
    throw new Error('Failed to create workout');
  }
}

export async function updateWorkout(
  workoutId: string,
  workout: Partial<WorkoutInput>,
  userId: string
): Promise<void> {
  if (!userId || !workoutId) {
    throw new Error('User must be authenticated and workout ID is required');
  }

  try {
    const workoutRef = ref(db, `workouts/${userId}/${workoutId}`);
    const snapshot = await get(workoutRef);
    if (!snapshot.exists()) {
      throw new Error('Workout not found');
    }
    
    await set(workoutRef, {
      ...snapshot.val(),
      ...workout,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating workout:', error);
    throw new Error('Failed to update workout');
  }
}

export async function deleteWorkout(
  workoutId: string,
  userId: string
): Promise<void> {
  if (!userId || !workoutId) {
    throw new Error('User must be authenticated and workout ID is required');
  }

  try {
    const workoutRef = ref(db, `workouts/${userId}/${workoutId}`);
    await set(workoutRef, null);
  } catch (error) {
    console.error('Error deleting workout:', error);
    throw new Error('Failed to delete workout');
  }
}

export function subscribeToWorkouts(
  userId: string,
  callback: (workouts: Record<SupportedExercise, Workout[]>) => void,
  limitCount: number = 10
): () => void {
  if (!userId) {
    callback({} as Record<SupportedExercise, Workout[]>);
    return () => {};
  }

  const workoutsRef = ref(db, `workouts/${userId}`);
  const workoutsQuery = limitCount 
    ? query(workoutsRef, orderByChild('date'), limitToLast(limitCount * SUPPORTED_EXERCISES.length))
    : workoutsRef;

  const listener = onValue(workoutsQuery, (snapshot) => {
    if (!snapshot.exists()) {
      const emptyWorkouts = SUPPORTED_EXERCISES.reduce((acc, exercise) => {
        acc[exercise] = [];
        return acc;
      }, {} as Record<SupportedExercise, Workout[]>);
      callback(emptyWorkouts);
      return;
    }

    const workoutsByExercise: Record<string, Workout[]> = {};
    
    // Initialize arrays for all supported exercises
    SUPPORTED_EXERCISES.forEach(exercise => {
      workoutsByExercise[exercise] = [];
    });

    // Group workouts by exercise
    snapshot.forEach((child) => {
      const workout = child.val() as Workout;
      if (SUPPORTED_EXERCISES.includes(workout.exercise as SupportedExercise)) {
        workoutsByExercise[workout.exercise].push(workout);
      }
    });

    // Sort workouts by date for each exercise
    Object.keys(workoutsByExercise).forEach(exercise => {
      workoutsByExercise[exercise].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      // Limit the number of workouts per exercise if specified
      if (limitCount) {
        workoutsByExercise[exercise] = workoutsByExercise[exercise].slice(0, limitCount);
      }
    });

    callback(workoutsByExercise as Record<SupportedExercise, Workout[]>);
  }, (error) => {
    console.error('Error subscribing to workouts:', error);
    const emptyWorkouts = SUPPORTED_EXERCISES.reduce((acc, exercise) => {
      acc[exercise] = [];
      return acc;
    }, {} as Record<SupportedExercise, Workout[]>);
    callback(emptyWorkouts);
  });

  return () => off(workoutsRef);
}

export async function getRecentWorkouts(
  userId: string,
  days: number = 7,
  exerciseFilter?: string
): Promise<Workout[]> {
  if (!userId) {
    throw new Error('User must be authenticated to fetch workouts');
  }

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  try {
    const workoutsRef = ref(db, `workouts/${userId}`);
    const snapshot = await get(workoutsRef);
    
    if (!snapshot.exists()) {
      return [];
    }

    const workouts: Workout[] = [];
    snapshot.forEach((child) => {
      const workout = child.val() as Workout;
      const workoutDate = new Date(workout.date);
      if (workoutDate >= startDate && (!exerciseFilter || workout.exercise === exerciseFilter)) {
        workouts.push(workout);
      }
    });

    return workouts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    console.error('Error fetching workouts:', error);
    throw new Error('Failed to fetch workouts');
  }
}

export async function getTodayVolume(userId: string): Promise<number> {
  if (!userId) return 0;

  try {
    const today = new Date().toISOString().split('T')[0];
    const workoutsRef = ref(db, `workouts/${userId}`);
    const snapshot = await get(workoutsRef);

    if (!snapshot.exists()) {
      return 0;
    }

    let totalVolume = 0;
    snapshot.forEach((child) => {
      const workout = child.val() as Workout;
      if (workout.date === today) {
        const weight = workout.unit === 'lbs' ? workout.weight * 0.453592 : workout.weight;
        totalVolume += weight * workout.reps * workout.sets;
      }
    });

    return totalVolume;
  } catch (error) {
    console.error('Error calculating volume:', error);
    return 0;
  }
}

export async function getWeeklyVolume(userId: string): Promise<{
  currentWeek: number;
  previousWeek: number;
  percentChange: number;
}> {
  if (!userId) {
    return { currentWeek: 0, previousWeek: 0, percentChange: 0 };
  }

  try {
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const workoutsRef = ref(db, `workouts/${userId}`);
    const snapshot = await get(workoutsRef);

    if (!snapshot.exists()) {
      return { currentWeek: 0, previousWeek: 0, percentChange: 0 };
    }

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgoDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    let currentWeekVolume = 0;
    let previousWeekVolume = 0;

    snapshot.forEach((child) => {
      const workout = child.val() as Workout;
      const workoutDate = new Date(workout.date);
      const weight = workout.unit === 'lbs' ? workout.weight * 0.453592 : workout.weight;
      const volume = weight * workout.reps * workout.sets;

      if (workoutDate >= oneWeekAgo) {
        currentWeekVolume += volume;
      } else if (workoutDate >= twoWeeksAgoDate) {
        previousWeekVolume += volume;
      }
    });

    const percentChange = previousWeekVolume === 0 
      ? 100 
      : ((currentWeekVolume - previousWeekVolume) / previousWeekVolume) * 100;

    return {
      currentWeek: Math.round(currentWeekVolume),
      previousWeek: Math.round(previousWeekVolume),
      percentChange: Math.round(percentChange),
    };
  } catch (error) {
    console.error('Error calculating weekly volume:', error);
    return { currentWeek: 0, previousWeek: 0, percentChange: 0 };
  }
}

export function getPersonalRecords(userId: string): Promise<Record<string, Workout>> {
  if (!userId) return Promise.resolve({});

  return new Promise((resolve, reject) => {
    const workoutsRef = ref(db, `workouts/${userId}`);
    onValue(workoutsRef, (snapshot) => {
      if (!snapshot.exists()) {
        resolve({});
        return;
      }

      const prs: Record<string, Workout> = {};
      snapshot.forEach((child) => {
        const workout = child.val() as Workout;
        const currentPR = prs[workout.exercise];
        const weight = workout.unit === 'lbs' ? workout.weight * 0.453592 : workout.weight;
        // Estimate 1RM using Brzycki formula
        const oneRM = weight * (36 / (37 - workout.reps));
        
        if (!currentPR || oneRM > (currentPR.unit === 'lbs' ? currentPR.weight * 0.453592 : currentPR.weight)) {
          prs[workout.exercise] = workout;
        }
      });

      resolve(prs);
    }, (error) => {
      console.error('Error fetching PRs:', error);
      reject(error);
    });
  });
} 