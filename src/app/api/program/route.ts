import { NextResponse } from 'next/server';
import { db } from '../../../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { WorkoutPlan } from '../../../types/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const week = searchParams.get('week');

    if (!userId || !week) {
      return NextResponse.json(
        { error: 'userId and week are required' },
        { status: 400 }
      );
    }

    const q = query(
      collection(db, 'workoutPlans'),
      where('userId', '==', userId),
      where('week', '==', parseInt(week))
    );

    const querySnapshot = await getDocs(q);
    const plans: WorkoutPlan[] = [];
    
    querySnapshot.forEach((doc) => {
      plans.push({
        id: doc.id,
        ...doc.data()
      } as WorkoutPlan);
    });

    return NextResponse.json(plans);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch workout plans' },
      { status: 500 }
    );
  }
} 