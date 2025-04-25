import { useState, useEffect } from 'react';
import ModernButton from './ModernButton';
import { SplitDay, ProgramWorkout } from '@/lib/types';
import { getCustomExercises, SUPPORTED_EXERCISES } from '@/lib/workout-service';

interface EditSplitDayModalProps {
  isOpen: boolean;
  onClose: () => void;
  day: SplitDay;
  dayIndex: number;
  userId: string;
  onUpdateDay: (dayIndex: number, updates: Partial<SplitDay>) => Promise<void>;
}

// Common muscle group options for focus selection
const MUSCLE_GROUPS = [
  'Chest',
  'Back',
  'Shoulders',
  'Biceps',
  'Triceps',
  'Forearms',
  'Quads',
  'Hamstrings',
  'Glutes',
  'Calves',
  'Core',
  'Full Body'
];

export default function EditSplitDayModal({ 
  isOpen, 
  onClose, 
  day, 
  dayIndex,
  userId,
  onUpdateDay 
}: EditSplitDayModalProps) {
  const [name, setName] = useState<string>(day.name);
  const [focus, setFocus] = useState<string[]>(day.focus);
  const [exercises, setExercises] = useState<ProgramWorkout[]>(day.exercises || []);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [newFocus, setNewFocus] = useState<string>('');
  
  // Exercise form state
  const [newExercise, setNewExercise] = useState<{
    name: string;
    sets: number;
    reps: number;
    rpe?: number;
  }>({
    name: '',
    sets: 3,
    reps: 8,
    rpe: 7
  });
  const [customExercises, setCustomExercises] = useState<string[]>([]);
  const [isLoadingExercises, setIsLoadingExercises] = useState<boolean>(false);

  // Load custom exercises
  useEffect(() => {
    const loadCustomExercises = async () => {
      try {
        setIsLoadingExercises(true);
        const exercises = await getCustomExercises(userId);
        setCustomExercises(exercises.map(e => e.name));
      } catch (error) {
        console.error('Error loading custom exercises:', error);
      } finally {
        setIsLoadingExercises(false);
      }
    };
    
    if (isOpen) {
      loadCustomExercises();
    }
  }, [isOpen, userId]);

  // Reset form when modal is opened with a different day
  useEffect(() => {
    if (isOpen) {
      setName(day.name);
      setFocus(day.focus);
      setExercises(day.exercises || []);
      setError(null);
    }
  }, [isOpen, day]);

  const handleClose = () => {
    onClose();
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Day name is required');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      
      await onUpdateDay(dayIndex, {
        name,
        focus,
        exercises
      });
      
      handleClose();
    } catch (error) {
      console.error('Error updating split day:', error);
      setError('Failed to update day. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddFocus = () => {
    if (newFocus && !focus.includes(newFocus)) {
      setFocus([...focus, newFocus]);
      setNewFocus('');
    }
  };

  const handleRemoveFocus = (index: number) => {
    const newFocusList = [...focus];
    newFocusList.splice(index, 1);
    setFocus(newFocusList);
  };

  const handleAddExercise = () => {
    if (!newExercise.name.trim()) {
      setError('Exercise name is required');
      return;
    }

    const exercise: ProgramWorkout = {
      exercise: newExercise.name,
      sets: newExercise.sets,
      reps: newExercise.reps,
      rpe: newExercise.rpe
    };

    setExercises([...exercises, exercise]);
    setNewExercise({
      name: '',
      sets: 3,
      reps: 8,
      rpe: 7
    });
    setError(null);
  };

  const handleRemoveExercise = (index: number) => {
    const newExercises = [...exercises];
    newExercises.splice(index, 1);
    setExercises(newExercises);
  };

  const handleUpdateExercise = (index: number, updates: Partial<ProgramWorkout>) => {
    const newExercises = [...exercises];
    newExercises[index] = {
      ...newExercises[index],
      ...updates
    };
    setExercises(newExercises);
  };

  // If modal is not open, don't render anything
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/70">
      <div className="bg-slate-900 rounded-lg border border-slate-800 w-full max-w-md max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center border-b border-slate-800 p-4">
          <h2 className="text-lg font-semibold text-white">Edit Day {dayIndex + 1}</h2>
          <button 
            onClick={handleClose}
            className="p-1 rounded-md text-slate-400 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 130px)' }}>
          <div className="space-y-4">
            {/* Day Name */}
            <div>
              <label htmlFor="day-name" className="block text-sm font-medium text-white mb-1">
                Day Name
              </label>
              <input
                id="day-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800/80 text-white p-2.5
                          focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Push Day, Upper Body, Leg Day"
              />
            </div>
            
            {/* Training Focus */}
            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Training Focus
              </label>
              
              <div className="flex flex-wrap gap-2 mb-2">
                {focus.length > 0 ? (
                  focus.map((item, index) => (
                    <div 
                      key={index} 
                      className="bg-blue-900/30 text-blue-200 text-sm px-2 py-1 rounded-lg flex items-center"
                    >
                      {item}
                      <button 
                        type="button"
                        onClick={() => handleRemoveFocus(index)}
                        className="ml-1 text-blue-300 hover:text-white"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-slate-400">No focus areas selected</div>
                )}
              </div>
              
              <div className="flex mt-2">
                <select
                  value={newFocus}
                  onChange={(e) => setNewFocus(e.target.value)}
                  className="flex-1 rounded-l-lg border border-slate-700 bg-slate-800/80 text-white p-2.5
                            focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a muscle group</option>
                  {MUSCLE_GROUPS.map((group) => (
                    <option key={group} value={group}>{group}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleAddFocus}
                  disabled={!newFocus}
                  className="bg-blue-600 text-white rounded-r-lg px-3 py-2 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-400"
                >
                  Add
                </button>
              </div>
            </div>
            
            {/* Exercises */}
            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Exercises
              </label>
              
              <div className="space-y-2 mb-4">
                {exercises.map((exercise, index) => (
                  <div 
                    key={index}
                    className="bg-slate-800/60 p-3 rounded-lg border border-slate-700"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={exercise.exercise}
                          onChange={(e) => handleUpdateExercise(index, { exercise: e.target.value })}
                          className="w-full bg-slate-700/50 text-white p-1.5 rounded border border-slate-600
                                    focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveExercise(index)}
                        className="ml-2 text-slate-400 hover:text-red-400"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-xs text-slate-400">Sets</label>
                        <input
                          type="number"
                          value={exercise.sets}
                          onChange={(e) => handleUpdateExercise(index, { sets: parseInt(e.target.value) })}
                          className="w-full bg-slate-700/50 text-white p-1.5 rounded border border-slate-600
                                    focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          min="1"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400">Reps</label>
                        <input
                          type="number"
                          value={exercise.reps}
                          onChange={(e) => handleUpdateExercise(index, { reps: parseInt(e.target.value) })}
                          className="w-full bg-slate-700/50 text-white p-1.5 rounded border border-slate-600
                                    focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          min="1"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400">RPE</label>
                        <input
                          type="number"
                          value={exercise.rpe}
                          onChange={(e) => handleUpdateExercise(index, { rpe: parseInt(e.target.value) })}
                          className="w-full bg-slate-700/50 text-white p-1.5 rounded border border-slate-600
                                    focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          min="1"
                          max="10"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700">
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div>
                    <label className="text-xs text-slate-400">Exercise Name</label>
                    <input
                      type="text"
                      value={newExercise.name}
                      onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })}
                      className="w-full bg-slate-700/50 text-white p-1.5 rounded border border-slate-600
                                focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter exercise name"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400">Sets</label>
                    <input
                      type="number"
                      value={newExercise.sets}
                      onChange={(e) => setNewExercise({ ...newExercise, sets: parseInt(e.target.value) })}
                      className="w-full bg-slate-700/50 text-white p-1.5 rounded border border-slate-600
                                focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="1"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div>
                    <label className="text-xs text-slate-400">Reps</label>
                    <input
                      type="number"
                      value={newExercise.reps}
                      onChange={(e) => setNewExercise({ ...newExercise, reps: parseInt(e.target.value) })}
                      className="w-full bg-slate-700/50 text-white p-1.5 rounded border border-slate-600
                                focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400">RPE</label>
                    <input
                      type="number"
                      value={newExercise.rpe}
                      onChange={(e) => setNewExercise({ ...newExercise, rpe: parseInt(e.target.value) })}
                      className="w-full bg-slate-700/50 text-white p-1.5 rounded border border-slate-600
                                focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="1"
                      max="10"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAddExercise}
                  disabled={!newExercise.name.trim()}
                  className="w-full bg-blue-600 text-white rounded-lg px-3 py-2 hover:bg-blue-700 
                           disabled:bg-slate-700 disabled:text-slate-400"
                >
                  Add Exercise
                </button>
              </div>
            </div>
            
            {error && (
              <div className="p-3 rounded-lg bg-red-900/20 border border-red-800 text-red-200 text-sm">
                {error}
              </div>
            )}
          </div>
        </div>
        
        <div className="border-t border-slate-800 p-4 flex justify-end space-x-3">
          <ModernButton
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </ModernButton>
          <ModernButton
            variant="primary"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            disabled={isSubmitting}
          >
            Save Changes
          </ModernButton>
        </div>
      </div>
    </div>
  );
} 