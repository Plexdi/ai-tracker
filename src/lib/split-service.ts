import { getDatabase, ref, set, push, get, remove, update } from 'firebase/database';
import app from './firebase';
import { Split, SplitTemplateType, SplitDay } from './types';
import { getUserProgramId } from './program-service';

const db = getDatabase(app);

// Create a new split
export async function createSplit(
  userId: string,
  name: string,
  daysPerWeek: number,
  template: SplitTemplateType,
  days: SplitDay[] = [],
  combinedTemplates?: {
    templates: SplitTemplateType[];
    daysPerTemplate: number[];
  }
): Promise<string> {
  if (!userId) {
    throw new Error('User must be authenticated to create a split');
  }

  try {
    const splitsRef = ref(db, `users/${userId}/splits`);
    const newSplitRef = push(splitsRef);
    const now = Date.now();
    const newSplit: Split = {
      id: newSplitRef.key!,
      userId,
      name,
      daysPerWeek,
      template,
      days: days.length > 0 ? days : generateDefaultDays(daysPerWeek, template),
      createdAt: now,
      updatedAt: now,
      isFavorite: false,
      combinedTemplates
    };

    await set(newSplitRef, newSplit);
    return newSplit.id;
  } catch (error) {
    console.error('Error creating split:', error);
    throw new Error('Failed to create split');
  }
}

// Get all splits for a user
export async function getUserSplits(userId: string): Promise<Split[]> {
  if (!userId) {
    throw new Error('User must be authenticated to get splits');
  }

  try {
    const splitsRef = ref(db, `users/${userId}/splits`);
    const snapshot = await get(splitsRef);

    if (!snapshot.exists()) {
      return [];
    }

    const splits: Split[] = [];
    snapshot.forEach((childSnapshot) => {
      splits.push(childSnapshot.val() as Split);
    });

    return splits;
  } catch (error) {
    console.error('Error getting splits:', error);
    throw new Error('Failed to get splits');
  }
}

// Get a specific split by ID
export async function getSplit(userId: string, splitId: string): Promise<Split | null> {
  if (!userId || !splitId) {
    throw new Error('User must be authenticated and split ID must be provided');
  }

  try {
    const splitRef = ref(db, `users/${userId}/splits/${splitId}`);
    const snapshot = await get(splitRef);

    if (!snapshot.exists()) {
      return null;
    }

    return snapshot.val() as Split;
  } catch (error) {
    console.error('Error getting split:', error);
    throw new Error('Failed to get split');
  }
}

// Update a split
export async function updateSplit(
  userId: string,
  splitId: string,
  updates: Partial<Omit<Split, 'id' | 'userId' | 'createdAt'>>
): Promise<void> {
  if (!userId || !splitId) {
    throw new Error('User must be authenticated and split ID must be provided');
  }

  try {
    const splitRef = ref(db, `users/${userId}/splits/${splitId}`);
    const snapshot = await get(splitRef);

    if (!snapshot.exists()) {
      throw new Error('Split not found');
    }

    const now = Date.now();
    await update(splitRef, {
      ...updates,
      updatedAt: now
    });
  } catch (error) {
    console.error('Error updating split:', error);
    throw new Error('Failed to update split');
  }
}

// Delete a split
export async function deleteSplit(userId: string, splitId: string): Promise<void> {
  if (!userId || !splitId) {
    throw new Error('User must be authenticated and split ID must be provided');
  }

  try {
    const splitRef = ref(db, `users/${userId}/splits/${splitId}`);
    await remove(splitRef);
  } catch (error) {
    console.error('Error deleting split:', error);
    throw new Error('Failed to delete split');
  }
}

// Toggle favorite status
export async function toggleFavorite(userId: string, splitId: string): Promise<void> {
  if (!userId || !splitId) {
    throw new Error('User must be authenticated and split ID must be provided');
  }

  try {
    const splitRef = ref(db, `users/${userId}/splits/${splitId}`);
    const snapshot = await get(splitRef);

    if (!snapshot.exists()) {
      throw new Error('Split not found');
    }

    const split = snapshot.val() as Split;
    await update(splitRef, {
      isFavorite: !split.isFavorite,
      updatedAt: Date.now()
    });
  } catch (error) {
    console.error('Error toggling favorite status:', error);
    throw new Error('Failed to update favorite status');
  }
}

