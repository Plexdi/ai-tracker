import { useState, useEffect } from 'react';
import { WeekDay, ProgramWorkout, WeekSchedule, ALL_WEEK_DAYS } from '@/lib/types';
import ModernButton from '@/components/ModernButton';
import { SUPPORTED_EXERCISES, getCustomExercises, CustomExercise } from '@/lib/workout-service';
import { toast } from 'react-hot-toast';
import { updateWeekWorkouts } from '@/lib/program-service';

interface BlockExerciseFormProps {
  day: WeekDay;
  weekNumber: number;
  onAddExercise: (exercise: ProgramWorkout) => Promise<void>;
  onClose: () => void;
  userId: string;
  selectedBlockId: string;
  selectedDay: WeekDay;
  selectedWeek: number;
  program: any; // TODO: Add proper type
  currentUser: any; // TODO: Add proper type
}

const validateWorkoutForm = (data: ProgramWorkout): string | null => {
  if (!data.exercise.trim()) {
    return 'Exercise is required';
  }
  if (data.sets < 1) {
    return 'Sets must be at least 1';
  }
  if (data.reps < 1) {
    return 'Reps must be at least 1';
  }
  if (data.intensity.type === 'rpe' && (data.intensity.value < 1 || data.intensity.value > 10)) {
    return 'RPE must be between 1 and 10';
  }
  return null;
};

