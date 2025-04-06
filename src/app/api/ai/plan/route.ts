import { NextResponse } from 'next/server';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { userId, goals, experience, preferences } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User must be authenticated' }, { status: 401 });
    }

    const prompt = `Create a training program based on the following:
Goals: ${goals}
Experience Level: ${experience}
Preferences: ${preferences}

Please provide a structured program that includes:
1. Weekly schedule
2. Exercise selection
3. Sets and reps
4. Progressive overload strategy
5. Recovery recommendations`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a professional fitness coach creating personalized training programs."
        },
        {
          role: "user",
          content: prompt
        }
      ],
    });

    const programSuggestion = completion.choices[0]?.message?.content;

    if (!programSuggestion) {
      throw new Error('Failed to generate program');
    }

    // Save the generated program to Firestore
    const programsRef = collection(db, `users/${userId}/programs`);
    const newProgram = {
      userId,
      name: 'AI Generated Program',
      suggestion: programSuggestion,
      goals,
      experience,
      preferences,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      blocks: []
    };

    const docRef = await addDoc(programsRef, newProgram);

    return NextResponse.json({
      programId: docRef.id,
      suggestion: programSuggestion
    });
  } catch (error) {
    console.error('Error generating program:', error);
    return NextResponse.json(
      { error: 'Failed to generate program' },
      { status: 500 }
    );
  }
} 