import { NextResponse } from 'next/server';
import { 
  getUserProgramId, 
  addTrainingBlock, 
  updateTrainingBlock,
  createProgram,
  updateWeekWorkouts
} from '@/lib/program-service';
import { Program, TrainingBlock, WeekDay, WeekSchedule, ProgramWorkout } from '@/lib/types';
import { getCustomExercises, SUPPORTED_EXERCISES } from '@/lib/workout-service';

interface TrainingPlanAction {
  action: 'fetch' | 'create_program' | 'add_block' | 'update_block' | 'add_exercise' | 'remove_exercise' | 'modify_exercise';
  userId: string;
  programId?: string;
  data?: any;
}

// Function to get program data directly from Firebase
async function getProgram(userId: string, programId: string): Promise<Program | null> {
  // Import Firebase modules dynamically to avoid server-side issues
  const { getDatabase, ref, get } = await import('firebase/database');
  const { default: app } = await import('@/lib/firebase');
  
  const db = getDatabase(app);
  const programRef = ref(db, `users/${userId}/programs/${programId}`);
  const snapshot = await get(programRef);
  
  if (!snapshot.exists()) {
    return null;
  }
  
  return snapshot.val() as Program;
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as TrainingPlanAction;
    
    // Validate request
    if (!body.action || !body.userId) {
      return NextResponse.json({ 
        error: 'Invalid request. Missing action or userId.', 
        success: false 
      }, { status: 400 });
    }
    
    // Handle different actions
    switch (body.action) {
      case 'fetch':
        return await handleFetch(body.userId);
        
      case 'create_program':
        return await handleCreateProgram(body.userId, body.data);
        
      case 'add_block':
        return await handleAddBlock(body.userId, body.programId || '', body.data);
        
      case 'update_block':
        return await handleUpdateBlock(body.userId, body.programId || '', body.data);
        
      case 'add_exercise':
        return await handleAddExercise(body.userId, body.programId || '', body.data);
        
      case 'remove_exercise':
        return await handleRemoveExercise(body.userId, body.programId || '', body.data);
        
      case 'modify_exercise':
        return await handleModifyExercise(body.userId, body.programId || '', body.data);
        
      default:
        return NextResponse.json({ 
          error: `Unknown action: ${body.action}`,
          success: false 
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Error handling training plan action:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'An unknown error occurred',
      success: false
    }, { status: 500 });
  }
}

// Helper function to get active program ID or throw error
async function getActiveProgramId(userId: string): Promise<string> {
  const programId = await getUserProgramId(userId);
  if (!programId) {
    throw new Error('No active training program found');
  }
  return programId;
}

// Fetch the user's current training program
async function handleFetch(userId: string) {
  try {
    const programId = await getUserProgramId(userId);
    if (!programId) {
      return NextResponse.json({ 
        message: 'No active training program found',
        program: null,
        success: true
      });
    }
    
    const program = await getProgram(userId, programId);
    return NextResponse.json({ 
      program,
      success: true
    });
  } catch (error) {
    console.error('Error fetching training program:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch training program',
      success: false
    }, { status: 500 });
  }
}

// Create a new training program
async function handleCreateProgram(userId: string, data: any) {
  try {
    // Validate data
    if (!data.name) {
      return NextResponse.json({ 
        error: 'Program name is required', 
        success: false 
      }, { status: 400 });
    }
    
    // Create program
    const programId = await createProgram(
      userId,
      data.name,
      data.startDate,
      data.daysPerWeek,
      data.initialBlock
    );
    
    const program = await getProgram(userId, programId);
    
    return NextResponse.json({ 
      message: `Created new program: ${data.name}`,
      programId,
      program,
      success: true
    });
  } catch (error) {
    console.error('Error creating training program:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to create training program',
      success: false
    }, { status: 500 });
  }
}

