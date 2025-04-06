'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../components/DashboardLayout';
import { db } from '../../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useStore } from '../../lib/zustandStore';

const exercises = ['Deadlift', 'Squat', 'Bench Press', 'Overhead Press', 'Other'];

const initialFormState = {
  exercise: '',
  customExercise: '',
  weight: '',
  reps: '',
  sets: '',
  rpe: '7',
  date: new Date().toISOString().split('T')[0],
  notes: ''
};

export default function LogLiftPage() {
  const router = useRouter();
  const currentUser = useStore((state) => state.currentUser);
  const [isLoading, setIsLoading] = useState(false);
  const [unit, setUnit] = useState<'kg' | 'lbs'>('kg');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    if (!currentUser) {
      router.push('/login');
    }
  }, [currentUser, router]);

  // Clear toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  if (!currentUser) {
    return null;
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.exercise) newErrors.exercise = 'Please select an exercise';
    if (formData.exercise === 'Other' && !formData.customExercise.trim()) {
      newErrors.customExercise = 'Please enter the exercise name';
    }
    if (!formData.weight) newErrors.weight = 'Please enter weight';
    if (!formData.reps) newErrors.reps = 'Please enter reps';
    if (!formData.sets) newErrors.sets = 'Please enter sets';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent submission if already loading
    if (isLoading) return;

    // Validate form
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const liftData = {
        ...formData,
        exercise: formData.exercise === 'Other' ? formData.customExercise : formData.exercise,
        userId: currentUser.id,
        weight: Number(formData.weight),
        reps: Number(formData.reps),
        sets: Number(formData.sets),
        rpe: Number(formData.rpe),
        unit,
        timestamp: new Date().toISOString()
      };

      await addDoc(collection(db, 'lifts'), liftData);

      setToast({ 
        type: 'success', 
        message: 'Lift logged successfully!' 
      });
      resetForm();
    } catch (error) {
      console.error('Error logging lift:', error);
      setToast({ 
        type: 'error', 
        message: 'Failed to log lift. Please try again.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Log Workout</h1>
        </div>

        {toast && (
          <div className={`p-4 rounded-lg ${
            toast.type === 'success' ? 'bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-100' : 
            'bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-100'
          }`}>
            {toast.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 space-y-6">
          {/* Exercise Selection */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Exercise
              </label>
              <select
                value={formData.exercise}
                onChange={(e) => {
                  setFormData({ 
                    ...formData, 
                    exercise: e.target.value,
                    customExercise: e.target.value === 'Other' ? formData.customExercise : ''
                  });
                  if (e.target.value !== 'Other') {
                    setErrors({ ...errors, customExercise: '' });
                  }
                }}
                className={`w-full rounded-lg border ${errors.exercise ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} 
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2.5 focus:ring-2 focus:ring-blue-500`}
              >
                <option value="">Select Exercise</option>
                {exercises.map(ex => (
                  <option key={ex} value={ex}>{ex}</option>
                ))}
              </select>
              {errors.exercise && <p className="mt-1 text-sm text-red-500">{errors.exercise}</p>}
            </div>

            {/* Custom Exercise Input */}
            {formData.exercise === 'Other' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Custom Exercise Name
                </label>
                <input
                  type="text"
                  value={formData.customExercise}
                  onChange={(e) => setFormData({ ...formData, customExercise: e.target.value })}
                  className={`w-full rounded-lg border ${errors.customExercise ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} 
                    bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2.5 focus:ring-2 focus:ring-blue-500`}
                  placeholder="Enter exercise name"
                />
                {errors.customExercise && (
                  <p className="mt-1 text-sm text-red-500">{errors.customExercise}</p>
                )}
              </div>
            )}
          </div>

          {/* Weight Input with Unit Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Weight
            </label>
            <div className="flex space-x-2">
              <input
                type="number"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                className={`flex-1 rounded-lg border ${errors.weight ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} 
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2.5 focus:ring-2 focus:ring-blue-500`}
                placeholder="Enter weight"
              />
              <div className="inline-flex rounded-lg border border-gray-300 dark:border-gray-600">
                <button
                  type="button"
                  onClick={() => setUnit('kg')}
                  className={`px-4 py-2 text-sm rounded-l-lg ${
                    unit === 'kg' ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  kg
                </button>
                <button
                  type="button"
                  onClick={() => setUnit('lbs')}
                  className={`px-4 py-2 text-sm rounded-r-lg ${
                    unit === 'lbs' ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reps
              </label>
              <input
                type="number"
                value={formData.reps}
                onChange={(e) => setFormData({ ...formData, reps: e.target.value })}
                className={`w-full rounded-lg border ${errors.reps ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} 
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2.5 focus:ring-2 focus:ring-blue-500`}
                placeholder="Enter reps"
              />
              {errors.reps && <p className="mt-1 text-sm text-red-500">{errors.reps}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sets
              </label>
              <input
                type="number"
                value={formData.sets}
                onChange={(e) => setFormData({ ...formData, sets: e.target.value })}
                className={`w-full rounded-lg border ${errors.sets ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} 
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2.5 focus:ring-2 focus:ring-blue-500`}
                placeholder="Enter sets"
              />
              {errors.sets && <p className="mt-1 text-sm text-red-500">{errors.sets}</p>}
            </div>
          </div>

          {/* RPE Slider */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              RPE (Rate of Perceived Exertion): {formData.rpe}
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={formData.rpe}
              onChange={(e) => setFormData({ ...formData, rpe: e.target.value })}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>1</span>
              <span>5</span>
              <span>10</span>
            </div>
          </div>

          {/* Date Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 
                bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2.5 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 
                bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2.5 focus:ring-2 focus:ring-blue-500"
              placeholder="Add any notes about your lift..."
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 px-4 rounded-lg text-white font-medium 
              ${isLoading 
                ? 'bg-blue-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
              } transition-colors`}
          >
            {isLoading ? 'Logging...' : 'Log Lift'}
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
} 