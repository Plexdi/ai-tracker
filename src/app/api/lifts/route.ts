import { NextResponse } from 'next/server';
import { getDatabase, ref, push, set, get, child } from 'firebase/database';
import { app } from '@/lib/firebase';
import { LiftLog } from '@/types/types';

const db = getDatabase(app);

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const userId = data.userId || 'unknown';

    const liftRef = push(ref(db, `liftLogs/${userId}`));
    await set(liftRef, {
      ...data,
      id: liftRef.key,
      createdAt: Date.now(),
    });

    return NextResponse.json({
      ...data,
      id: liftRef.key,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to save lift log' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const snapshot = await get(child(ref(db), `liftLogs/${userId}`));

    if (!snapshot.exists()) {
      return NextResponse.json([]);
    }

    const data = snapshot.val();
    const logs: LiftLog[] = Object.keys(data).map((key) => ({
      id: key,
      ...data[key],
    }));

    return NextResponse.json(logs);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch lift logs' },
      { status: 500 }
    );
  }
}
