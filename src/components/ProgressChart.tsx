'use client';

import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  Scale,
  ScaleOptionsByType,
} from 'chart.js';
import { useWorkouts } from '@/hooks/useWorkouts';
import { Workout } from '@/lib/types';
import { SupportedExercise } from '@/lib/workout-service';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface ProgressChartProps {
  exercise: SupportedExercise;
}

export function ProgressChart({ exercise }: ProgressChartProps) {
  const { workouts, loading, error } = useWorkouts({ 
    exerciseFilter: exercise,
    limitCount: 10 
  });

  if (loading) {
    return <div className="animate-pulse h-64 bg-gray-200 dark:bg-gray-800 rounded-lg" />;
  }

  if (error) {
    return <div className="text-red-500">Error loading workout data: {error}</div>;
  }

  const exerciseWorkouts = workouts[exercise] || [];

  if (!exerciseWorkouts.length) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
        No workout data available for {exercise}
      </div>
    );
  }

  // Sort workouts by date
  const sortedWorkouts = [...exerciseWorkouts].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Prepare chart data
  const data: ChartData<'line'> = {
    labels: sortedWorkouts.map(workout => {
      const date = new Date(workout.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }),
    datasets: [{
      label: 'Estimated 1RM',
      data: sortedWorkouts.map(workout => {
        // Convert all weights to kg for consistency
        const weight = workout.unit === 'lbs' 
          ? workout.weight * 0.453592 
          : workout.weight;
        // Estimate 1RM using Brzycki formula
        return Math.round(weight * (36 / (37 - workout.reps)));
      }),
      borderColor: 'rgb(59, 130, 246)', // Blue-500
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      borderWidth: 2,
      pointBackgroundColor: 'rgb(59, 130, 246)',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
      tension: 0.3,
      fill: true
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.9)',
        titleColor: 'rgb(243, 244, 246)',
        bodyColor: 'rgb(243, 244, 246)',
        padding: 12,
        borderColor: 'rgba(75, 85, 99, 0.3)',
        borderWidth: 1,
        displayColors: false,
        callbacks: {
          title: (items: any) => {
            if (!items.length) return '';
            const idx = items[0].dataIndex;
            const workout = sortedWorkouts[idx];
            return new Date(workout.date).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            });
          },
          label: (item: any) => {
            const workout = sortedWorkouts[item.dataIndex];
            const e1RM = item.raw;
            return [
              `1RM: ${e1RM} kg`,
              `Weight: ${workout.weight} ${workout.unit}`,
              `Sets: ${workout.sets} × ${workout.reps} reps`
            ];
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 11
          }
        }
      },
      y: {
        beginAtZero: false,
        grid: {
          color: 'rgba(75, 85, 99, 0.1)'
        },
        ticks: {
          font: {
            size: 11
          },
          callback: function(value: number | string) {
            if (typeof value === 'number') {
              return `${value} kg`;
            }
            return value;
          }
        }
      }
    }
  } as const;

  return (
    <div className="h-full w-full min-h-[200px]">
      <Line data={data} options={options} />
    </div>
  );
} 