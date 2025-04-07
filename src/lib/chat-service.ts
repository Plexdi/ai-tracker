import { getDatabase, ref, push, set, get, query, orderByChild, limitToLast, equalTo } from 'firebase/database';
import app from './firebase';
import { Message, ChatGPTImport } from './types';

const db = getDatabase(app);

export async function createMessage(
  userId: string,
  content: string,
  role: 'user' | 'assistant',
  currentPRs?: Record<string, number>
): Promise<void> {
  if (!userId) {
    throw new Error('User must be authenticated to create a message');
  }

  try {
    const messagesRef = ref(db, `users/${userId}/messages`);
    const newMessageRef = push(messagesRef);
    const now = Date.now();
    const message: Message = {
      id: newMessageRef.key!,
      content,
      type: role, // For backward compatibility
      role,      // New field
      currentPRs,
      createdAt: now,
      timestamp: new Date(now).toISOString() // For backward compatibility
    };

    await set(newMessageRef, message);
  } catch (error) {
    console.error('Error creating message:', error);
    throw new Error('Failed to create message');
  }
}

export async function getRecentMessages(
  userId: string,
  limit: number = 10
): Promise<Message[]> {
  if (!userId) {
    throw new Error('User must be authenticated to get messages');
  }

  try {
    const messagesRef = ref(db, `users/${userId}/messages`);
    const messagesQuery = query(messagesRef, orderByChild('createdAt'), limitToLast(limit));
    const snapshot = await get(messagesQuery);

    if (!snapshot.exists()) {
      return [];
    }

    const messages: Message[] = [];
    snapshot.forEach((childSnapshot) => {
      messages.push(childSnapshot.val() as Message);
    });

    // Sort messages by createdAt in ascending order
    return messages.sort((a, b) => a.createdAt - b.createdAt);
  } catch (error) {
    console.error('Error getting messages:', error);
    throw new Error('Failed to get messages');
  }
}

export async function saveMessage(message: Message, userId: string): Promise<void> {
  if (!userId) {
    throw new Error('User must be authenticated to save messages');
  }

  try {
    const messagesRef = ref(db, `users/${userId}/messages`);
    const newMessageRef = push(messagesRef);
    const now = Date.now();
    
    const messageToSave = {
      ...message,
      id: newMessageRef.key!,
      createdAt: now,
      timestamp: new Date(now).toISOString(), // For backward compatibility
      type: message.type || message.role,     // Ensure type is set
      role: message.role || message.type      // Ensure role is set
    };

    await set(newMessageRef, messageToSave);
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
    // Get the start and end timestamps for the current date
    const startOfDay = new Date(currentDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(currentDate);
    endOfDay.setHours(23, 59, 59, 999);

    const messagesRef = ref(db, `users/${userId}/messages`);
    const messagesQuery = query(
      messagesRef,
      orderByChild('createdAt'),
      // Firebase Realtime Database doesn't support multiple range queries,
      // so we'll filter the results in memory
    );

    const snapshot = await get(messagesQuery);
    if (!snapshot.exists()) {
      return [];
    }

    const messages: Message[] = [];
    snapshot.forEach((childSnapshot) => {
      const message = childSnapshot.val() as Message;
      if (message.createdAt >= startOfDay.getTime() && message.createdAt <= endOfDay.getTime()) {
        messages.push(message);
      }
    });

    // Sort messages by createdAt in ascending order
    return messages.sort((a, b) => a.createdAt - b.createdAt);
  } catch (error) {
    console.error('Error fetching messages:', error);
    // Instead of throwing, return an empty array as a fallback
    return [];
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
    const importsRef = ref(db, `users/${userId}/chatGPTImports`);
    const newImportRef = push(importsRef);
    
    const chatGPTImport: ChatGPTImport = {
      id: newImportRef.key!,
      userId,
      content,
      timestamp: new Date().toISOString(),
      processed: false,
      suggestedPlan: undefined
    };

    await set(newImportRef, chatGPTImport);
  } catch (error) {
    console.error('Error saving ChatGPT import:', error);
    throw new Error('Failed to save ChatGPT import');
  }
} 