// Helper function to generate default days for a template
function generateDefaultDays(daysPerWeek: number, template: SplitTemplateType): SplitDay[] {
  const days: SplitDay[] = [];

  switch (template) {
    case 'PPL':
      // Push Pull Legs (repeating pattern)
      for (let i = 0; i < daysPerWeek; i++) {
        const cycle = i % 3;
        if (cycle === 0) {
          days.push({
            name: 'Push',
            focus: ['Chest', 'Shoulders', 'Triceps'],
            exercises: [
              { exercise: 'Bench Press', sets: 4, reps: 8 },
              { exercise: 'Overhead Press', sets: 3, reps: 10 },
              { exercise: 'Tricep Pushdowns', sets: 3, reps: 12 }
            ]
          });
        } else if (cycle === 1) {
          days.push({
            name: 'Pull',
            focus: ['Back', 'Biceps', 'Rear Delts'],
            exercises: [
              { exercise: 'Pull-ups', sets: 4, reps: 8 },
              { exercise: 'Barbell Rows', sets: 3, reps: 10 },
              { exercise: 'Bicep Curls', sets: 3, reps: 12 }
            ]
          });
        } else {
          days.push({
            name: 'Legs',
            focus: ['Quads', 'Hamstrings', 'Calves'],
            exercises: [
              { exercise: 'Squats', sets: 4, reps: 8 },
              { exercise: 'Romanian Deadlifts', sets: 3, reps: 10 },
              { exercise: 'Calf Raises', sets: 3, reps: 15 }
            ]
          });
        }
      }
      break;
    
    case 'Arnold':
      // Arnold Split (Chest/Back, Shoulders/Arms, Legs, repeat)
      for (let i = 0; i < daysPerWeek; i++) {
        const cycle = i % 3;
        if (cycle === 0) {
          days.push({
            name: 'Chest & Back',
            focus: ['Chest', 'Back'],
            exercises: [
              { exercise: 'Bench Press', sets: 4, reps: 8 },
              { exercise: 'Pull-ups', sets: 4, reps: 8 },
              { exercise: 'Incline Press', sets: 3, reps: 10 }
            ]
          });
        } else if (cycle === 1) {
          days.push({
            name: 'Shoulders & Arms',
            focus: ['Shoulders', 'Biceps', 'Triceps'],
            exercises: [
              { exercise: 'Overhead Press', sets: 4, reps: 8 },
              { exercise: 'Bicep Curls', sets: 3, reps: 10 },
              { exercise: 'Tricep Pushdowns', sets: 3, reps: 12 }
            ]
          });
        } else {
          days.push({
            name: 'Legs',
            focus: ['Quads', 'Hamstrings', 'Calves'],
            exercises: [
              { exercise: 'Squats', sets: 4, reps: 8 },
              { exercise: 'Romanian Deadlifts', sets: 3, reps: 10 },
              { exercise: 'Calf Raises', sets: 3, reps: 15 }
            ]
          });
        }
      }
      break;
    
    case 'UpperLower':
      // Upper/Lower Split
      for (let i = 0; i < daysPerWeek; i++) {
        const cycle = i % 2;
        if (cycle === 0) {
          days.push({
            name: 'Upper Body',
            focus: ['Chest', 'Back', 'Shoulders', 'Arms'],
            exercises: [
              { exercise: 'Bench Press', sets: 4, reps: 8 },
              { exercise: 'Pull-ups', sets: 4, reps: 8 },
              { exercise: 'Overhead Press', sets: 3, reps: 10 }
            ]
          });
        } else {
          days.push({
            name: 'Lower Body',
            focus: ['Quads', 'Hamstrings', 'Glutes', 'Calves'],
            exercises: [
              { exercise: 'Squats', sets: 4, reps: 8 },
              { exercise: 'Romanian Deadlifts', sets: 3, reps: 10 },
              { exercise: 'Calf Raises', sets: 3, reps: 15 }
            ]
          });
        }
      }
      break;
    
    case 'FullBody':
      // Full Body
      for (let i = 0; i < daysPerWeek; i++) {
        days.push({
          name: `Full Body ${i + 1}`,
          focus: ['Chest', 'Back', 'Legs', 'Arms', 'Core'],
          exercises: [
            { exercise: 'Squats', sets: 3, reps: 8 },
            { exercise: 'Bench Press', sets: 3, reps: 8 },
            { exercise: 'Pull-ups', sets: 3, reps: 8 }
          ]
        });
      }
      break;
    
    case 'Custom':
      // Empty custom template
      for (let i = 0; i < daysPerWeek; i++) {
        days.push({
          name: `Day ${i + 1}`,
          focus: [],
          exercises: []
        });
      }
      break;
    
    case 'Combined':
      // For combined templates, create empty days (will be filled later)
      for (let i = 0; i < daysPerWeek; i++) {
        days.push({
          name: `Day ${i + 1}`,
          focus: [],
          exercises: []
        });
      }
      break;
  }

  return days;
}

// Generate combined template days
export function generateCombinedTemplateDays(
  templates: SplitTemplateType[],
  daysPerTemplate: number[]
): SplitDay[] {
  const days: SplitDay[] = [];
  
  for (let i = 0; i < templates.length; i++) {
    // Get template days and take only the specified number
    const templateDays = generateDefaultDays(daysPerTemplate[i], templates[i]);
    days.push(...templateDays.slice(0, daysPerTemplate[i]));
  }
  
  return days;
}

// Link a split day to a program block
export async function linkSplitDayToProgram(
  userId: string,
  splitId: string,
  dayIndex: number,
  programId: string | null,
  blockId: string | null
): Promise<void> {
  if (!userId || !splitId) {
    throw new Error('User must be authenticated and split ID must be provided');
  }

  try {
    const splitRef = ref(db, `users/${userId}/splits/${splitId}`);
    const snapshot = await get(splitRef);

    if (!snapshot.exists()) {
      throw new Error('Split not found');
    }

    const split = snapshot.val() as Split;
    
    if (dayIndex < 0 || dayIndex >= split.days.length) {
      throw new Error('Invalid day index');
    }

    // If programId is null, we're unlinking
    if (!programId) {
      split.days[dayIndex].programId = undefined;
      split.days[dayIndex].blockId = undefined;
    } else {
      split.days[dayIndex].programId = programId;
      split.days[dayIndex].blockId = blockId || undefined;
    }

    // Update the split with modified days
    await update(splitRef, {
      days: split.days,
      updatedAt: Date.now()
    });
  } catch (error) {
    console.error('Error linking split day to program:', error);
    throw new Error('Failed to link split day to program');
  }
} 