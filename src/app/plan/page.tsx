'use client';

import DashboardLayout from '../../components/DashboardLayout';

// Placeholder data
const currentWeek = {
  weekNumber: 8,
  focus: 'Volume',
  workouts: [
    { day: 'Monday', focus: 'Squat + Deadlift', type: 'Heavy' },
    { day: 'Wednesday', focus: 'Bench + OHP', type: 'Volume' },
    { day: 'Friday', focus: 'Full Body', type: 'Moderate' },
    { day: 'Saturday', focus: 'Accessories', type: 'Light' },
  ],
};

const programBlocks = [
  { week: 'Weeks 1-4', focus: 'Volume', status: 'completed' },
  { week: 'Weeks 5-8', focus: 'Intensity', status: 'current' },
  { week: 'Weeks 9-12', focus: 'Peak', status: 'upcoming' },
];

export default function PlanPage() {
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Current Program</h1>
          <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
            Edit Plan
          </button>
        </div>

        {/* Current Week Overview */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Week {currentWeek.weekNumber}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Focus: {currentWeek.focus}
              </p>
            </div>
            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full text-sm">
              Current Week
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {currentWeek.workouts.map((workout, index) => (
              <div
                key={index}
                className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
              >
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {workout.day}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {workout.focus}
                </div>
                <div className="mt-2">
                  <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                    workout.type === 'Heavy' ? 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300' :
                    workout.type === 'Volume' ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300' :
                    workout.type === 'Moderate' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-300' :
                    'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300'
                  }`}>
                    {workout.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Program Blocks */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Program Blocks
          </h2>
          <div className="space-y-4">
            {programBlocks.map((block, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {block.week}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Focus: {block.focus}
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  block.status === 'completed' ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300' :
                  block.status === 'current' ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300' :
                  'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                }`}>
                  {block.status.charAt(0).toUpperCase() + block.status.slice(1)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Notes Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Program Notes
          </h2>
          <div className="prose dark:prose-invert max-w-none">
            <p className="text-gray-600 dark:text-gray-300">
              This is a 12-week progressive overload program focused on the main compound lifts.
              Each block builds upon the previous one, with varying intensity and volume to optimize gains
              and prevent plateaus.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 