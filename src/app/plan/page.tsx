'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useProgram } from '@/hooks/useProgram';
import { TrainingBlock, WeekDay, ProgramWorkout, ALL_WEEK_DAYS, WeekSchedule } from '@/lib/types';
import { SUPPORTED_EXERCISES } from '@/lib/workout-service';
import { useStore } from '@/lib/zustandStore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { toast } from 'react-hot-toast';
import DashboardLayout from '../../components/DashboardLayout';
import { updateWeekWorkouts, getUserProgramId } from '@/lib/program-service';

interface BlockFormData {
  name: string;
  startWeek: number;
  endWeek: number;
  focus: 'Volume' | 'Intensity' | 'Peak' | 'Deload' | 'Custom';
  customFocus?: string;
  workoutDays: WeekDay[];
  notes?: string;
}

interface WorkoutFormData {
  exercise: string;
  sets: number;
  reps: number;
  rpe?: number;
  notes?: string;
}

interface ProgramFormData {
  name: string;
}

export default function PlanPage() {
  const router = useRouter();
  const setCurrentUser = useStore((state) => state.setCurrentUser);
  const currentUser = useStore((state) => state.currentUser);
  const [programId, setProgramId] = useState<string | undefined>();
  const [showProgramForm, setShowProgramForm] = useState(false);
  const [programFormData, setProgramFormData] = useState<ProgramFormData>({
    name: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    program,
    loading,
    error,
    createNewProgram,
    addBlock,
    updateBlock,
    deleteBlock,
    setActiveBlock,
  } = useProgram(programId);

  const [showBlockForm, setShowBlockForm] = useState(false);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [blockFormData, setBlockFormData] = useState<BlockFormData>({
    name: '',
    startWeek: 1,
    endWeek: 4,
    focus: 'Volume',
    workoutDays: [],
  });

  const [showWorkoutForm, setShowWorkoutForm] = useState(false);
  const [selectedDay, setSelectedDay] = useState<WeekDay | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [workoutFormData, setWorkoutFormData] = useState<WorkoutFormData>({
    exercise: SUPPORTED_EXERCISES[0],
    sets: 3,
    reps: 8,
    rpe: 7,
  });

  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [expandedBlockId, setExpandedBlockId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }
      setCurrentUser({
        id: user.uid,
        email: user.email || 'Anonymous User',
        displayName: user.displayName || 'Anonymous User',
        photoURL: user.photoURL || undefined,
      });

      // Fetch the user's program ID
      try {
        const existingProgramId = await getUserProgramId(user.uid);
        if (existingProgramId) {
          setProgramId(existingProgramId);
        }
      } catch (error) {
        console.error('Error fetching program ID:', error);
        toast.error('Failed to load program');
      }
    });

    return () => unsubscribe();
  }, [router, setCurrentUser]);

  const handleCreateProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.id) {
      toast.error('Please log in to create a program');
      return;
    }

    setIsSubmitting(true);
    try {
      const id = await createNewProgram(programFormData.name);
      setProgramId(id);
      setShowProgramForm(false);
      toast.success('Program created successfully!');
    } catch (error) {
      console.error('Failed to create program:', error);
      toast.error('Failed to create program');
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateBlockForm = (data: BlockFormData): string | null => {
    if (!data.name.trim()) {
      return 'Block name is required';
    }
    if (data.startWeek < 1) {
      return 'Start week must be at least 1';
    }
    if (data.endWeek <= data.startWeek) {
      return 'End week must be greater than start week';
    }
    if (data.workoutDays.length === 0) {
      return 'Please select at least one workout day';
    }
    if (data.focus === 'Custom' && !data.customFocus?.trim()) {
      return 'Custom focus description is required';
    }
    return null;
  };

  const handleAddBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.id) {
      toast.error('Please log in to add a block');
      return;
    }

    const validationError = validateBlockForm(blockFormData);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      const newBlock = {
        ...blockFormData,
        status: 'Upcoming' as const,
        weeks: ALL_WEEK_DAYS.reduce((acc, day) => {
          acc[day] = [];
          return acc;
        }, {} as Record<WeekDay, ProgramWorkout[]>),
      };
      await addBlock(newBlock);
      setShowBlockForm(false);
      setBlockFormData({
        name: '',
        startWeek: 1,
        endWeek: 4,
        focus: 'Volume',
        workoutDays: [],
      });
      toast.success('Block added successfully!');
    } catch (error) {
      console.error('Failed to add block:', error);
      toast.error('Failed to add block');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBlockId || !program || !currentUser?.id) {
      toast.error('Unable to update block: Missing required information');
      return;
    }

    const validationError = validateBlockForm(blockFormData);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      const block = program.blocks.find(b => b.id === editingBlockId);
      if (!block) {
        toast.error('Block not found');
        return;
      }

      // Keep existing workouts for days that are still selected
      const existingWeeks = block.weeks || {};
      const weeks: Record<number, WeekSchedule> = {};
      
      for (let week = blockFormData.startWeek; week <= blockFormData.endWeek; week++) {
        // If the week exists and has data, keep it
        if (existingWeeks[week]) {
          weeks[week] = {
            ...existingWeeks[week],
            days: blockFormData.workoutDays.reduce((acc, day) => {
              // Keep existing workouts for selected days
              acc[day] = existingWeeks[week]?.days[day] || [];
              return acc;
            }, {} as Record<WeekDay, ProgramWorkout[]>)
          };
        } else {
          // Initialize new week
          weeks[week] = {
            days: ALL_WEEK_DAYS.reduce((acc, day) => {
              acc[day] = [];
              return acc;
            }, {} as Record<WeekDay, ProgramWorkout[]>),
            notes: ''
          };
        }
      }

      await updateBlock(editingBlockId, {
        ...blockFormData,
        weeks
      });

      setEditingBlockId(null);
      setBlockFormData({
        name: '',
        startWeek: 1,
        endWeek: 4,
        focus: 'Volume',
        workoutDays: [],
      });
      toast.success('Block updated successfully!');
    } catch (error) {
      console.error('Failed to update block:', error);
      toast.error('Failed to update block');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBlock = async (blockId: string) => {
    if (!confirm('Are you sure you want to delete this block?')) return;
    if (!program) {
      toast.error('Unable to delete block: Program not found');
      return;
    }

    try {
      await deleteBlock(blockId);
      toast.success('Block deleted successfully!');
    } catch (error) {
      console.error('Failed to delete block:', error);
      toast.error('Failed to delete block');
    }
  };

  const validateWorkoutForm = (data: WorkoutFormData): string | null => {
    if (!data.exercise.trim()) {
      return 'Exercise is required';
    }
    if (data.sets < 1) {
      return 'Sets must be at least 1';
    }
    if (data.reps < 1) {
      return 'Reps must be at least 1';
    }
    if (data.rpe !== undefined && (data.rpe < 1 || data.rpe > 10)) {
      return 'RPE must be between 1 and 10';
    }
    return null;
  };

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
      const block = program.blocks.find(b => b.id === selectedBlockId);
      if (!block) {
        toast.error('Block not found');
        return;
      }

      // Ensure the week exists and has a valid structure
      const weekSchedule = block.weeks?.[selectedWeek] || {
        days: ALL_WEEK_DAYS.reduce((acc, day) => {
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
      setShowWorkoutForm(false);
      setWorkoutFormData({
        exercise: SUPPORTED_EXERCISES[0],
        sets: 3,
        reps: 8,
        rpe: 7,
      });
      toast.success('Workout added successfully!');
    } catch (error) {
      console.error('Failed to add workout:', error);
      toast.error('Failed to add workout');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteWorkout = async (blockId: string, weekNumber: number, day: WeekDay, index: number) => {
    if (!program || !currentUser?.id) {
      toast.error('Unable to delete workout: Program not found or user not authenticated');
      return;
    }

    try {
      const block = program.blocks.find(b => b.id === blockId);
      if (!block) {
        toast.error('Block not found');
        return;
      }

      const weekSchedule = block.weeks[weekNumber];
      if (!weekSchedule) {
        toast.error('Week schedule not found');
        return;
      }

      const updatedWeekSchedule: WeekSchedule = {
        ...weekSchedule,
        days: {
          ...weekSchedule.days,
          [day]: weekSchedule.days[day].filter((_, i) => i !== index)
        }
      };

      await updateWeekWorkouts(currentUser.id, program.id, blockId, weekNumber, updatedWeekSchedule);
      toast.success('Workout deleted successfully!');
    } catch (error) {
      console.error('Failed to delete workout:', error);
      toast.error('Failed to delete workout');
    }
  };

  if (!currentUser) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-screen p-6">
          <h1 className="text-2xl font-bold mb-4">Welcome to Training Programs</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Please log in to create and manage your training programs.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Log In
          </button>
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!program && !loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-screen p-6">
          <h1 className="text-2xl font-bold mb-4">Welcome to Training Programs</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            No program found. Start building your training blocks!
          </p>
          <button
            onClick={() => setShowProgramForm(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create New Program
          </button>
        </div>

        {/* Program Creation Modal */}
        {showProgramForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-semibold mb-4">Create New Program</h2>
              <form onSubmit={handleCreateProgram}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Program Name</label>
                    <input
                      type="text"
                      value={programFormData.name}
                      onChange={(e) =>
                        setProgramFormData((prev) => ({ ...prev, name: e.target.value }))
                      }
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                      placeholder="e.g., 12-Week Strength Program"
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowProgramForm(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`px-4 py-2 bg-blue-600 text-white rounded-lg ${
                      isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
                    }`}
                  >
                    {isSubmitting ? 'Creating...' : 'Create Program'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold">{program?.name || 'Training Program'}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {program?.blocks?.length || 0} training blocks
            </p>
          </div>
          <button
            onClick={() => setShowBlockForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Training Block
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* Empty State */}
        {!loading && (!program?.blocks || program.blocks.length === 0) && (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">
              No training blocks yet. Click "Add Training Block" to get started.
            </p>
          </div>
        )}

        {/* Training Blocks */}
        {!loading && program?.blocks && program.blocks.length > 0 && (
          <div className="space-y-6">
            {program.blocks.map((block) => (
              <div
                key={block.id}
                className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 ${
                  block.status === 'Current' ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                {/* Block Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-semibold">{block.name}</h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      Weeks {block.startWeek}–{block.endWeek} • {block.focus === 'Custom' ? block.customFocus : block.focus}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {block.workoutDays.map((day) => (
                        <span
                          key={day}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        >
                          {day.slice(0, 3)}
                        </span>
                      ))}
                    </div>
                    {block.notes && (
                      <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm">
                        {block.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setActiveBlock(block.id)}
                      className={`px-3 py-1 rounded ${
                        block.status === 'Current'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                          : block.status === 'Completed'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {block.status}
                    </button>
                    <button
                      onClick={() => {
                        setEditingBlockId(block.id);
                        setBlockFormData({
                          name: block.name,
                          startWeek: block.startWeek,
                          endWeek: block.endWeek,
                          focus: block.focus,
                          customFocus: block.customFocus,
                          workoutDays: block.workoutDays,
                          notes: block.notes,
                        });
                      }}
                      className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteBlock(block.id)}
                      className="text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Week Selection */}
                <div className="mb-4">
                  <div className="flex space-x-2 overflow-x-auto pb-2">
                    {Array.from(
                      { length: block.endWeek - block.startWeek + 1 },
                      (_, i) => block.startWeek + i
                    ).map((weekNum) => (
                      <button
                        key={weekNum}
                        onClick={() => {
                          setSelectedWeek(weekNum);
                          setExpandedBlockId(block.id);
                        }}
                        className={`px-3 py-1 rounded-lg text-sm ${
                          selectedWeek === weekNum && expandedBlockId === block.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                        }`}
                      >
                        Week {weekNum}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Workouts Grid */}
                {expandedBlockId === block.id && selectedWeek !== null && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4 mt-4">
                    {ALL_WEEK_DAYS.map((day) => (
                      <div
                        key={day}
                        className={`space-y-2 ${
                          !block.workoutDays.includes(day) ? 'opacity-50' : ''
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <h3 className="font-medium text-sm">{day}</h3>
                          {block.workoutDays.includes(day) && (
                            <button
                              onClick={() => {
                                setSelectedBlockId(block.id);
                                setSelectedDay(day);
                                setShowWorkoutForm(true);
                              }}
                              className="text-blue-600 hover:text-blue-700 text-sm"
                            >
                              +
                            </button>
                          )}
                        </div>
                        {block.weeks?.[selectedWeek]?.days?.[day]?.map((workout, index) => (
                          <div
                            key={index}
                            className="bg-gray-50 dark:bg-gray-700 p-2 rounded text-sm"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">{workout.exercise}</p>
                                <p className="text-gray-600 dark:text-gray-400">
                                  {workout.sets}×{workout.reps}
                                  {workout.rpe && ` @${workout.rpe}`}
                                </p>
                                {workout.notes && (
                                  <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                                    {workout.notes}
                                  </p>
                                )}
                              </div>
                              <button
                                onClick={() => handleDeleteWorkout(block.id, selectedWeek, day, index)}
                                className="text-red-600 hover:text-red-700 text-xs"
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        ))}
                        {block.workoutDays.includes(day) && (!block.weeks?.[selectedWeek]?.days?.[day] || block.weeks[selectedWeek].days[day].length === 0) && (
                          <div className="text-gray-500 dark:text-gray-400 text-sm text-center py-2">
                            No workouts scheduled
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Block Form Modal */}
        {(showBlockForm || editingBlockId) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-semibold mb-4">
                {editingBlockId ? 'Edit Training Block' : 'Add Training Block'}
              </h2>
              <form onSubmit={editingBlockId ? handleUpdateBlock : handleAddBlock}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Block Name</label>
                    <input
                      type="text"
                      value={blockFormData.name}
                      onChange={(e) =>
                        setBlockFormData((prev) => ({ ...prev, name: e.target.value }))
                      }
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                      placeholder="e.g., Strength Block 1"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Start Week</label>
                      <input
                        type="number"
                        value={blockFormData.startWeek}
                        onChange={(e) =>
                          setBlockFormData((prev) => ({
                            ...prev,
                            startWeek: parseInt(e.target.value),
                          }))
                        }
                        min="1"
                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">End Week</label>
                      <input
                        type="number"
                        value={blockFormData.endWeek}
                        onChange={(e) =>
                          setBlockFormData((prev) => ({
                            ...prev,
                            endWeek: parseInt(e.target.value),
                          }))
                        }
                        min={blockFormData.startWeek}
                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Block Focus</label>
                    <select
                      value={blockFormData.focus}
                      onChange={(e) =>
                        setBlockFormData((prev) => ({
                          ...prev,
                          focus: e.target.value as BlockFormData['focus'],
                        }))
                      }
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                      required
                    >
                      <option value="Volume">Volume</option>
                      <option value="Intensity">Intensity</option>
                      <option value="Peak">Peak</option>
                      <option value="Deload">Deload</option>
                      <option value="Custom">Custom</option>
                    </select>
                  </div>
                  {blockFormData.focus === 'Custom' && (
                    <div>
                      <label className="block text-sm font-medium mb-1">Custom Focus</label>
                      <input
                        type="text"
                        value={blockFormData.customFocus || ''}
                        onChange={(e) =>
                          setBlockFormData((prev) => ({
                            ...prev,
                            customFocus: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                        placeholder="e.g., Technique"
                        required={blockFormData.focus === 'Custom'}
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium mb-1">Workout Days</label>
                    <div className="grid grid-cols-4 gap-2">
                      {(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as WeekDay[]).map((day) => (
                        <label key={day} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={blockFormData.workoutDays.includes(day)}
                            onChange={(e) => {
                              setBlockFormData((prev) => ({
                                ...prev,
                                workoutDays: e.target.checked
                                  ? [...prev.workoutDays, day]
                                  : prev.workoutDays.filter((d) => d !== day),
                              }));
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                          />
                          <span className="text-sm">{day.slice(0, 3)}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Notes (Optional)</label>
                    <textarea
                      value={blockFormData.notes || ''}
                      onChange={(e) =>
                        setBlockFormData((prev) => ({ ...prev, notes: e.target.value }))
                      }
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                      rows={3}
                      placeholder="Add any additional notes about this training block..."
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowBlockForm(false);
                      setEditingBlockId(null);
                      setBlockFormData({
                        name: '',
                        startWeek: 1,
                        endWeek: 4,
                        focus: 'Volume',
                        workoutDays: [],
                      });
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {editingBlockId ? 'Update Block' : 'Add Block'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Workout Form Modal */}
        {showWorkoutForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-semibold mb-4">Add Workout</h2>
              <form onSubmit={handleAddWorkout}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Exercise</label>
                    <select
                      value={workoutFormData.exercise}
                      onChange={(e) =>
                        setWorkoutFormData((prev) => ({
                          ...prev,
                          exercise: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                      required
                    >
                      {SUPPORTED_EXERCISES.map((exercise) => (
                        <option key={exercise} value={exercise}>
                          {exercise}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Sets</label>
                      <input
                        type="number"
                        value={workoutFormData.sets}
                        onChange={(e) =>
                          setWorkoutFormData((prev) => ({
                            ...prev,
                            sets: parseInt(e.target.value),
                          }))
                        }
                        min="1"
                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Reps</label>
                      <input
                        type="number"
                        value={workoutFormData.reps}
                        onChange={(e) =>
                          setWorkoutFormData((prev) => ({
                            ...prev,
                            reps: parseInt(e.target.value),
                          }))
                        }
                        min="1"
                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">RPE</label>
                      <input
                        type="number"
                        value={workoutFormData.rpe || ''}
                        onChange={(e) =>
                          setWorkoutFormData((prev) => ({
                            ...prev,
                            rpe: parseInt(e.target.value),
                          }))
                        }
                        min="1"
                        max="10"
                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Notes (Optional)</label>
                    <textarea
                      value={workoutFormData.notes || ''}
                      onChange={(e) =>
                        setWorkoutFormData((prev) => ({
                          ...prev,
                          notes: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                      rows={3}
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowWorkoutForm(false);
                      setSelectedBlockId(null);
                      setSelectedDay(null);
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`px-4 py-2 bg-blue-600 text-white rounded-lg ${
                      isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
                    }`}
                  >
                    {isSubmitting ? 'Adding...' : 'Add Workout'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 