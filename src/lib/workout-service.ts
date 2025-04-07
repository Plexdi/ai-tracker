import { getDatabase, ref, push, set, get, onValue, query, orderByChild, limitToLast, off, remove, update } from 'firebase/database';
import app from './firebase';
import { Workout } from './types';

// Initialize Realtime Database
const db = getDatabase(app);

export type WorkoutInput = Omit<Workout, 'id' | 'userId' | 'createdAt'>;

// Updated to include only SBD lifts
export const SUPPORTED_EXERCISES = ['Squat', 'Bench Press', 'Deadlift'] as const;
export const MUSCLE_GROUPS = [
  'Chest', 
  'Back', 
  'Legs', 
  'Quadriceps', 
  'Hamstrings',
  'Glutes',
  'Calves',
  'Shoulders',
  'Front Delts',
  'Side Delts',
  'Rear Delts',
  'Arms',
  'Biceps',
  'Triceps',
  'Forearms',
  'Core',
  'Abs',
  'Obliques',
  'Lower Back',
  'Full Body',
  'Other'
] as const;

export type SupportedExercise = typeof SUPPORTED_EXERCISES[number];
export type MuscleGroup = typeof MUSCLE_GROUPS[number];

export interface CustomExercise {
  id?: string;
  name: string;
  muscleGroup: MuscleGroup;
  createdAt: number;
  userId: string;
  workingWeight?: number;
  workingWeightUnit?: 'kg' | 'lbs';
}

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
      createdAt: Date.now()
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
      updatedAt: Date.now()
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

export async function saveCustomExercise(
  userId: string,
  exerciseName: string,
  muscleGroup: MuscleGroup,
  workingWeight?: number,
  workingWeightUnit?: 'kg' | 'lbs'
): Promise<string> {
  if (!userId) {
    throw new Error('User must be authenticated to save custom exercises');
  }

  if (!exerciseName.trim()) {
    throw new Error('Exercise name is required');
  }

  try {
    const exerciseRef = push(ref(db, `customExercises/${userId}`));
    const newExercise: CustomExercise = {
      id: exerciseRef.key!,
      name: exerciseName.trim(),
      muscleGroup,
      createdAt: Date.now(),
      userId
    };
    
    // Add working weight if provided
    if (workingWeight && workingWeight > 0 && workingWeightUnit) {
      newExercise.workingWeight = workingWeight;
      newExercise.workingWeightUnit = workingWeightUnit;
    }
    
    await set(exerciseRef, newExercise);
    return exerciseRef.key!;
  } catch (error) {
    console.error('Error saving custom exercise:', error);
    throw new Error('Failed to save custom exercise');
  }
}

export async function getCustomExercises(userId: string): Promise<CustomExercise[]> {
  if (!userId) {
    return [];
  }

  try {
    const exercisesRef = ref(db, `customExercises/${userId}`);
    const snapshot = await get(exercisesRef);
    
    if (!snapshot.exists()) {
      return [];
    }

    const exercises: CustomExercise[] = [];
    snapshot.forEach((child) => {
      exercises.push(child.val() as CustomExercise);
    });

    return exercises.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error('Error fetching custom exercises:', error);
    return [];
  }
}

export async function deleteCustomExercise(userId: string, exerciseId: string): Promise<void> {
  if (!userId || !exerciseId) {
    throw new Error('Invalid user or exercise ID');
  }

  try {
    const exerciseRef = ref(db, `customExercises/${userId}/${exerciseId}`);
    await remove(exerciseRef);
  } catch (error) {
    console.error('Error deleting custom exercise:', error);
    throw new Error('Failed to delete custom exercise');
  }
}

export async function getExerciseCount(userId: string): Promise<Record<string, number>> {
  if (!userId) {
    return {};
  }

  try {
    const workoutsRef = ref(db, `workouts/${userId}`);
    const snapshot = await get(workoutsRef);
    
    if (!snapshot.exists()) {
      return {};
    }

    const exerciseCounts: Record<string, number> = {};
    
    snapshot.forEach((child) => {
      const workout = child.val() as Workout;
      if (workout.exercise) {
        exerciseCounts[workout.exercise] = (exerciseCounts[workout.exercise] || 0) + 1;
      }
    });
    
    return exerciseCounts;
  } catch (error) {
    console.error('Error getting exercise counts:', error);
    return {};
  }
}

