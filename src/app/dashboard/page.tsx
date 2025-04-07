'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/zustandStore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { ProgressChart } from '@/components/ProgressChart';
import { useWorkoutVolume, usePersonalRecords, useWorkoutsByExercise } from '@/hooks/useWorkouts';
import { SUPPORTED_EXERCISES, SupportedExercise } from '@/lib/workout-service';
import DashboardLayout from '../../components/DashboardLayout';
import DashboardHorizontalProfile from '@/components/DashboardHorizontalProfile';
import ModernLayout from '@/components/ModernLayout';
import GlassCard from '@/components/GlassCard';
import GridContainer from '@/components/GridContainer';
import ActionLink from '@/components/ActionLink';
import StatItem from '@/components/StatItem';
import ModernButton from '@/components/ModernButton';

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

export default function Dashboard() {
  const router = useRouter();
  const setCurrentUser = useStore((state) => state.setCurrentUser);
  const { volume, loading: volumeLoading } = useWorkoutVolume(7);
  const { personalRecords, loading: prLoading } = usePersonalRecords();
  const { workouts: groupedWorkouts, loading: workoutsLoading } = useWorkoutsByExercise();
  const { currentUser } = useStore();
  const [recentWorkouts, setRecentWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    // Simulate loading data
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  // Check if any SBD workouts exist
  const hasWorkouts = !workoutsLoading && groupedWorkouts && 
    Object.values(groupedWorkouts).some(workoutList => workoutList.length > 0);

  const exercises: SupportedExercise[] = groupedWorkouts 
    ? SUPPORTED_EXERCISES.filter(exercise => groupedWorkouts[exercise]?.length > 0)
    : [];

  return (
    <ModernLayout
      title="Dashboard"
      description="Your fitness journey at a glance"
    >
      {/* Profile Section */}
      <section className="mb-8">
        <DashboardHorizontalProfile />
      </section>

      {/* Main Dashboard Content */}
      <GridContainer>
        {/* Workout Summary */}
        <GlassCard
          title={hasWorkouts ? "Recent Workouts" : "Workout Summary"}
          colSpan="md:col-span-8"
        >
          {loading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-12 bg-slate-700 rounded"></div>
              <div className="h-12 bg-slate-700 rounded"></div>
              <div className="h-12 bg-slate-700 rounded"></div>
            </div>
          ) : hasWorkouts ? (
            <div className="space-y-4">
              {/* Workout data would go here */}
              <p>Your workout data will appear here</p>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-400 mb-4">You haven't logged any workouts yet</p>
              <ModernButton 
                variant="primary"
                onClick={() => router.push('/log-lift')}
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                }
              >
                Log Your First Workout
              </ModernButton>
            </div>
          )}
        </GlassCard>

        {/* Quick Stats */}
        <GlassCard
          title="Quick Stats"
          colSpan="md:col-span-4"
        >
          <div className="space-y-1">
            <StatItem label="Total Workouts" value={exercises.length > 0 ? `${exercises.length}` : "0"} />
            <StatItem label="This Week" value="0" />
            <StatItem label="Last Workout" value="Never" divider={false} />
          </div>
        </GlassCard>

        {/* Quick Actions */}
        <GlassCard
          title="Quick Actions"
          colSpan="md:col-span-4"
        >
          <div className="space-y-2">
            <ActionLink 
              href="/log-lift" 
              icon={
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              }
            >
              Log a Workout
            </ActionLink>
            <ActionLink 
              href="/plan" 
              icon={
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              }
            >
              Create a Workout Plan
            </ActionLink>
            <ActionLink 
              href="/exercises" 
              icon={
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              }
            >
              Manage Exercises
            </ActionLink>
          </div>
        </GlassCard>

        {/* Fitness Goals */}
        <GlassCard
          title="Your Fitness Goals"
          colSpan="md:col-span-4"
        >
          <div className="border border-dashed border-slate-700 rounded-lg p-4 text-center">
            <p className="text-slate-400 text-sm">Set fitness goals in your profile</p>
            <ActionLink 
              href="/profile" 
              icon={
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              }
              className="justify-center mt-2"
            >
              Update Profile
            </ActionLink>
          </div>
        </GlassCard>

        {/* AI Assistant Suggestion */}
        <GlassCard
          title="AI Assistant"
          colSpan="md:col-span-4"
          className="bg-gradient-to-br from-slate-900/90 to-blue-900/20"
        >
          <p className="text-slate-300 mb-3">Get personalized workout recommendations and nutrition advice from our AI assistant</p>
          <ModernButton 
            variant="primary"
            onClick={() => router.push('/ai')}
            className="w-full"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            }
          >
            Chat with AI Assistant
          </ModernButton>
        </GlassCard>
      </GridContainer>
    </ModernLayout>
  );
} 