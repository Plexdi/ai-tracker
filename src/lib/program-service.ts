import { getDatabase, ref, push, set, get, onValue, off, child } from 'firebase/database';
import app from './firebase';
import { Program, TrainingBlock, BlockStatus, WeekDay, ALL_WEEK_DAYS, ProgramWorkout, WeekSchedule } from './types';

// Initialize Realtime Database
const db = getDatabase(app);

export async function createProgram(
  userId: string,
  name: string
): Promise<string> {
  if (!userId) {
    throw new Error('User must be authenticated to create a program');
  }

  try {
    const programRef = push(ref(db, `users/${userId}/programs`));
    const newProgram: Program = {
      id: programRef.key!,
      userId,
      name,
      blocks: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    await set(programRef, newProgram);
    return programRef.key!;
  } catch (error) {
    console.error('Error creating program:', error);
    throw new Error('Failed to create program');
  }
}

export async function getUserProgramId(userId: string): Promise<string | null> {
  if (!userId) {
    throw new Error('User ID is required');
  }

  try {
    const programsRef = ref(db, `users/${userId}/programs`);
    const snapshot = await get(programsRef);
    
    if (!snapshot.exists()) {
      return null;
    }

    // Get the first program ID (users typically have one program)
    const programs = snapshot.val();
    const firstProgramId = Object.keys(programs)[0];
    return firstProgramId;
  } catch (error) {
    console.error('Error getting user program ID:', error);
    throw new Error('Failed to get user program ID');
  }
}

export async function addTrainingBlock(
  userId: string,
  programId: string,
  block: Omit<TrainingBlock, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  if (!userId || !programId) {
    throw new Error('User must be authenticated and program ID is required');
  }

  try {
    const programRef = ref(db, `users/${userId}/programs/${programId}`);
    const snapshot = await get(programRef);
    if (!snapshot.exists()) {
      throw new Error('Program not found');
    }

    const program = snapshot.val() as Program;
    if (!program.blocks) {
      program.blocks = [];
    }

    // Initialize empty weeks with workouts for selected days
    const weeks: Record<number, WeekSchedule> = {};
    for (let week = block.startWeek; week <= block.endWeek; week++) {
      const emptyDays = ALL_WEEK_DAYS.reduce((acc, day) => {
        acc[day] = [];
        return acc;
      }, {} as Record<WeekDay, ProgramWorkout[]>);

      weeks[week] = {
        days: emptyDays,
        notes: ''
      };
    }

    const newBlock: TrainingBlock = {
      ...block,
      id: crypto.randomUUID(),
      status: 'Upcoming',
      weeks,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    // Update block weeks based on existing blocks
    if (program.blocks.length > 0) {
      const lastBlock = program.blocks[program.blocks.length - 1];
      newBlock.startWeek = lastBlock.endWeek + 1;
      newBlock.endWeek = newBlock.startWeek + (block.endWeek - block.startWeek);
    } else {
      newBlock.startWeek = block.startWeek || 1;
      newBlock.endWeek = block.endWeek || (newBlock.startWeek + 3);
    }

    program.blocks.push(newBlock);
    program.updatedAt = Date.now();
    await set(programRef, program);
    return newBlock.id;
  } catch (error) {
    console.error('Error adding training block:', error);
    throw new Error('Failed to add training block');
  }
}

export async function updateTrainingBlock(
  userId: string,
  programId: string,
  blockId: string,
  updates: Partial<TrainingBlock>
): Promise<void> {
  if (!userId || !programId || !blockId) {
    throw new Error('User, program, and block IDs are required');
  }

  try {
    const programRef = ref(db, `users/${userId}/programs/${programId}`);
    const snapshot = await get(programRef);
    if (!snapshot.exists()) {
      throw new Error('Program not found');
    }

    const program = snapshot.val() as Program;
    const blockIndex = program.blocks.findIndex(b => b.id === blockId);
    if (blockIndex === -1) {
      throw new Error('Block not found');
    }

    // Ensure weeks structure is maintained when updating
    if (updates.startWeek !== undefined || updates.endWeek !== undefined) {
      const startWeek = updates.startWeek ?? program.blocks[blockIndex].startWeek;
      const endWeek = updates.endWeek ?? program.blocks[blockIndex].endWeek;
      const existingWeeks = program.blocks[blockIndex].weeks || {};

      const weeks: Record<number, WeekSchedule> = {};
      for (let week = startWeek; week <= endWeek; week++) {
        weeks[week] = existingWeeks[week] || {
          days: ALL_WEEK_DAYS.reduce((acc, day) => {
            acc[day] = [];
            return acc;
          }, {} as Record<WeekDay, ProgramWorkout[]>),
          notes: ''
        };
      }
      updates.weeks = weeks;
    }

    program.blocks[blockIndex] = {
      ...program.blocks[blockIndex],
      ...updates,
      updatedAt: Date.now()
    };

    program.updatedAt = Date.now();
    await set(programRef, program);
  } catch (error) {
    console.error('Error updating training block:', error);
    throw new Error('Failed to update training block');
  }
}

export async function deleteTrainingBlock(
  userId: string,
  programId: string,
  blockId: string
): Promise<void> {
  if (!userId || !programId || !blockId) {
    throw new Error('User, program, and block IDs are required');
  }

  try {
    const programRef = ref(db, `users/${userId}/programs/${programId}`);
    const snapshot = await get(programRef);
    if (!snapshot.exists()) {
      throw new Error('Program not found');
    }

    const program = snapshot.val() as Program;
    program.blocks = program.blocks.filter(b => b.id !== blockId);
    
    // Recalculate weeks for remaining blocks
    let currentWeek = 1;
    program.blocks.forEach(block => {
      block.startWeek = currentWeek;
      const duration = block.endWeek - block.startWeek + 1;
      block.endWeek = currentWeek + duration - 1;
      currentWeek = block.endWeek + 1;
    });

    await set(programRef, program);
  } catch (error) {
    console.error('Error deleting training block:', error);
    throw new Error('Failed to delete training block');
  }
}

export function subscribeToProgram(
  userId: string,
  programId: string,
  callback: (program: Program | null) => void
): () => void {
  if (!userId || !programId) {
    callback(null);
    return () => {};
  }

  const programRef = ref(db, `users/${userId}/programs/${programId}`);
  const unsubscribe = onValue(programRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback(null);
      return;
    }

    const program = snapshot.val() as Program;
    callback(program);
  }, (error) => {
    console.error('Error subscribing to program:', error);
    callback(null);
  });

  return () => off(programRef);
}