// Add a training block to an existing program
async function handleAddBlock(userId: string, programId: string, data: any) {
  try {
    // If programId is not provided, get the active one
    if (!programId) {
      programId = await getActiveProgramId(userId);
    }
    
    // Validate data
    if (!data.name || data.startWeek === undefined || data.endWeek === undefined) {
      return NextResponse.json({ 
        error: 'Block name, startWeek, and endWeek are required', 
        success: false 
      }, { status: 400 });
    }
    
    if (data.endWeek < data.startWeek) {
      return NextResponse.json({ 
        error: 'endWeek must be greater than or equal to startWeek', 
        success: false 
      }, { status: 400 });
    }
    
    // Create empty weeks structure as required by the TrainingBlock type
    const weeks: Record<number, WeekSchedule> = {};
    for (let week = data.startWeek; week <= data.endWeek; week++) {
      const emptyDays = (data.workoutDays || ['Monday', 'Wednesday', 'Friday']).reduce(
        (acc: Record<WeekDay, ProgramWorkout[]>, day: WeekDay) => {
          acc[day] = [];
          return acc;
        }, 
        {} as Record<WeekDay, ProgramWorkout[]>
      );

      weeks[week] = {
        days: emptyDays,
        notes: ''
      };
    }
    
    // Create the block
    const blockId = await addTrainingBlock(userId, programId, {
      name: data.name,
      startWeek: data.startWeek,
      endWeek: data.endWeek,
      focus: data.focus || 'Custom',
      customFocus: data.customFocus,
      workoutDays: data.workoutDays || ['Monday', 'Wednesday', 'Friday'],
      status: 'Upcoming',
      notes: data.notes || '',
      weeks: weeks
    });
    
    return NextResponse.json({ 
      message: `Added block: ${data.name} (weeks ${data.startWeek}-${data.endWeek})`,
      blockId,
      success: true
    });
  } catch (error) {
    console.error('Error adding training block:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to add training block',
      success: false
    }, { status: 500 });
  }
}

// Update an existing training block
async function handleUpdateBlock(userId: string, programId: string, data: any) {
  try {
    // If programId is not provided, get the active one
    if (!programId) {
      programId = await getActiveProgramId(userId);
    }
    
    // Validate data
    if (!data.blockId) {
      return NextResponse.json({ 
        error: 'blockId is required', 
        success: false 
      }, { status: 400 });
    }
    
    if (data.endWeek !== undefined && data.startWeek !== undefined && data.endWeek < data.startWeek) {
      return NextResponse.json({ 
        error: 'endWeek must be greater than or equal to startWeek', 
        success: false 
      }, { status: 400 });
    }
    
    // Update the block
    await updateTrainingBlock(userId, programId, data.blockId, {
      name: data.name,
      startWeek: data.startWeek,
      endWeek: data.endWeek,
      focus: data.focus,
      customFocus: data.customFocus,
      workoutDays: data.workoutDays,
      notes: data.notes,
      status: data.status
    });
    
    return NextResponse.json({ 
      message: `Updated block: ${data.name || 'Unnamed'}`,
      success: true
    });
  } catch (error) {
    console.error('Error updating training block:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to update training block',
      success: false
    }, { status: 500 });
  }
}

// Add an exercise to a training program
async function handleAddExercise(userId: string, programId: string, data: any) {
  try {
    // If programId is not provided, get the active one
    if (!programId) {
      programId = await getActiveProgramId(userId);
    }
    
    // Validate data
    if (!data.blockId || !data.weekNumber || !data.day || !data.exercise) {
      return NextResponse.json({ 
        error: 'blockId, weekNumber, day, and exercise are required', 
        success: false 
      }, { status: 400 });
    }
    
    // Get the program
    const program = await getProgram(userId, programId);
    if (!program) {
      return NextResponse.json({ 
        error: 'Program not found', 
        success: false 
      }, { status: 404 });
    }
    
    // Find the block
    const block = program.blocks.find((b: TrainingBlock) => b.id === data.blockId);
    if (!block) {
      return NextResponse.json({ 
        error: 'Block not found', 
        success: false 
      }, { status: 404 });
    }
    
    // Check if week is within block range
    if (data.weekNumber < block.startWeek || data.weekNumber > block.endWeek) {
      return NextResponse.json({ 
        error: `Week ${data.weekNumber} is outside block range (${block.startWeek}-${block.endWeek})`, 
        success: false 
      }, { status: 400 });
    }
    
    // Check if the day is in workoutDays
    if (!block.workoutDays.includes(data.day)) {
      return NextResponse.json({ 
        error: `Day ${data.day} is not in block's workout days: ${block.workoutDays.join(', ')}`, 
        success: false 
      }, { status: 400 });
    }
    
    // Check if the exercise exists (in supported or custom exercises)
    const customExercises = await getCustomExercises(userId);
    const exerciseExists = SUPPORTED_EXERCISES.includes(data.exercise) || 
                         customExercises.some(e => e.name === data.exercise);
    
    if (!exerciseExists) {
      return NextResponse.json({ 
        error: `Exercise "${data.exercise}" does not exist in supported or custom exercises`, 
        success: false 
      }, { status: 400 });
    }
    
    // Create or update the week
    const week = block.weeks?.[data.weekNumber] || {
      days: {},
      notes: ''
    };
    
    // Create or update the day
    const day = data.day as WeekDay;
    
    // Create the exercise
    const exercise: ProgramWorkout = {
      exercise: data.exercise,
      sets: data.sets || 3,
      reps: data.reps || 8,
      intensity: {
        type: data.intensityType || 'rpe',
        value: data.intensityValue !== undefined ? data.intensityValue : 7
      },
      notes: data.notes || ''
    };
    
    // Add the exercise to the day
    const dayExercises = week.days?.[day] || [];
    dayExercises.push(exercise);
    
    // Update the week
    const updatedWeek: WeekSchedule = {
      ...week,
      days: {
        ...week.days,
        [day]: dayExercises
      }
    };
    
    // Save the changes
    await updateWeekWorkouts(userId, programId, data.blockId, data.weekNumber, updatedWeek);
    
    return NextResponse.json({ 
      message: `Added ${data.exercise}: ${data.sets}×${data.reps} @RPE ${data.intensityValue} to ${data.day} in week ${data.weekNumber}`,
      success: true
    });
  } catch (error) {
    console.error('Error adding exercise:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to add exercise',
      success: false
    }, { status: 500 });
  }
}

