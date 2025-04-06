import { NextResponse } from 'next/server';
import { getDatabase, ref, get, query, orderByChild, equalTo } from 'firebase/database';
import app from '@/lib/firebase';
import { Program } from '@/lib/types';

const db = getDatabase(app);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const programsRef = ref(db, `users/${userId}/programs`);
    const snapshot = await get(programsRef);

    if (!snapshot.exists()) {
      return NextResponse.json({ programs: [] });
    }

    const programs: Program[] = [];
    snapshot.forEach((childSnapshot) => {
      programs.push(childSnapshot.val() as Program);
    });

    return NextResponse.json({ programs });
  } catch (error) {
    console.error('Error fetching programs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch programs' },
      { status: 500 }
    );
  }
} 