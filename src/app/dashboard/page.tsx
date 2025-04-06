'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '../../lib/zustandStore';
import { signOut } from '../../lib/firebase';
import ProgressChart from '../../components/ProgressChart';
import WorkoutPlanCard from '../../components/WorkoutPlanCard';
import DashboardLayout from '../../components/DashboardLayout';

// Dummy data for demonstration
const stats = {
  streak: 12,
  todayCalories: 2450,
  weeklyVolume: '12,500 kg',
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
  const { currentUser, currentWeek, workoutPlans, setCurrentUser } = useStore();

  useEffect(() => {
    if (!currentUser) {
      router.push('/login');
    }
  }, [currentUser, router]);

  const handleLogout = async () => {
    try {
      await signOut();
      setCurrentUser(null);
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (!currentUser) {
    return null;
  }

  return (
    <DashboardLayout>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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
          title="Weekly Volume"
          value={stats.weeklyVolume}
          subtitle="📈 +15% vs last week"
          icon="⚖️"
          color="text-purple-600 dark:text-purple-400"
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

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Progress Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              Lift Progress
            </h3>
            <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
              View All
            </button>
          </div>
          <ProgressChart exercise="Squat" />
        </div>

        {/* Workout Plan */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              This Week's Plan
            </h3>
            <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
              View All
            </button>
          </div>
          <div className="space-y-4">
            {workoutPlans
              .filter(plan => plan.week === currentWeek)
              .map(plan => (
                <WorkoutPlanCard key={plan.id} plan={plan} />
              ))}
          </div>
        </div>
      </div>

      {/* Motivational Quote */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-md p-6 text-white">
        <p className="text-lg font-medium leading-relaxed">
          "The only bad workout is the one that didn't happen."
        </p>
        <p className="text-sm mt-2 opacity-80">Daily Motivation</p>
      </div>
    </DashboardLayout>
  );
} 