'use client';

import { useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import ProgressChart from '../../components/ProgressChart';

const exercises = ['All', 'Deadlift', 'Squat', 'Bench Press', 'Overhead Press'];

// Dummy lift data
const liftData = {
  Squat: {
    weights: [100, 105, 110, 115, 120],
    dates: ['2024-03-01', '2024-03-08', '2024-03-15', '2024-03-22', '2024-03-29'],
    pr: { weight: 120, date: '2024-03-29' }
  },
  Deadlift: {
    weights: [140, 145, 150, 155, 160],
    dates: ['2024-03-01', '2024-03-08', '2024-03-15', '2024-03-22', '2024-03-29'],
    pr: { weight: 160, date: '2024-03-29' }
  },
  'Bench Press': {
    weights: [60, 65, 67.5, 70, 72.5],
    dates: ['2024-03-01', '2024-03-08', '2024-03-15', '2024-03-22', '2024-03-29'],
    pr: { weight: 72.5, date: '2024-03-29' }
  },
  'Overhead Press': {
    weights: [40, 42.5, 45, 47.5, 50],
    dates: ['2024-03-01', '2024-03-08', '2024-03-15', '2024-03-22', '2024-03-29'],
    pr: { weight: 50, date: '2024-03-29' }
  }
};

// Weekly volume data
const weeklyVolume = {
  current: 12500,
  previous: 11000,
  percentageChange: 13.6
};

export default function ProgressPage() {
  const [selectedExercise, setSelectedExercise] = useState('All');

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
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
                {weeklyVolume.current.toLocaleString()} kg
              </p>
              <p className={`ml-2 flex items-baseline text-sm font-semibold ${
                weeklyVolume.percentageChange >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}>
                <span className="mr-1">
                  {weeklyVolume.percentageChange >= 0 ? '↑' : '↓'}
                </span>
                {Math.abs(weeklyVolume.percentageChange)}%
              </p>
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              vs last week
            </p>
          </div>

          {/* Latest PR Card */}
          {selectedExercise !== 'All' && liftData[selectedExercise as keyof typeof liftData] && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Latest {selectedExercise} PR
              </h3>
              <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
                {liftData[selectedExercise as keyof typeof liftData].pr.weight} kg
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {formatDate(liftData[selectedExercise as keyof typeof liftData].pr.date)}
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
              Last 5 sessions
            </div>
          </div>
          <div className="h-[400px]">
            {selectedExercise === 'All' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(liftData).map(([exercise, data]) => (
                  <div key={exercise} className="h-[200px]">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {exercise}
                    </h3>
                    <ProgressChart exercise={exercise} data={data} />
                  </div>
                ))}
              </div>
            ) : (
              <ProgressChart 
                exercise={selectedExercise} 
                data={liftData[selectedExercise as keyof typeof liftData]} 
              />
            )}
          </div>
        </div>

        {/* Recent PRs Grid */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            All-Time Personal Records
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(liftData).map(([exercise, data]) => (
              <div
                key={exercise}
                className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
              >
                <div className="text-sm text-gray-500 dark:text-gray-400">{exercise}</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {data.pr.weight} kg
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  {formatDate(data.pr.date)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 