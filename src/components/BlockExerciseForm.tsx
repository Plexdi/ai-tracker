import { useState, useEffect } from 'react';
import { WeekDay, ProgramWorkout } from '@/lib/types';
import ModernButton from '@/components/ModernButton';
import { SUPPORTED_EXERCISES, getCustomExercises, CustomExercise } from '@/lib/workout-service';

interface BlockExerciseFormProps {
  day: WeekDay;
  weekNumber: number;
  onAddExercise: (exercise: ProgramWorkout) => Promise<void>;
  onClose: () => void;
  userId: string;
}

export default function BlockExerciseForm({ 
  day, 
  weekNumber, 
  onAddExercise, 
  onClose,
  userId
}: BlockExerciseFormProps) {
  const [formData, setFormData] = useState<ProgramWorkout>({
    exercise: '',
    sets: 3,
    reps: 8,
    rpe: 7,
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
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validate form data
    if (!formData.exercise) {
      setError('Please select an exercise');
      return;
    }
    
    if (formData.sets < 1) {
      setError('Sets must be at least 1');
      return;
    }
    
    if (formData.reps < 1) {
      setError('Reps must be at least 1');
      return;
    }
    
    if (formData.rpe !== undefined && (formData.rpe < 1 || formData.rpe > 10)) {
      setError('RPE must be between 1 and 10');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onAddExercise(formData);
      onClose();
    } catch (error) {
      console.error('Error adding exercise:', error);
      setError('Failed to add exercise. Please try again.');
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
        
        <form onSubmit={handleSubmit}>
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
                value={formData.exercise}
                onChange={(e) => setFormData({ ...formData, exercise: e.target.value })}
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
                  value={formData.sets}
                  onChange={(e) => setFormData({ ...formData, sets: parseInt(e.target.value) })}
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
                  value={formData.reps}
                  onChange={(e) => setFormData({ ...formData, reps: parseInt(e.target.value) })}
                  min="1"
                  required
                />
              </div>
              <div>
                <label htmlFor="rpe" className="block text-sm font-medium text-slate-300 mb-1">
                  RPE
                </label>
                <input
                  type="number"
                  id="rpe"
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.rpe || ''}
                  onChange={(e) => setFormData({ ...formData, rpe: parseInt(e.target.value) })}
                  min="1"
                  max="10"
                  step="0.5"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-slate-300 mb-1">
                Notes (Optional)
              </label>
              <textarea
                id="notes"
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                placeholder="e.g., Pause at bottom, explosive concentric"
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