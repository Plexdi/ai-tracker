import { useState, useEffect } from 'react';
import { Workout } from '@/lib/types';
import { subscribeToWorkouts, getPersonalRecords, SUPPORTED_EXERCISES, SupportedExercise } from '@/lib/workout-service';
import { useStore } from '@/lib/zustandStore';

interface UseWorkoutsOptions {
  exerciseFilter?: string;
  limitCount?: number;
}

export function useWorkouts(options: UseWorkoutsOptions = {}) {
  const { exerciseFilter, limitCount } = options;
  const currentUser = useStore((state) => state.currentUser);
  const [workouts, setWorkouts] = useState<Record<SupportedExercise, Workout[]>>({} as Record<SupportedExercise, Workout[]>);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser?.id) {
      setWorkouts({} as Record<SupportedExercise, Workout[]>);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToWorkouts(
      currentUser.id,
      (newWorkouts) => {
        if (exerciseFilter) {
          // If exercise filter is provided, only return workouts for that exercise
          setWorkouts({ 
            ...newWorkouts,
            [exerciseFilter]: newWorkouts[exerciseFilter as SupportedExercise] || [] 
          });
        } else {
          setWorkouts(newWorkouts);
        }
        setLoading(false);
      },
      limitCount
    );

    return () => {
      unsubscribe();
    };
  }, [currentUser?.id, exerciseFilter, limitCount]);

  return { workouts, loading, error };
}

export function useWorkoutsByExercise() {
  const { workouts, loading, error } = useWorkouts();
  return { workouts, loading, error };
}

export function usePersonalRecords() {
  const currentUser = useStore((state) => state.currentUser);
  const [personalRecords, setPersonalRecords] = useState<Record<string, Workout>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser?.id) {
      setPersonalRecords({});
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    getPersonalRecords(currentUser.id)
      .then((records) => {
        setPersonalRecords(records);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching personal records:', err);
        setError('Failed to load personal records');
        setLoading(false);
      });
  }, [currentUser?.id]);

  return { personalRecords, loading, error };
}

export function useWorkoutVolume(days: number = 7) {
  const { workouts, loading, error } = useWorkouts();
  const [volume, setVolume] = useState<{
    current: number;
    previous: number;
    percentChange: number;
  }>({
    current: 0,
    previous: 0,
    percentChange: 0,
  });

  useEffect(() => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - (days * 2) * 24 * 60 * 60 * 1000);

    let currentVolume = 0;
    let previousVolume = 0;

    // Calculate volume across all exercises
    Object.values(workouts).flat().forEach(workout => {
      const workoutDate = new Date(workout.date);
      const weight = workout.unit === 'lbs' ? workout.weight * 0.453592 : workout.weight;
      const workoutVolume = weight * workout.reps * workout.sets;

      if (workoutDate >= oneWeekAgo) {
        currentVolume += workoutVolume;
      } else if (workoutDate >= twoWeeksAgo) {
        previousVolume += workoutVolume;
      }
    });

    const percentChange = previousVolume === 0 
      ? 100 
      : ((currentVolume - previousVolume) / previousVolume) * 100;

    setVolume({
      current: Math.round(currentVolume),
      previous: Math.round(previousVolume),
      percentChange: Math.round(percentChange),
    });
  }, [workouts, days]);

  return { volume, loading, error };
} 