import { NextResponse } from 'next/server';
import { db } from '../../../lib/firebase';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { LiftLog } from '../../../types/types';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const docRef = await addDoc(collection(db, 'liftLogs'), data);
    
    return NextResponse.json({ 
      ...data, 
      id: docRef.id 
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

    const q = query(
      collection(db, 'liftLogs'),
      where('userId', '==', userId)
    );

    const querySnapshot = await getDocs(q);
    const logs: LiftLog[] = [];
    
    querySnapshot.forEach((doc) => {
      logs.push({
        id: doc.id,
        ...doc.data()
      } as LiftLog);
    });

    return NextResponse.json(logs);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch lift logs' },
      { status: 500 }
    );
  }
} 