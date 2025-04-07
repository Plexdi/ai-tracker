'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ModernLayout from '@/components/ModernLayout';
import GlassCard from '@/components/GlassCard';
import ModernButton from '@/components/ModernButton';
import { useStore } from '@/lib/zustandStore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getCustomExercises, getExerciseCount, deleteCustomExercise, MUSCLE_GROUPS, SUPPORTED_EXERCISES, type CustomExercise, type MuscleGroup } from '@/lib/workout-service';
import { toast } from 'react-hot-toast';
import GridContainer from '@/components/GridContainer';
import EditExerciseModal from '@/components/EditExerciseModal';
import ExerciseHistoryModal from '@/components/ExerciseHistoryModal';

interface ExerciseForDisplay {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  isDefault: boolean;
  workingWeight?: number;
  workingWeightUnit?: 'kg' | 'lbs';
}

export default function ExercisesPage() {
  const router = useRouter();
  const { currentUser, setCurrentUser } = useStore();
  const [customExercises, setCustomExercises] = useState<CustomExercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [exerciseCounts, setExerciseCounts] = useState<Record<string, number>>({});
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<'All' | MuscleGroup>('All');
  const [isDeletingExercise, setIsDeletingExercise] = useState<string | null>(null);
  
  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [exerciseToEdit, setExerciseToEdit] = useState<ExerciseForDisplay | null>(null);

  // History modal state
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push('/login');
        return;
      }
      setCurrentUser({
        id: user.uid,
        email: user.email || '',
        displayName: user.displayName || '',
        photoURL: user.photoURL || undefined,
      });
    });

    return () => unsubscribe();
  }, [router, setCurrentUser]);

  const loadExercises = async () => {
    if (!currentUser?.id) return;
    
    setIsLoading(true);
    try {
      const [exercises, counts] = await Promise.all([
        getCustomExercises(currentUser.id),
        getExerciseCount(currentUser.id)
      ]);
      setCustomExercises(exercises);
      setExerciseCounts(counts);
    } catch (error) {
      console.error('Error loading exercises:', error);
      toast.error('Failed to load exercises');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadExercises();
  }, [currentUser?.id]);

  const handleDeleteExercise = async (exerciseId: string, exerciseName: string) => {
    if (!currentUser?.id || !exerciseId) return;
    
    // Show confirmation dialog
    if (!window.confirm(`Are you sure you want to delete "${exerciseName}"? This will not affect your existing workout logs.`)) {
      return;
    }
    
    setIsDeletingExercise(exerciseId);
    try {
      await deleteCustomExercise(currentUser.id, exerciseId);
      setCustomExercises(prev => prev.filter(ex => ex.id !== exerciseId));
      toast.success('Exercise deleted successfully');
    } catch (error) {
      console.error('Error deleting exercise:', error);
      toast.error('Failed to delete exercise');
    } finally {
      setIsDeletingExercise(null);
    }
  };

  const handleEditExercise = (exercise: ExerciseForDisplay) => {
    setExerciseToEdit(exercise);
    setIsEditModalOpen(true);
  };

  const handleViewHistory = (exerciseName: string) => {
    setSelectedExercise(exerciseName);
    setIsHistoryModalOpen(true);
  };

  const filteredExercises = customExercises.filter(
    exercise => selectedMuscleGroup === 'All' || exercise.muscleGroup === selectedMuscleGroup
  );

  // Updated default exercises list to match SBD focus
  const defaultExercises = ['Squat', 'Bench Press', 'Deadlift'];
  const defaultExerciseMapping: Record<string, MuscleGroup> = {
    'Squat': 'Quadriceps',
    'Bench Press': 'Chest',
    'Deadlift': 'Lower Back'
  };

  // Combine default and custom exercises for display
  const allExercisesForDisplay = [
    ...defaultExercises.map(name => ({
      id: name,
      name,
      muscleGroup: defaultExerciseMapping[name],
      isDefault: true,
      workingWeight: undefined,
      workingWeightUnit: undefined
    })),
    ...customExercises
      .filter(ex => ex.id !== undefined)
      .map(ex => ({
        id: ex.id as string,
        name: ex.name,
        muscleGroup: ex.muscleGroup,
        isDefault: false,
        workingWeight: ex.workingWeight,
        workingWeightUnit: ex.workingWeightUnit
      }))
  ].filter(ex => 
    selectedMuscleGroup === 'All' || ex.muscleGroup === selectedMuscleGroup
  );

  // Check if exercise is in the default SBD exercises
  const isDefaultSBDExercise = (name: string): boolean => {
    return SUPPORTED_EXERCISES.includes(name as any);
  };

  return (
    <ModernLayout title="My Exercises" description="Manage your exercise library">
      <div className="space-y-8">
        {/* Muscle Group Filter */}
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/60 rounded-xl p-6">
          <h3 className="text-lg font-medium text-white mb-4">Filter by Muscle Group</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedMuscleGroup('All')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedMuscleGroup === 'All'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 hover:text-white border border-slate-700'
              }`}
            >
              All
            </button>
            {MUSCLE_GROUPS.map((group) => (
              <button
                key={group}
                onClick={() => setSelectedMuscleGroup(group)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedMuscleGroup === group
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 hover:text-white border border-slate-700'
                }`}
              >
                {group}
              </button>
            ))}
          </div>
        </div>

        {/* Exercise List */}
        <GlassCard title="Exercise Library" colSpan="md:col-span-12">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : allExercisesForDisplay.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-700">
                <thead className="bg-slate-800/50">
                  <tr>
                    <th scope="col" className="px-4 py-3.5 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Exercise Name
                    </th>
                    <th scope="col" className="px-4 py-3.5 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Muscle Group
                    </th>
                    <th scope="col" className="px-4 py-3.5 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Times Used
                    </th>
                    <th scope="col" className="px-4 py-3.5 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Working Weight
                    </th>
                    <th scope="col" className="px-4 py-3.5 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-slate-900/30 divide-y divide-slate-800">
                  {allExercisesForDisplay.map((exercise) => (
                    <tr key={exercise.id} className="hover:bg-slate-800/30">
                      <td className="px-4 py-3.5 text-sm text-white">
                        {exercise.name}
                        {exercise.isDefault && (
                          <span className="ml-2 px-2 py-0.5 text-xs bg-slate-700 rounded-full text-slate-300">Default</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-slate-300">{exercise.muscleGroup}</td>
                      <td className="px-4 py-3.5 text-sm text-center text-slate-300">{exerciseCounts[exercise.name] || 0}</td>
                      <td className="px-4 py-3.5 text-sm text-slate-300">
                        {exercise.workingWeight 
                          ? `${exercise.workingWeight} ${exercise.workingWeightUnit}` 
                          : '-'}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {/* Only show history button for custom exercises or exercises that have been used */}
                          {(!isDefaultSBDExercise(exercise.name) && exerciseCounts[exercise.name] > 0) && (
                            <ModernButton
                              variant="secondary"
                              size="sm"
                              onClick={() => handleViewHistory(exercise.name)}
                            >
                              View History
                            </ModernButton>
                          )}
                          
                          <ModernButton
                            variant="secondary"
                            size="sm"
                            onClick={() => handleEditExercise(exercise)}
                          >
                            Edit
                          </ModernButton>
                          
                          {!exercise.isDefault && (
                            <ModernButton
                              variant="danger"
                              size="sm"
                              onClick={() => exercise.id && handleDeleteExercise(exercise.id, exercise.name)}
                              isLoading={isDeletingExercise === exercise.id}
                              disabled={isDeletingExercise === exercise.id}
                            >
                              Delete
                            </ModernButton>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-400 mb-4">No exercises found for the selected filter</p>
              <ModernButton 
                variant="primary"
                onClick={() => router.push('/log-lift')}
              >
                Log a Workout with Custom Exercise
              </ModernButton>
            </div>
          )}
        </GlassCard>

        {/* Info Card */}
        <GlassCard title="About Custom Exercises" colSpan="md:col-span-12">
          <div className="space-y-4">
            <p className="text-slate-300">
              Custom exercises allow you to track workouts beyond the default exercise list. 
              When you log a workout and select "Other" as the exercise type, you can create a new custom exercise.
            </p>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-white mb-2">Tips:</h4>
              <ul className="list-disc pl-5 text-slate-300 space-y-1 text-sm">
                <li>Group similar exercises under the same name for better tracking</li>
                <li>Select the appropriate muscle group for better filtering</li>
                <li>You can edit both default and custom exercises to better match your tracking needs</li>
                <li>Custom exercises can be deleted, but default exercises cannot</li>
                <li>View your workout history for custom exercises to track your progress over time</li>
              </ul>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Edit Exercise Modal */}
      {exerciseToEdit && currentUser?.id && (
        <EditExerciseModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          exerciseId={exerciseToEdit.id}
          exerciseName={exerciseToEdit.name}
          muscleGroup={exerciseToEdit.muscleGroup}
          isDefaultExercise={exerciseToEdit.isDefault}
          userId={currentUser.id}
          onUpdate={loadExercises}
          workingWeight={exerciseToEdit.workingWeight}
          workingWeightUnit={exerciseToEdit.workingWeightUnit}
        />
      )}

      {/* Exercise History Modal */}
      {selectedExercise && (
        <ExerciseHistoryModal
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          exerciseName={selectedExercise}
        />
      )}
    </ModernLayout>
  );
} 