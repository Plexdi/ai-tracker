'use client';

import { useState } from 'react';
import ModernLayout from '@/components/ModernLayout';
import { ProgressChart } from '@/components/ProgressChart';
import { useWorkoutVolume, usePersonalRecords } from '@/hooks/useWorkouts';
import { SUPPORTED_EXERCISES, type SupportedExercise } from '@/lib/workout-service';
import GlassCard from '@/components/GlassCard';
import GridContainer from '@/components/GridContainer';
import ModernButton from '@/components/ModernButton';

type FilterExercise = 'All' | SupportedExercise;

const exercises: FilterExercise[] = ['All', ...SUPPORTED_EXERCISES];

export default function ProgressPage() {
  const [selectedExercise, setSelectedExercise] = useState<FilterExercise>('All');
  const { volume } = useWorkoutVolume(7);
  const { personalRecords } = usePersonalRecords();

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <ModernLayout title="Progress Tracking" description="Track your fitness improvements over time">
      <div className="space-y-8">
        {/* Exercise Filter */}
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/60 rounded-xl p-6">
          <h3 className="text-lg font-medium text-white mb-4">Filter by Exercise</h3>
          <div className="flex flex-wrap gap-2">
            {exercises.map((exercise) => (
              <button
                key={exercise}
                onClick={() => setSelectedExercise(exercise)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedExercise === exercise
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 hover:text-white border border-slate-700'
                }`}
              >
                {exercise}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Overview */}
        <GridContainer>
          {/* Weekly Volume Card */}
          <GlassCard title="Weekly Volume" colSpan="md:col-span-4">
            <div className="flex flex-col">
              <div className="flex items-baseline">
                <p className="text-3xl font-bold text-white">
                  {volume.current.toLocaleString()} kg
                </p>
                <p className={`ml-2 flex items-baseline text-sm font-medium ${
                  volume.percentChange >= 0
                    ? 'text-green-400'
                    : 'text-red-400'
                }`}>
                  <span className="mr-1">
                    {volume.percentChange >= 0 ? '↑' : '↓'}
                  </span>
                  {Math.abs(volume.percentChange)}%
                </p>
              </div>
              <p className="mt-1 text-sm text-slate-400">
                vs last week
              </p>
            </div>
          </GlassCard>

          {/* Latest PR Card */}
          {selectedExercise !== 'All' && personalRecords[selectedExercise] && (
            <GlassCard title={`Latest ${selectedExercise} PR`} colSpan="md:col-span-4">
              <div className="flex flex-col">
                <p className="text-3xl font-bold text-white">
                  {personalRecords[selectedExercise].weight} {personalRecords[selectedExercise].unit}
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  {formatDate(personalRecords[selectedExercise].date)}
                </p>
              </div>
            </GlassCard>
          )}
        </GridContainer>

        {/* Progress Chart */}
        <GlassCard title="Progress Over Time" colSpan="md:col-span-12">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-400">
              Last 10 sessions
            </p>
          </div>
          {selectedExercise === 'All' ? (
            <div className="space-y-6">
              {/* Top row: Squat and Bench Press side by side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Squat chart */}
                <div className="bg-slate-800/50 rounded-xl p-4">
                  <h3 className="text-sm font-medium text-slate-300 mb-4">
                    Squat Progress (Estimated 1RM)
                  </h3>
                  <div className="h-[300px]">
                    <ProgressChart exercise="Squat" />
                  </div>
                </div>
                
                {/* Bench Press chart */}
                <div className="bg-slate-800/50 rounded-xl p-4">
                  <h3 className="text-sm font-medium text-slate-300 mb-4">
                    Bench Press Progress (Estimated 1RM)
                  </h3>
                  <div className="h-[300px]">
                    <ProgressChart exercise="Bench Press" />
                  </div>
                </div>
              </div>
              
              {/* Bottom row: Deadlift full width */}
              <div className="bg-slate-800/50 rounded-xl p-4">
                <h3 className="text-sm font-medium text-slate-300 mb-4">
                  Deadlift Progress (Estimated 1RM)
                </h3>
                <div className="h-[300px]">
                  <ProgressChart exercise="Deadlift" />
                </div>
              </div>
            </div>
          ) : (
            <div className="h-[400px]">
              <h3 className="text-sm font-medium text-slate-300 mb-4">
                {selectedExercise} Progress (Estimated 1RM)
              </h3>
              <ProgressChart exercise={selectedExercise as SupportedExercise} />
            </div>
          )}
        </GlassCard>

        {/* Recent PRs Grid */}
        <GlassCard title="All-Time Personal Records" colSpan="md:col-span-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(personalRecords).map(([exercise, workout]) => (
              <div
                key={exercise}
                className="bg-slate-800/50 rounded-lg p-4"
              >
                <div className="text-sm text-slate-400">{exercise}</div>
                <div className="text-2xl font-bold text-white mt-1">
                  {workout.weight} {workout.unit}
                </div>
                <div className="text-sm text-slate-400 mt-2">
                  {formatDate(workout.date)}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </ModernLayout>
  );
} 