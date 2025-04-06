import { collection, addDoc, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from './firebase';
import { Message, ChatGPTImport, Workout } from './types';
import { getRecentWorkouts, getPersonalRecords, getWeeklyVolume } from './workout-service';

export async function saveMessage(message: Message, userId: string): Promise<void> {
  if (!userId) {
    throw new Error('User must be authenticated to save messages');
  }

  try {
    // Get workout context for AI responses
    if (message.type === 'assistant') {
      const [recentWorkouts, prs, weeklyVolume] = await Promise.all([
        getRecentWorkouts(userId),
        getPersonalRecords(userId),
        getWeeklyVolume(userId)
      ]);

      // Transform PRs into Record<string, number> using Brzycki formula for 1RM
      const currentPRs: Record<string, number> = Object.fromEntries(
        Object.entries(prs).map(([exercise, workout]) => {
          const weight = workout.unit === 'lbs' ? workout.weight * 0.453592 : workout.weight;
          // Estimate 1RM using Brzycki formula
          const oneRM = weight * (36 / (37 - workout.reps));
          return [exercise, Math.round(oneRM)];
        })
      );

      message.workoutContext = {
        recentWorkouts,
        currentPRs,
        weeklyVolume: weeklyVolume.currentWeek
      };
    }

    await addDoc(collection(db, 'chatMessages'), {
      ...message,
      userId,
    });
  } catch (error) {
    console.error('Error saving message:', error);
    throw new Error('Failed to save message');
  }
}

export async function getTodayMessages(userId: string, currentDate: string): Promise<Message[]> {
  if (!userId) {
    throw new Error('User must be authenticated to fetch messages');
  }

  try {
    const chatQuery = query(
      collection(db, 'chatMessages'),
      where('userId', '==', userId),
      where('sessionDate', '==', currentDate),
      orderBy('timestamp', 'asc')
    );

    const querySnapshot = await getDocs(chatQuery);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: data.id,
        type: data.type,
        content: data.content,
        timestamp: data.timestamp,
        sessionDate: data.sessionDate,
        workoutContext: data.workoutContext,
      };
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw new Error('Failed to fetch messages');
  }
}

export async function saveChatGPTImport(
  content: string, 
  userId: string
): Promise<void> {
  if (!userId) {
    throw new Error('User must be authenticated to save imports');
  }

  try {
    await addDoc(collection(db, 'chatGPTImports'), {
      userId,
      content,
      timestamp: new Date().toISOString(),
      processed: false,
      suggestedPlan: null // Will be processed by AI later
    });
  } catch (error) {
    console.error('Error saving ChatGPT import:', error);
    throw new Error('Failed to save ChatGPT import');
  }
}

export async function getLatestChatGPTImport(userId: string): Promise<ChatGPTImport | null> {
  if (!userId) return null;

  try {
    const importQuery = query(
      collection(db, 'chatGPTImports'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(1)
    );

    const querySnapshot = await getDocs(importQuery);
    if (querySnapshot.empty) return null;

    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    } as ChatGPTImport;
  } catch (error) {
    console.error('Error fetching latest import:', error);
    return null;
  }
} 