export default function BlockExerciseForm({ 
  day, 
  weekNumber, 
  onAddExercise, 
  onClose,
  userId,
  selectedBlockId,
  selectedDay,
  selectedWeek,
  program,
  currentUser
}: BlockExerciseFormProps) {
  const [workoutFormData, setWorkoutFormData] = useState<ProgramWorkout>({
    exercise: SUPPORTED_EXERCISES[0],
    sets: 3,
    reps: 8,
    intensity: {
      type: 'rpe',
      value: 7
    }
  });
  
  const [customExercises, setCustomExercises] = useState<CustomExercise[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCustomExercises, setShowCustomExercises] = useState(false);
  
  // Fetch custom exercises when component mounts
  useEffect(() => {
    const fetchCustomExercises = async () => {
      if (userId) {
        try {
          const exercises = await getCustomExercises(userId);
          setCustomExercises(exercises);
        } catch (error) {
          console.error('Error fetching custom exercises:', error);
        }
      }
    };
    
    fetchCustomExercises();
  }, [userId]);
  
  // All available exercises (default + custom)
  const allExercises = [
    ...SUPPORTED_EXERCISES,
    ...customExercises.map(ex => ex.name)
  ];
  
  const handleAddWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBlockId || !selectedDay || !program || selectedWeek === null || !currentUser?.id) {
      toast.error('Unable to add workout: Missing required information');
      return;
    }

    const validationError = validateWorkoutForm(workoutFormData);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      const block = program.blocks?.find((b: any) => b.id === selectedBlockId);
      if (!block) {
        toast.error('Block not found');
        return;
      }

      // Ensure the week exists and has a valid structure
      const weekSchedule = block.weeks?.[selectedWeek] || {
        days: ALL_WEEK_DAYS.reduce((acc: Record<WeekDay, ProgramWorkout[]>, day: WeekDay) => {
          acc[day] = [];
          return acc;
        }, {} as Record<WeekDay, ProgramWorkout[]>),
        notes: ''
      };

      const updatedWeekSchedule: WeekSchedule = {
        ...weekSchedule,
        days: {
          ...weekSchedule.days,
          [selectedDay]: [...(weekSchedule.days?.[selectedDay] || []), workoutFormData]
        }
      };

      await updateWeekWorkouts(currentUser.id, program.id, selectedBlockId, selectedWeek, updatedWeekSchedule);
      onClose();
      setWorkoutFormData({
        exercise: SUPPORTED_EXERCISES[0],
        sets: 3,
        reps: 8,
        intensity: {
          type: 'rpe',
          value: 7
        }
      });
      toast.success('Workout added successfully!');
    } catch (error) {
      console.error('Failed to add workout:', error);
      toast.error('Failed to add workout');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md p-6 shadow-xl">
        <h2 className="text-xl font-bold text-white mb-4">
          Add Exercise - {day} (Week {weekNumber})
        </h2>
        
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-2 rounded-lg mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleAddWorkout}>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="exercise" className="block text-sm font-medium text-slate-300">
                  Exercise
                </label>
                <button
                  type="button"
                  onClick={() => setShowCustomExercises(!showCustomExercises)}
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  {showCustomExercises ? 'Show Default Exercises' : 'Show Custom Exercises'}
                </button>
              </div>
              <select
                id="exercise"
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={workoutFormData.exercise}
                onChange={(e) => setWorkoutFormData({ ...workoutFormData, exercise: e.target.value })}
                required
              >
                <option value="">Select an exercise</option>
                {showCustomExercises ? (
                  customExercises.map((exercise) => (
                    <option key={exercise.id} value={exercise.name}>
                      {exercise.name}
                    </option>
                  ))
                ) : (
                  SUPPORTED_EXERCISES.map((exercise) => (
                    <option key={exercise} value={exercise}>
                      {exercise}
                    </option>
                  ))
                )}
              </select>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label htmlFor="sets" className="block text-sm font-medium text-slate-300 mb-1">
                  Sets
                </label>
                <input
                  type="number"
                  id="sets"
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={workoutFormData.sets}
                  onChange={(e) => setWorkoutFormData({ ...workoutFormData, sets: parseInt(e.target.value) })}
                  min="1"
                  required
                />
              </div>
              <div>
                <label htmlFor="reps" className="block text-sm font-medium text-slate-300 mb-1">
                  Reps
                </label>
                <input
                  type="number"
                  id="reps"
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={workoutFormData.reps}
                  onChange={(e) => setWorkoutFormData({ ...workoutFormData, reps: parseInt(e.target.value) })}
                  min="1"
                  required
                />
              </div>
              <div>
                <label htmlFor="intensity" className="block text-sm font-medium text-slate-300 mb-1">
                  Intensity
                </label>
                <div className="flex space-x-1">
                  <select
                    id="intensityType"
                    className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-l-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={workoutFormData.intensity.type}
                    onChange={(e) => setWorkoutFormData({ 
                      ...workoutFormData, 
                      intensity: { 
                        ...workoutFormData.intensity, 
                        type: e.target.value as 'kg' | 'rpe' | 'percent' 
                      } 
                    })}
                  >
                    <option value="kg">KG</option>
                    <option value="rpe">RPE</option>
                    <option value="percent">%</option>
                  </select>
                  <input
                    type="number"
                    id="intensityValue"
                    className="w-20 px-4 py-2 bg-slate-800 border border-slate-700 rounded-r-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={workoutFormData.intensity.value}
                    onChange={(e) => setWorkoutFormData({ 
                      ...workoutFormData, 
                      intensity: { 
                        ...workoutFormData.intensity, 
                        value: parseFloat(e.target.value) 
                      } 
                    })}
                    min="0"
                    max={workoutFormData.intensity.type === 'rpe' ? 10 : 1000}
                    step={workoutFormData.intensity.type === 'percent' ? 1 : 0.5}
                  />
                </div>
              </div>
            </div>
            
            <div>
              <label htmlFor="workoutNotes" className="block text-sm font-medium text-slate-300 mb-1">
                Notes (Optional)
              </label>
              <textarea
                id="workoutNotes"
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={workoutFormData.notes || ''}
                onChange={(e) => setWorkoutFormData({ ...workoutFormData, notes: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <ModernButton
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </ModernButton>
            <ModernButton
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
            >
              Add Exercise
            </ModernButton>
          </div>
        </form>
      </div>
    </div>
  );
} 