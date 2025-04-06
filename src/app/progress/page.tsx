'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { ProgressChart } from '@/components/ProgressChart';
import { useWorkoutVolume, usePersonalRecords } from '@/hooks/useWorkouts';

const exercises = ['All', 'Deadlift', 'Squat', 'Bench Press'];

export default function ProgressPage() {
  const [selectedExercise, setSelectedExercise] = useState<string>('All');
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
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Progress Tracking</h1>
        </div>

        {/* Exercise Filter */}
        <div className="flex flex-wrap gap-2">
          {exercises.map((exercise) => (
            <button
              key={exercise}
              onClick={() => setSelectedExercise(exercise)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedExercise === exercise
                  ? 'bg-blue-500 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {exercise}
            </button>
          ))}
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Weekly Volume Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Weekly Volume</h3>
            <div className="mt-2 flex items-baseline">
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {volume.current.toLocaleString()} kg
              </p>
              <p className={`ml-2 flex items-baseline text-sm font-semibold ${
                volume.percentChange >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}>
                <span className="mr-1">
                  {volume.percentChange >= 0 ? '↑' : '↓'}
                </span>
                {Math.abs(volume.percentChange)}%
              </p>
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              vs last week
            </p>
          </div>

          {/* Latest PR Card */}
          {selectedExercise !== 'All' && personalRecords[selectedExercise] && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Latest {selectedExercise} PR
              </h3>
              <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
                {personalRecords[selectedExercise].weight} {personalRecords[selectedExercise].unit}
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {formatDate(personalRecords[selectedExercise].date)}
              </p>
            </div>
          )}
        </div>

        {/* Progress Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Progress Over Time
            </h2>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Last 10 sessions
            </div>
          </div>
          {selectedExercise === 'All' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {exercises.filter(e => e !== 'All').map(exercise => (
                <div key={exercise} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                    {exercise} Progress (Estimated 1RM)
                  </h3>
                  <div className="h-[300px]">
                    <ProgressChart exercise={exercise} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-[400px]">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                {selectedExercise} Progress (Estimated 1RM)
              </h3>
              <ProgressChart exercise={selectedExercise} />
            </div>
          )}
        </div>

        {/* Recent PRs Grid */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            All-Time Personal Records
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(personalRecords).map(([exercise, workout]) => (
              <div
                key={exercise}
                className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4"
              >
                <div className="text-sm text-gray-500 dark:text-gray-400">{exercise}</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {workout.weight} {workout.unit}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  {formatDate(workout.date)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 