export async function updateExerciseDetails(
  userId: string, 
  exerciseId: string, 
  newName: string,
  newMuscleGroup: MuscleGroup,
  isDefaultExercise: boolean,
  workingWeight?: number,
  workingWeightUnit?: 'kg' | 'lbs'
): Promise<void> {
  if (!userId || !exerciseId || !newName.trim() || !newMuscleGroup) {
    throw new Error('Missing required fields for updating exercise');
  }

  try {
    // First update any workout entries with the old exercise name
    const workoutsRef = ref(db, `workouts/${userId}`);
    const workoutsSnapshot = await get(workoutsRef);
    
    if (workoutsSnapshot.exists()) {
      const updates: Record<string, any> = {};
      let oldExerciseName = '';
      
      if (isDefaultExercise) {
        // For default exercises, the exerciseId is the same as the name
        oldExerciseName = exerciseId;
      } else {
        // For custom exercises, get the old name from the custom exercise entry
        const exerciseRef = ref(db, `customExercises/${userId}/${exerciseId}`);
        const exerciseSnapshot = await get(exerciseRef);
        
        if (exerciseSnapshot.exists()) {
          oldExerciseName = exerciseSnapshot.val().name;
          
          // Update the custom exercise entry
          updates[`customExercises/${userId}/${exerciseId}/name`] = newName;
          updates[`customExercises/${userId}/${exerciseId}/muscleGroup`] = newMuscleGroup;
          
          // Add working weight updates if provided
          if (workingWeight && workingWeight > 0 && workingWeightUnit) {
            updates[`customExercises/${userId}/${exerciseId}/workingWeight`] = workingWeight;
            updates[`customExercises/${userId}/${exerciseId}/workingWeightUnit`] = workingWeightUnit;
          }
        } else {
          throw new Error('Exercise not found');
        }
      }
      
      // Update all workouts that use this exercise name
      workoutsSnapshot.forEach((childSnapshot) => {
        const workout = childSnapshot.val();
        if (workout.exercise === oldExerciseName) {
          updates[`workouts/${userId}/${childSnapshot.key}/exercise`] = newName;
        }
      });
      
      // Apply all updates in a single transaction
      if (Object.keys(updates).length > 0) {
        await update(ref(db), updates);
      }
    }
    
    return;
  } catch (error) {
    console.error('Error updating exercise:', error);
    throw new Error('Failed to update exercise');
  }
}

export async function exerciseNameExists(
  userId: string,
  exerciseName: string,
  excludeExerciseId?: string
): Promise<boolean> {
  if (!userId || !exerciseName.trim()) {
    return false;
  }

  // Check if it's a default exercise
  if (SUPPORTED_EXERCISES.includes(exerciseName as SupportedExercise) && 
      exerciseName !== excludeExerciseId) {
    return true;
  }

  try {
    const exercisesRef = ref(db, `customExercises/${userId}`);
    const snapshot = await get(exercisesRef);
    
    if (!snapshot.exists()) {
      return false;
    }

    let exists = false;
    snapshot.forEach((child) => {
      const exercise = child.val() as CustomExercise;
      // Skip the exercise being edited
      if (exercise.id === excludeExerciseId) {
        return;
      }
      
      if (exercise.name.toLowerCase() === exerciseName.trim().toLowerCase()) {
        exists = true;
        return true; // Break the forEach loop
      }
    });

    return exists;
  } catch (error) {
    console.error('Error checking exercise name:', error);
    return false;
  }
}

export async function getExerciseHistory(
  userId: string,
  exerciseName: string
): Promise<Workout[]> {
  if (!userId || !exerciseName) {
    return [];
  }

  try {
    const workoutsRef = ref(db, `workouts/${userId}`);
    const snapshot = await get(workoutsRef);
    
    if (!snapshot.exists()) {
      return [];
    }

    const workouts: Workout[] = [];
    snapshot.forEach((child) => {
      const workout = child.val() as Workout;
      if (workout.exercise === exerciseName) {
        workouts.push(workout);
      }
    });

    // Sort by date (newest first)
    return workouts.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  } catch (error) {
    console.error('Error fetching exercise history:', error);
    return [];
  }
}

export async function updateWorkingWeight(
  userId: string,
  exerciseId: string,
  workingWeight: number,
  workingWeightUnit: 'kg' | 'lbs'
): Promise<void> {
  if (!userId || !exerciseId) {
    throw new Error('User must be authenticated and exercise ID is required');
  }

  if (workingWeight <= 0) {
    throw new Error('Working weight must be greater than zero');
  }

  try {
    const exerciseRef = ref(db, `customExercises/${userId}/${exerciseId}`);
    const snapshot = await get(exerciseRef);
    
    if (!snapshot.exists()) {
      throw new Error('Exercise not found');
    }
    
    await update(exerciseRef, {
      workingWeight,
      workingWeightUnit
    });
  } catch (error) {
    console.error('Error updating working weight:', error);
    throw new Error('Failed to update working weight');
  }
} 