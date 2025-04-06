'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/zustandStore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { ProgressChart } from '@/components/ProgressChart';
import { useWorkoutVolume, usePersonalRecords, useWorkoutsByExercise } from '@/hooks/useWorkouts';
import { SUPPORTED_EXERCISES, SupportedExercise } from '@/lib/workout-service';
import DashboardLayout from '../../components/DashboardLayout';

// Dummy data for demonstration
const stats = {
  streak: 12,
  todayCalories: 2450,
  monthlyWorkouts: 15,
  prProgress: 85,
  nextWorkout: '2h 15m',
};

interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtitle: string;
  icon: string;
  color: string;
}

const StatCard = ({ title, value, unit, subtitle, icon, color }: StatCardProps) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 transition-shadow hover:shadow-lg">
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</h3>
      <span className="text-lg opacity-75">{icon}</span>
    </div>
    <div className="mb-2">
      <div className="flex items-baseline space-x-2">
        <span className={`text-2xl font-bold ${color}`}>{value}</span>
        {unit && <span className="text-sm text-gray-500 dark:text-gray-400">{unit}</span>}
      </div>
    </div>
    <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
  </div>
);

export default function DashboardPage() {
  const router = useRouter();
  const setCurrentUser = useStore((state) => state.setCurrentUser);
  const { volume, loading: volumeLoading } = useWorkoutVolume(7);
  const { personalRecords, loading: prLoading } = usePersonalRecords();
  const { workouts: groupedWorkouts, loading: workoutsLoading } = useWorkoutsByExercise();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push('/login');
        return;
      }
      setCurrentUser({ 
        id: user.uid, 
        email: user.email || 'Anonymous User',
        displayName: user.displayName || 'Anonymous User',
        photoURL: user.photoURL || undefined
      });
    });

    return () => unsubscribe();
  }, [router, setCurrentUser]);

  const exercises: SupportedExercise[] = groupedWorkouts 
    ? SUPPORTED_EXERCISES.filter(exercise => groupedWorkouts[exercise]?.length > 0)
    : [];

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Volume Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Weekly Volume</h3>
            {volumeLoading ? (
              <div className="animate-pulse h-16 bg-gray-200 dark:bg-gray-700 rounded" />
            ) : (
              <div>
                <p className="text-3xl font-bold">{volume.current.toLocaleString()} kg</p>
                <p className={`text-sm ${volume.percentChange > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {volume.percentChange > 0 ? '↑' : '↓'} {Math.abs(volume.percentChange)}% from last week
                </p>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Active Exercises</h3>
            {workoutsLoading ? (
              <div className="animate-pulse h-16 bg-gray-200 dark:bg-gray-700 rounded" />
            ) : (
              <div>
                <p className="text-3xl font-bold">{exercises.length}</p>
                <p className="text-sm text-gray-500">Different exercises tracked</p>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Personal Records</h3>
            {prLoading ? (
              <div className="animate-pulse h-16 bg-gray-200 dark:bg-gray-700 rounded" />
            ) : (
              <div>
                <p className="text-3xl font-bold">{Object.keys(personalRecords).length}</p>
                <p className="text-sm text-gray-500">PRs achieved</p>
              </div>
            )}
          </div>
        </div>

        {/* Progress Charts */}
        <div className="space-y-6">
          {exercises.map(exercise => (
            <div key={exercise} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">{exercise} Progress</h3>
              <ProgressChart exercise={exercise} />
            </div>
          ))}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard
            title="Training Streak"
            value={stats.streak}
            unit="days"
            subtitle="🔥 Keep it up!"
            icon="🎯"
            color="text-blue-600 dark:text-blue-400"
          />
          <StatCard
            title="Today's Progress"
            value={stats.todayCalories}
            unit="kcal"
            subtitle="💪 Daily Goal: 2500 kcal"
            icon="📊"
            color="text-green-600 dark:text-green-400"
          />
          <StatCard
            title="Monthly Workouts"
            value={stats.monthlyWorkouts}
            unit="sessions"
            subtitle="🎯 Goal: 20 sessions"
            icon="📅"
            color="text-orange-600 dark:text-orange-400"
          />
          <StatCard
            title="PR Progress"
            value={`${stats.prProgress}%`}
            subtitle="🏋️‍♂️ Bench Press Goal"
            icon="💪"
            color="text-red-600 dark:text-red-400"
          />
          <StatCard
            title="Next Workout"
            value={stats.nextWorkout}
            subtitle="⏰ Leg Day"
            icon="🕒"
            color="text-indigo-600 dark:text-indigo-400"
          />
        </div>

        {/* Motivational Quote */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-md p-6 text-white">
          <p className="text-lg font-medium leading-relaxed">
            "The only bad workout is the one that didn't happen."
          </p>
          <p className="text-sm mt-2 opacity-80">Daily Motivation</p>
        </div>
      </div>
    </DashboardLayout>
  );
} 