export async function setCurrentBlock(
  userId: string,
  programId: string,
  blockId: string
): Promise<void> {
  if (!userId || !programId || !blockId) {
    throw new Error('User, program, and block IDs are required');
  }

  try {
    const programRef = ref(db, `users/${userId}/programs/${programId}`);
    const snapshot = await get(programRef);
    if (!snapshot.exists()) {
      throw new Error('Program not found');
    }

    const program = snapshot.val() as Program;
    const blockIndex = program.blocks.findIndex(b => b.id === blockId);
    if (blockIndex === -1) {
      throw new Error('Block not found');
    }

    // Update status of all blocks
    program.blocks.forEach(block => {
      if (block.id === blockId) {
        block.status = 'Current';
      } else if (block.endWeek < program.blocks[blockIndex].startWeek) {
        block.status = 'Completed';
      } else {
        block.status = 'Upcoming';
      }
    });

    program.currentBlockId = blockId;
    program.updatedAt = Date.now();

    await set(programRef, program);
  } catch (error) {
    console.error('Error setting current block:', error);
    throw new Error('Failed to set current block');
  }
}

export async function updateWeekWorkouts(
  userId: string,
  programId: string,
  blockId: string,
  weekNumber: number,
  weekData: WeekSchedule
): Promise<void> {
  if (!userId || !programId || !blockId) {
    throw new Error('User, program, and block IDs are required');
  }

  try {
    const programRef = ref(db, `users/${userId}/programs/${programId}`);
    const snapshot = await get(programRef);
    if (!snapshot.exists()) {
      throw new Error('Program not found');
    }

    const program = snapshot.val() as Program;
    const blockIndex = program.blocks.findIndex(b => b.id === blockId);
    if (blockIndex === -1) {
      throw new Error('Block not found');
    }

    // Ensure the week exists within the block's range
    if (weekNumber < program.blocks[blockIndex].startWeek || 
        weekNumber > program.blocks[blockIndex].endWeek) {
      throw new Error('Week number is outside block range');
    }

    // Initialize weeks if it doesn't exist
    if (!program.blocks[blockIndex].weeks) {
      program.blocks[blockIndex].weeks = {};
    }

    program.blocks[blockIndex].weeks[weekNumber] = weekData;
    program.blocks[blockIndex].updatedAt = Date.now();
    program.updatedAt = Date.now();

    await set(programRef, program);
  } catch (error) {
    console.error('Error updating week workouts:', error);
    throw new Error('Failed to update week workouts');
  }
} 