// Remove an exercise from a training program
async function handleRemoveExercise(userId: string, programId: string, data: any) {
  try {
    // If programId is not provided, get the active one
    if (!programId) {
      programId = await getActiveProgramId(userId);
    }
    
    // Validate data
    if (!data.blockId || !data.weekNumber || !data.day || data.exerciseIndex === undefined) {
      return NextResponse.json({ 
        error: 'blockId, weekNumber, day, and exerciseIndex are required', 
        success: false 
      }, { status: 400 });
    }
    
    // Get the program
    const program = await getProgram(userId, programId);
    if (!program) {
      return NextResponse.json({ 
        error: 'Program not found', 
        success: false 
      }, { status: 404 });
    }
    
    // Find the block
    const block = program.blocks.find((b: TrainingBlock) => b.id === data.blockId);
    if (!block) {
      return NextResponse.json({ 
        error: 'Block not found', 
        success: false 
      }, { status: 404 });
    }
    
    // Check if week exists
    if (!block.weeks || !block.weeks[data.weekNumber]) {
      return NextResponse.json({ 
        error: `Week ${data.weekNumber} not found in block`, 
        success: false 
      }, { status: 404 });
    }
    
    // Check if day exists
    const week = block.weeks[data.weekNumber];
    const day = data.day as WeekDay;

    if (!week.days || !week.days[day] || !Array.isArray(week.days[day])) {
      return NextResponse.json({ 
        error: `Day ${day} not found in week ${data.weekNumber}`, 
        success: false 
      }, { status: 404 });
    }
    
    // Check if exercise exists
    const exercises = week.days[day];
    if (data.exerciseIndex < 0 || data.exerciseIndex >= exercises.length) {
      return NextResponse.json({ 
        error: `Exercise index ${data.exerciseIndex} is out of range`, 
        success: false 
      }, { status: 400 });
    }
    
    // Get the exercise that will be removed (for the success message)
    const exerciseToRemove = exercises[data.exerciseIndex];
    
    // Remove the exercise
    const updatedDay = [...exercises];
    updatedDay.splice(data.exerciseIndex, 1);
    
    // Update the week
    const updatedWeek: WeekSchedule = {
      ...week,
      days: {
        ...week.days,
        [day]: updatedDay
      }
    };
    
    // Save the changes
    await updateWeekWorkouts(userId, programId, data.blockId, data.weekNumber, updatedWeek);
    
    return NextResponse.json({ 
      message: `Removed ${exerciseToRemove.exercise} from ${data.day} in week ${data.weekNumber}`,
      success: true
    });
  } catch (error) {
    console.error('Error removing exercise:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to remove exercise',
      success: false
    }, { status: 500 });
  }
}

