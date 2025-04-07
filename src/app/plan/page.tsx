'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useProgram } from '@/hooks/useProgram';
import { TrainingBlock, WeekDay, ProgramWorkout, ALL_WEEK_DAYS, WeekSchedule, Program } from '@/lib/types';
import { SUPPORTED_EXERCISES } from '@/lib/workout-service';
import { useStore } from '@/lib/zustandStore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { toast } from 'react-hot-toast';
import ModernLayout from '@/components/ModernLayout';
import GlassCard from '@/components/GlassCard';
import GridContainer from '@/components/GridContainer';
import ModernButton from '@/components/ModernButton';
import { updateWeekWorkouts, getUserProgramId } from '@/lib/program-service';
import { calculateRemainingTime, calculateTotalProgramWeeks, calculateProgramEndDate } from '@/lib/utils';
import EditProgramModal from '@/components/EditProgramModal';
import CreateProgramModal from '@/components/CreateProgramModal';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  const {
    program,
    loading,
    error,
    createNewProgram,
    addBlock,
    updateBlock,
    deleteBlock,
    setActiveBlock,
    updateProgramDetails,
    deleteCurrentProgram,
    checkCompletedPrograms,
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
  const [showEditProgramModal, setShowEditProgramModal] = useState(false);
  const [programToDelete, setProgramToDelete] = useState<string | null>(null);

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

      // Check for completed programs every time the component mounts
      if (user) {
        try {
          await checkCompletedPrograms();
        } catch (error) {
          console.error('Error checking completed programs:', error);
        }
      }
    });

    return () => unsubscribe();
  }, [router, setCurrentUser]);

  // Function to automatically update the program end date when blocks change
  useEffect(() => {
    if (program && program.blocks && program.startDate && program.blocks.length > 0) {
      const totalWeeks = calculateTotalProgramWeeks(program.blocks);
      const calculatedEndDate = calculateProgramEndDate(program.startDate, totalWeeks);
      
      // Only update if end date has changed
      if (!program.endDate || program.endDate !== calculatedEndDate) {
        updateProgramDetails({
          endDate: calculatedEndDate
        }).catch(console.error);
      }
    }
  }, [program?.blocks]);

  const handleCreateProgram = async (
    name: string, 
    startDate: number, 
    daysPerWeek: number, 
    initialBlock?: Omit<TrainingBlock, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    if (!currentUser?.id) {
      toast.error('Please log in to create a program');
      return '';
    }

    try {
      const id = await createNewProgram(name, startDate, daysPerWeek, initialBlock);
      setProgramId(id);
      toast.success('Program created successfully!');
      return id;
    } catch (error) {
      console.error('Failed to create program:', error);
      toast.error('Failed to create program');
      throw error;
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
    if (!editingBlockId || !program || !currentUser?.id || !program.blocks) {
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
              acc[day] = existingWeeks[week]?.days?.[day] || [];
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
    if (!program || !program.blocks) {
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
      const block = program.blocks?.find(b => b.id === selectedBlockId);
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
      const block = program.blocks?.find(b => b.id === blockId);
      if (!block) {
        toast.error('Block not found');
        return;
      }

      const weekSchedule = block.weeks?.[weekNumber];
      if (!weekSchedule) {
        toast.error('Week schedule not found');
        return;
      }

      const updatedWeekSchedule: WeekSchedule = {
        ...weekSchedule,
        days: {
          ...weekSchedule.days,
          [day]: (weekSchedule.days?.[day] || []).filter((_, i) => i !== index)
        }
      };

      await updateWeekWorkouts(currentUser.id, program.id, blockId, weekNumber, updatedWeekSchedule);
      toast.success('Workout deleted successfully!');
    } catch (error) {
      console.error('Failed to delete workout:', error);
      toast.error('Failed to delete workout');
    }
  };

  const handleProgramUpdate = async (updates: Partial<Program>) => {
    if (!program) return;
    await updateProgramDetails(updates);
  };

  const handleDeleteProgram = async () => {
    if (!program) return;
    
    try {
      await deleteCurrentProgram();
      setProgramId(undefined);
      setShowDeleteConfirmation(false);
      toast.success('Program deleted successfully.');
    } catch (error) {
      console.error('Failed to delete program:', error);
      toast.error('Failed to delete program');
    }
  };

  // Function to handle program completion warning
  useEffect(() => {
    if (program && program.endDate) {
      const remaining = calculateRemainingTime(program.endDate);
      
      if (remaining && remaining.isCompleted && !programToDelete) {
        // Set a timer to delete the program after 3 days
        toast.success('Your program has been completed! It will be deleted in 3 days unless extended.', {
          duration: 10000
        });
        
        // Set the program to be deleted
        setProgramToDelete(program.id);
        
        // Schedule deletion for 3 days later
        const deletionDate = Date.now() + (3 * 24 * 60 * 60 * 1000);
        localStorage.setItem(`program_to_delete_${program.id}`, deletionDate.toString());
      }
    }
  }, [program]);

  // Check if it's time to delete the program
  useEffect(() => {
    if (!currentUser?.id || !programToDelete) return;
    
    const checkDeletion = () => {
      const deletionDateStr = localStorage.getItem(`program_to_delete_${programToDelete}`);
      if (deletionDateStr) {
        const deletionDate = parseInt(deletionDateStr);
        if (Date.now() >= deletionDate) {
          // Time to delete the program
          deleteCurrentProgram()
            .then(() => {
              localStorage.removeItem(`program_to_delete_${programToDelete}`);
              toast.success('Your completed program has been deleted.');
              setProgramToDelete(null);
            })
            .catch(console.error);
        }
      }
    };
    
    // Check on mount and every hour
    checkDeletion();
    const interval = setInterval(checkDeletion, 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [currentUser?.id, programToDelete]);

  // Function to render the main content based on program state
  const renderMainContent = () => {
    if (!program) {
      if (loading) {
        return (
          <GlassCard colSpan="md:col-span-12">
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          </GlassCard>
        );
      } else {
        return (
          <GlassCard title="Create Your Training Program" colSpan="md:col-span-12">
            <div className="flex flex-col items-center justify-center text-center p-8 space-y-6">
              <p className="text-slate-300 max-w-md">
                You don't have a training program yet. Start by creating one to organize your workout plans.
              </p>
              <ModernButton
                variant="primary"
                onClick={() => setShowProgramForm(true)}
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                }
              >
                Create Program
              </ModernButton>
            </div>
          </GlassCard>
        );
      }
    }

    // Ensure program exists and has required properties
    const safeProgram = {
      ...program,
      name: program?.name || 'Unnamed Program',
      blocks: program?.blocks || [],
      startDate: program?.startDate || Date.now(),
      endDate: program?.endDate
    };

    // Program exists but has no blocks
    if (!safeProgram.blocks.length) {
      return (
        <GlassCard title={safeProgram.name} colSpan="md:col-span-12">
          <div className="p-6 text-center">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-white">{safeProgram.name}</h2>
                {safeProgram.endDate && (
                  <p className="text-sm text-blue-400 mt-1">
                    {calculateRemainingTime(safeProgram.endDate)?.formattedString || 'Start date not set'}
                  </p>
                )}
              </div>
              <div className="mt-2 md:mt-0 flex gap-3">
                <ModernButton
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEditProgramModal(true)}
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  }
                >
                  Edit Program
                </ModernButton>
                <ModernButton
                  variant="danger"
                  size="sm"
                  onClick={() => setShowDeleteConfirmation(true)}
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  }
                >
                  Delete Program
                </ModernButton>
              </div>
            </div>
            <p className="text-slate-400">No training blocks yet. Add a block to get started.</p>
            <div className="mt-4">
              <ModernButton
                variant="secondary"
                onClick={() => {
                  setShowBlockForm(true);
                  setEditingBlockId(null);
                  setBlockFormData({
                    name: '',
                    startWeek: 1,
                    endWeek: 4,
                    focus: 'Volume',
                    workoutDays: [],
                  });
                }}
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                }
              >
                Add Block
              </ModernButton>
            </div>
          </div>
        </GlassCard>
      );
    }

    // Program and blocks exist
    return (
      <GlassCard title={safeProgram.name} colSpan="md:col-span-12">
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">{safeProgram.name}</h2>
              {safeProgram.endDate && (
                <p className="text-sm text-blue-400">
                  {calculateRemainingTime(safeProgram.endDate)?.formattedString || 'Start date not set'}
                </p>
              )}
            </div>
            <div className="mt-2 md:mt-0 flex flex-wrap gap-3">
              <ModernButton
                variant="outline"
                size="sm"
                onClick={() => setShowEditProgramModal(true)}
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                }
              >
                Edit Program
              </ModernButton>
              <ModernButton
                variant="secondary"
                size="sm"
                onClick={() => {
                  setShowBlockForm(true);
                  setEditingBlockId(null);
                  setBlockFormData({
                    name: '',
                    startWeek: 1,
                    endWeek: 4,
                    focus: 'Volume',
                    workoutDays: [],
                  });
                }}
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                }
              >
                Add Block
              </ModernButton>
              <ModernButton
                variant="danger"
                size="sm"
                onClick={() => setShowDeleteConfirmation(true)}
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                }
              >
                Delete Program
              </ModernButton>
            </div>
          </div>

          {/* Training Blocks */}
          <div className="space-y-4">
            {safeProgram.blocks.map((block) => {
              // Ensure all block properties have safe defaults
              const safeBlock = {
                ...block,
                id: block.id || `block-${Date.now()}`,
                name: block.name || 'Unnamed Block',
                startWeek: block.startWeek || 1,
                endWeek: block.endWeek || 1,
                focus: block.focus || 'Volume',
                customFocus: block.customFocus || '',
                workoutDays: block.workoutDays || [],
                weeks: block.weeks || {},
                status: block.status || 'Upcoming'
              };
              
              return (
                <div
                  key={safeBlock.id}
                  className={`bg-slate-800/50 rounded-xl border ${
                    expandedBlockId === safeBlock.id ? 'border-blue-500' : 'border-slate-700'
                  } overflow-hidden`}
                >
                  <div
                    className="bg-slate-800 p-4 cursor-pointer"
                    onClick={() => setExpandedBlockId(expandedBlockId === safeBlock.id ? null : safeBlock.id)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-medium text-white">
                          {safeBlock.name}
                        </h3>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900/60 text-blue-200">
                            Weeks {safeBlock.startWeek}-{safeBlock.endWeek}
                          </span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-900/60 text-purple-200">
                            {safeBlock.focus === 'Custom' ? safeBlock.customFocus : safeBlock.focus}
                          </span>
                          {safeBlock.workoutDays.length > 0 && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/60 text-green-200">
                              {safeBlock.workoutDays.length} workout days
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingBlockId(safeBlock.id);
                            setBlockFormData({
                              name: safeBlock.name,
                              startWeek: safeBlock.startWeek,
                              endWeek: safeBlock.endWeek,
                              focus: safeBlock.focus as any,
                              customFocus: safeBlock.customFocus,
                              workoutDays: [...safeBlock.workoutDays],
                              notes: safeBlock.notes,
                            });
                            setShowBlockForm(true);
                          }}
                          className="text-slate-400 hover:text-white transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteBlock(safeBlock.id);
                          }}
                          className="text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                        <svg
                          className={`w-5 h-5 text-slate-400 transform transition-transform ${
                            expandedBlockId === safeBlock.id ? 'rotate-180' : ''
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {expandedBlockId === safeBlock.id && (
                    <div className="p-4 border-t border-slate-700">
                      {/* Week selector */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Select Week:
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {Array.from({ length: safeBlock.endWeek - safeBlock.startWeek + 1 }).map((_, i) => {
                            const weekNum = safeBlock.startWeek + i;
                            return (
                              <button
                                key={weekNum}
                                onClick={() => setSelectedWeek(weekNum)}
                                className={`px-3 py-1 rounded-md text-sm ${
                                  selectedWeek === weekNum
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                }`}
                              >
                                Week {weekNum}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Display selected week's workouts */}
                      {selectedWeek !== null && (
                        <div className="mt-4">
                          <h4 className="font-medium text-slate-200 mb-4">
                            Week {selectedWeek} Workouts
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {(safeBlock.workoutDays || []).map((day) => {
                              const workouts = safeBlock.weeks && 
                                safeBlock.weeks[selectedWeek] && 
                                safeBlock.weeks[selectedWeek].days && 
                                safeBlock.weeks[selectedWeek].days[day] 
                                  ? safeBlock.weeks[selectedWeek].days[day] 
                                  : [];
                              return (
                                <div key={day} className="bg-slate-900/60 rounded-lg p-4">
                                  <div className="flex justify-between items-center mb-3">
                                    <h4 className="font-medium text-white capitalize">{day}</h4>
                                    <ModernButton
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedDay(day);
                                        setSelectedBlockId(safeBlock.id);
                                        setShowWorkoutForm(true);
                                        setWorkoutFormData({
                                          exercise: SUPPORTED_EXERCISES[0],
                                          sets: 3,
                                          reps: 8,
                                          rpe: 7,
                                        });
                                      }}
                                      icon={
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                      }
                                    >
                                      Add
                                    </ModernButton>
                                  </div>

                                  {workouts.length === 0 ? (
                                    <p className="text-sm text-slate-400 italic">No exercises planned</p>
                                  ) : (
                                    <div className="space-y-3">
                                      {workouts.map((workout, index) => (
                                        <div key={index} className="bg-slate-800/80 rounded p-2 text-sm">
                                          <div className="flex justify-between">
                                            <span className="font-medium text-white">{workout.exercise}</span>
                                            <button
                                              onClick={() => {
                                                if (
                                                  window.confirm(
                                                    `Are you sure you want to remove ${workout.exercise}?`
                                                  )
                                                ) {
                                                  handleDeleteWorkout(
                                                    safeBlock.id,
                                                    selectedWeek,
                                                    day,
                                                    index
                                                  );
                                                }
                                              }}
                                              className="text-slate-400 hover:text-red-500"
                                            >
                                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                              </svg>
                                            </button>
                                          </div>
                                          <div className="text-slate-300 flex gap-2 mt-1">
                                            <span>{workout.sets} × {workout.reps}</span>
                                            {workout.rpe && <span>@RPE {workout.rpe}</span>}
                                          </div>
                                          {workout.notes && (
                                            <p className="mt-1 text-slate-400 text-xs">{workout.notes}</p>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </GlassCard>
    );
  };

  if (!currentUser) {
    return (
      <ModernLayout title="Training Plans" description="Create and manage your workout programs">
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
      </ModernLayout>
    );
  }

  return (
    <ModernLayout title="Training Plans" description="Create and manage your workout programs">
      <div className="space-y-8">
        {renderMainContent()}

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirmation && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md p-6 shadow-xl">
              <h2 className="text-xl font-bold text-white mb-4">Delete Program</h2>
              <p className="text-slate-300 mb-6">
                Are you sure you want to delete this program? This action cannot be undone and all your
                training blocks and workouts will be lost.
              </p>
              <div className="flex justify-end space-x-3">
                <ModernButton
                  variant="outline"
                  onClick={() => setShowDeleteConfirmation(false)}
                >
                  Cancel
                </ModernButton>
                <ModernButton
                  variant="danger"
                  onClick={handleDeleteProgram}
                  isLoading={isSubmitting}
                >
                  Delete Program
                </ModernButton>
              </div>
            </div>
          </div>
        )}

        {/* Replace the old program creation modal with the new CreateProgramModal */}
        {showProgramForm && currentUser?.id && (
          <CreateProgramModal
            onCreateProgram={handleCreateProgram}
            onClose={() => setShowProgramForm(false)}
            userId={currentUser.id}
          />
        )}

        {/* Edit Program Modal */}
        {showEditProgramModal && program && (
          <EditProgramModal
            program={program}
            onUpdate={handleProgramUpdate}
            onClose={() => setShowEditProgramModal(false)}
          />
        )}

        {/* Block Form Modal */}
        {showBlockForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md p-6 shadow-xl overflow-y-auto max-h-[90vh]">
              <h2 className="text-xl font-bold text-white mb-4">
                {editingBlockId ? 'Edit Training Block' : 'Add Training Block'}
              </h2>
              <form onSubmit={editingBlockId ? handleUpdateBlock : handleAddBlock}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="blockName" className="block text-sm font-medium text-slate-300 mb-1">
                      Block Name
                    </label>
                    <input
                      type="text"
                      id="blockName"
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={blockFormData.name}
                      onChange={(e) => setBlockFormData({ ...blockFormData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="startWeek" className="block text-sm font-medium text-slate-300 mb-1">
                        Start Week
                      </label>
                      <input
                        type="number"
                        id="startWeek"
                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={blockFormData.startWeek}
                        onChange={(e) => setBlockFormData({ ...blockFormData, startWeek: parseInt(e.target.value) })}
                        min="1"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="endWeek" className="block text-sm font-medium text-slate-300 mb-1">
                        End Week
                      </label>
                      <input
                        type="number"
                        id="endWeek"
                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={blockFormData.endWeek}
                        onChange={(e) => setBlockFormData({ ...blockFormData, endWeek: parseInt(e.target.value) })}
                        min={blockFormData.startWeek + 1}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="focus" className="block text-sm font-medium text-slate-300 mb-1">
                      Training Focus
                    </label>
                    <select
                      id="focus"
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={blockFormData.focus}
                      onChange={(e) => setBlockFormData({ ...blockFormData, focus: e.target.value as any })}
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
                      <label htmlFor="customFocus" className="block text-sm font-medium text-slate-300 mb-1">
                        Custom Focus Description
                      </label>
                      <input
                        type="text"
                        id="customFocus"
                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={blockFormData.customFocus || ''}
                        onChange={(e) => setBlockFormData({ ...blockFormData, customFocus: e.target.value })}
                        required={blockFormData.focus === 'Custom'}
                      />
                    </div>
                  )}

                  <div>
                    <span className="block text-sm font-medium text-slate-300 mb-2">
                      Workout Days
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {ALL_WEEK_DAYS.map((day) => (
                        <button
                          key={day}
                          type="button"
                          className={`px-3 py-1 rounded-lg text-sm font-medium ${
                            blockFormData.workoutDays.includes(day)
                              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                          onClick={() => {
                            const newWorkoutDays = blockFormData.workoutDays.includes(day)
                              ? blockFormData.workoutDays.filter((d) => d !== day)
                              : [...blockFormData.workoutDays, day];
                            setBlockFormData({ ...blockFormData, workoutDays: newWorkoutDays });
                          }}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-slate-300 mb-1">
                      Notes (Optional)
                    </label>
                    <textarea
                      id="notes"
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={blockFormData.notes || ''}
                      onChange={(e) => setBlockFormData({ ...blockFormData, notes: e.target.value })}
                      rows={3}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <ModernButton
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowBlockForm(false);
                      setEditingBlockId(null);
                    }}
                  >
                    Cancel
                  </ModernButton>
                  <ModernButton
                    type="submit"
                    variant="primary"
                    isLoading={isSubmitting}
                  >
                    {editingBlockId ? 'Update' : 'Add'}
                  </ModernButton>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Workout Form Modal */}
        {showWorkoutForm && selectedDay && selectedBlockId && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md p-6 shadow-xl">
              <h2 className="text-xl font-bold text-white mb-4">
                Add Exercise - {selectedDay} (Week {selectedWeek})
              </h2>
              <form onSubmit={handleAddWorkout}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="exercise" className="block text-sm font-medium text-slate-300 mb-1">
                      Exercise
                    </label>
                    <select
                      id="exercise"
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={workoutFormData.exercise}
                      onChange={(e) => setWorkoutFormData({ ...workoutFormData, exercise: e.target.value })}
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
                      <label htmlFor="rpe" className="block text-sm font-medium text-slate-300 mb-1">
                        RPE
                      </label>
                      <input
                        type="number"
                        id="rpe"
                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={workoutFormData.rpe || ''}
                        onChange={(e) => setWorkoutFormData({ ...workoutFormData, rpe: parseInt(e.target.value) })}
                        min="1"
                        max="10"
                        step="0.5"
                      />
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
                    onClick={() => setShowWorkoutForm(false)}
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
        )}
      </div>
    </ModernLayout>
  );
} 