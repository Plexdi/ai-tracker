import { getDatabase, ref, push, set, get, query, orderByChild, limitToLast } from 'firebase/database';
import app from './firebase';
import { Message, Workout } from './types';

const db = getDatabase(app);

export async function createMessage(
  userId: string,
  content: string,
  role: 'user' | 'assistant',
  currentPRs: Record<string, number>
): Promise<void> {
  if (!userId) {
    throw new Error('User must be authenticated to create a message');
  }

  try {
    const messagesRef = ref(db, `users/${userId}/messages`);
    const newMessageRef = push(messagesRef);
    const message: Message = {
      id: newMessageRef.key!,
      content,
      role,
      currentPRs,
      createdAt: Date.now()
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