// Modify an existing exercise
async function handleModifyExercise(userId: string, programId: string, data: any) {
  try {
    // If programId is not provided, get the active one
    if (!programId) {
      programId = await getActiveProgramId(userId);
    }
    
    // Validate data
    if (!data.blockId || !data.weekNumber || !data.day || data.exerciseIndex === undefined) {
      return NextResponse.json({ 
        error: 'blockId, weekNumber, day, and exerciseIndex are required', 
        success: false 
      }, { status: 400 });
    }
    
    // Get the program
    const program = await getProgram(userId, programId);
    if (!program) {
      return NextResponse.json({ 
        error: 'Program not found', 
        success: false 
      }, { status: 404 });
    }
    
    // Find the block
    const block = program.blocks.find((b: TrainingBlock) => b.id === data.blockId);
    if (!block) {
      return NextResponse.json({ 
        error: 'Block not found', 
        success: false 
      }, { status: 404 });
    }
    
    // Check if week exists
    if (!block.weeks || !block.weeks[data.weekNumber]) {
      return NextResponse.json({ 
        error: `Week ${data.weekNumber} not found in block`, 
        success: false 
      }, { status: 404 });
    }
    
    // Check if day exists
    const week = block.weeks[data.weekNumber];
    const day = data.day as WeekDay;

    if (!week.days || !week.days[day] || !Array.isArray(week.days[day])) {
      return NextResponse.json({ 
        error: `Day ${day} not found in week ${data.weekNumber}`, 
        success: false 
      }, { status: 404 });
    }
    
    // Check if exercise exists
    const exercises = week.days[day];
    if (data.exerciseIndex < 0 || data.exerciseIndex >= exercises.length) {
      return NextResponse.json({ 
        error: `Exercise index ${data.exerciseIndex} is out of range`, 
        success: false 
      }, { status: 400 });
    }
    
    // If replacing exercise, check if it exists
    if (data.exercise) {
      const customExercises = await getCustomExercises(userId);
      const exerciseExists = SUPPORTED_EXERCISES.includes(data.exercise) || 
                           customExercises.some(e => e.name === data.exercise);
      
      if (!exerciseExists) {
        return NextResponse.json({ 
          error: `Exercise "${data.exercise}" does not exist in supported or custom exercises`, 
          success: false 
        }, { status: 400 });
      }
    }
    
    // Get the original exercise (for the success message)
    const originalExercise = { ...exercises[data.exerciseIndex] };
    
    // Update the exercise
    const updatedExercise: ProgramWorkout = {
      ...exercises[data.exerciseIndex],
      exercise: data.exercise || exercises[data.exerciseIndex].exercise,
      sets: data.sets !== undefined ? data.sets : exercises[data.exerciseIndex].sets,
      reps: data.reps !== undefined ? data.reps : exercises[data.exerciseIndex].reps,
      intensity: {
        type: data.intensityType || 'rpe',
        value: data.intensityValue !== undefined ? data.intensityValue : exercises[data.exerciseIndex].intensity.value
      },
      notes: data.notes !== undefined ? data.notes : exercises[data.exerciseIndex].notes
    };
    
    // Update the day
    const updatedDay = [...exercises];
    updatedDay[data.exerciseIndex] = updatedExercise;
    
    // Update the week
    const updatedWeek: WeekSchedule = {
      ...week,
      days: {
        ...week.days,
        [day]: updatedDay
      }
    };
    
    // Save the changes
    await updateWeekWorkouts(userId, programId, data.blockId, data.weekNumber, updatedWeek);
    
    // Create success message based on what was changed
    let message = `Modified exercise in ${data.day} of week ${data.weekNumber}: `;
    if (updatedExercise.exercise !== originalExercise.exercise) {
      message += `Changed ${originalExercise.exercise} to ${updatedExercise.exercise}. `;
    }
    if (updatedExercise.sets !== originalExercise.sets || 
        updatedExercise.reps !== originalExercise.reps || 
        updatedExercise.intensity.value !== originalExercise.intensity.value) {
      message += `Updated to ${updatedExercise.sets}×${updatedExercise.reps} @RPE ${updatedExercise.intensity.value}. `;
    }
    if (updatedExercise.notes !== originalExercise.notes) {
      message += `Updated notes. `;
    }
    
    return NextResponse.json({ 
      message: message.trim(),
      success: true
    });
  } catch (error) {
    console.error('Error modifying exercise:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to modify exercise',
      success: false
    }, { status: 500 });
  }
} 