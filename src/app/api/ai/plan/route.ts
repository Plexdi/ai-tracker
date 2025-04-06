import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { db } from '../../../../lib/firebase';
import { addDoc, collection } from 'firebase/firestore';
import { WorkoutPlan } from '../../../../types/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { userId, focus, experience, daysPerWeek } = await request.json();

    if (!userId || !focus || !experience || !daysPerWeek) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const prompt = `Generate a detailed ${daysPerWeek}-day workout plan for a ${experience} level lifter focusing on ${focus}. 
    Include specific exercises, sets, reps, and RPE for each exercise. Format as JSON.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a professional strength coach. Generate workout plans in valid JSON format."
        },
        {
          role: "user",
          content: prompt
        }
      ],
    });

    const planData = JSON.parse(completion.choices[0].message?.content || '{}');
    
    // Create workout plans for each day
    const plans: WorkoutPlan[] = [];
    for (let day = 1; day <= daysPerWeek; day++) {
      const plan: WorkoutPlan = {
        userId,
        week: 1, // Start with week 1
        day,
        exercises: planData[`day${day}`] || [],
        aiGenerated: true,
        created: new Date().toISOString(),
        id: '' // Will be set after Firestore save
      };

      const docRef = await addDoc(collection(db, 'workoutPlans'), plan);
      plans.push({ ...plan, id: docRef.id });
    }

    return NextResponse.json(plans);
  } catch (error) {
    console.error('Error generating workout plan:', error);
    return NextResponse.json(
      { error: 'Failed to generate workout plan' },
      { status: 500 }
    );
  }
} 