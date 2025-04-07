'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ModernLayout from '@/components/ModernLayout';
import GlassCard from '@/components/GlassCard';
import ModernButton from '@/components/ModernButton';
import { useStore } from '@/lib/zustandStore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { createWorkout } from '@/lib/workout-service';
import toast from 'react-hot-toast';

interface FormData {
  exercise: string;
  weight: number;
  unit: 'kg' | 'lbs';
  reps: number;
  sets: number;
  rpe: number;
  notes: string;
}

const initialFormState: FormData = {
  exercise: '',
  weight: 0,
  unit: 'kg',
  reps: 0,
  sets: 0,
  rpe: 7,
  notes: '',
};

const exercises = ['Squat', 'Bench Press', 'Deadlift', 'Overhead Press', 'Other'];

export default function LogLiftPage() {
  const router = useRouter();
  const { currentUser, setCurrentUser } = useStore();
  const [formData, setFormData] = useState<FormData>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push('/login');
        return;
      }
      setCurrentUser({
        id: user.uid,
        email: user.email || '',
        displayName: user.displayName || '',
        photoURL: user.photoURL || undefined,
      });
    });

    return () => unsubscribe();
  }, [router, setCurrentUser]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.exercise) newErrors.exercise = 'Please select an exercise';
    if (!formData.weight || formData.weight <= 0) newErrors.weight = 'Please enter a valid weight';
    if (!formData.reps || formData.reps <= 0) newErrors.reps = 'Please enter valid reps';
    if (!formData.sets || formData.sets <= 0) newErrors.sets = 'Please enter valid sets';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      if (!currentUser?.id) {
        throw new Error('You must be logged in to log a workout');
      }

      await createWorkout(
        {
          ...formData,
          date: new Date().toISOString().split('T')[0],
        },
        currentUser.id
      );

      toast.success('Workout logged successfully!');
      setFormData(initialFormState);
      setErrors({});
    } catch (error) {
      console.error('Error logging workout:', error);
      toast.error('Failed to log workout. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: ['weight', 'reps', 'sets', 'rpe'].includes(name) ? Number(value) : value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <ModernLayout title="Log Workout" description="Record your lifting progress">
      <div className="max-w-2xl mx-auto space-y-6">
        <GlassCard title="Record Your Lift" colSpan="md:col-span-12">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Exercise Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Exercise
              </label>
              <select
                name="exercise"
                value={formData.exercise}
                onChange={handleInputChange}
                className={`w-full rounded-lg border ${errors.exercise ? 'border-red-500' : 'border-slate-700'} 
                  bg-slate-800/80 text-white p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              >
                <option value="">Select Exercise</option>
                {exercises.map(ex => (
                  <option key={ex} value={ex}>{ex}</option>
                ))}
              </select>
              {errors.exercise && <p className="mt-1 text-sm text-red-500">{errors.exercise}</p>}
            </div>

            {/* Weight Input with Unit Toggle */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Weight
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  name="weight"
                  min="0"
                  step="0.5"
                  value={formData.weight || ''}
                  onChange={handleInputChange}
                  className={`flex-1 rounded-lg border ${errors.weight ? 'border-red-500' : 'border-slate-700'} 
                    bg-slate-800/80 text-white p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="Enter weight"
                />
                <div className="inline-flex rounded-lg overflow-hidden border border-slate-700">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, unit: 'kg' }))}
                    className={`px-4 py-2 text-sm font-medium ${
                      formData.unit === 'kg' 
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white' 
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    kg
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, unit: 'lbs' }))}
                    className={`px-4 py-2 text-sm font-medium ${
                      formData.unit === 'lbs' 
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white' 
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    lbs
                  </button>
                </div>
              </div>
              {errors.weight && <p className="mt-1 text-sm text-red-500">{errors.weight}</p>}
            </div>

            {/* Reps and Sets */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Reps
                </label>
                <input
                  type="number"
                  name="reps"
                  min="1"
                  value={formData.reps || ''}
                  onChange={handleInputChange}
                  className={`w-full rounded-lg border ${errors.reps ? 'border-red-500' : 'border-slate-700'} 
                    bg-slate-800/80 text-white p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="Enter reps"
                />
                {errors.reps && <p className="mt-1 text-sm text-red-500">{errors.reps}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Sets
                </label>
                <input
                  type="number"
                  name="sets"
                  min="1"
                  value={formData.sets || ''}
                  onChange={handleInputChange}
                  className={`w-full rounded-lg border ${errors.sets ? 'border-red-500' : 'border-slate-700'} 
                    bg-slate-800/80 text-white p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="Enter sets"
                />
                {errors.sets && <p className="mt-1 text-sm text-red-500">{errors.sets}</p>}
              </div>
            </div>

            {/* RPE Slider */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                RPE (Rate of Perceived Exertion): {formData.rpe}
              </label>
              <input
                type="range"
                name="rpe"
                min="1"
                max="10"
                value={formData.rpe}
                onChange={handleInputChange}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>1</span>
                <span>5</span>
                <span>10</span>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Notes (optional)
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                className="w-full rounded-lg border border-slate-700 bg-slate-800/80 text-white p-2.5 
                  focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Add any notes about this workout..."
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <ModernButton
                type="submit"
                variant="primary"
                isLoading={isSubmitting}
                disabled={isSubmitting}
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              >
                Log Workout
              </ModernButton>
            </div>
          </form>
        </GlassCard>

        {/* Information Card */}
        <GlassCard title="Tips for Accurate Tracking" colSpan="md:col-span-12">
          <ul className="list-disc pl-5 text-slate-300 space-y-2">
            <li>RPE (Rate of Perceived Exertion) is a scale from 1-10 indicating how difficult the set was</li>
            <li>For compound movements, count only working sets (not warm-up sets)</li>
            <li>Be consistent with your unit of measurement (kg or lbs) for better progress tracking</li>
            <li>Use the notes field to record details like rest times, variations, or how you felt</li>
          </ul>
        </GlassCard>
      </div>
    </ModernLayout>
  );
} 