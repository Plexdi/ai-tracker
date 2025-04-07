'use client';

import React from 'react';
import { Workout } from '@/lib/types';
import { format } from 'date-fns';

interface ExerciseHistoryTableProps {
  history: Workout[];
  loading: boolean;
  error: string | null;
}

export default function ExerciseHistoryTable({ history, loading, error }: ExerciseHistoryTableProps) {
  // Calculate 1RM using Epley formula: 1RM = weight × (1 + reps / 30)
  const calculate1RM = (weight: number, reps: number, unit: 'kg' | 'lbs'): string => {
    const oneRM = weight * (1 + reps / 30);
    return `${oneRM.toFixed(1)} ${unit}`;
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-6 bg-slate-700 rounded w-1/4"></div>
        <div className="h-32 bg-slate-700/50 rounded"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (history.length === 0) {
    return <div className="text-slate-400">No workout history found for this exercise.</div>;
  }

  // Find best weight lifted
  const bestWeight = history.reduce((max, workout) => {
    const current = workout.weight;
    return current > max ? current : max;
  }, 0);

  return (
    <div className="space-y-4">
      <div className="bg-slate-800/50 p-3 rounded-lg">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-xs text-slate-400">Best Weight Lifted</span>
            <p className="text-lg font-medium text-white">
              {bestWeight} {history[0]?.unit}
            </p>
          </div>
          <div>
            <span className="text-xs text-slate-400">Estimated 1RM (Epley)</span>
            <p className="text-lg font-medium text-white">
              {calculate1RM(
                history[0]?.weight || 0, 
                history[0]?.reps || 0, 
                history[0]?.unit || 'kg'
              )}
            </p>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-700">
          <thead className="bg-slate-800/50">
            <tr>
              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                Date
              </th>
              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                Weight
              </th>
              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                Reps × Sets
              </th>
              {history.some(w => w.rpe) && (
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  RPE
                </th>
              )}
              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                Est. 1RM
              </th>
            </tr>
          </thead>
          <tbody className="bg-slate-900/30 divide-y divide-slate-800">
            {history.map((workout) => (
              <tr key={workout.id} className="hover:bg-slate-800/30">
                <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-300">
                  {format(new Date(workout.date), 'yyyy-MM-dd')}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-300">
                  {workout.weight} {workout.unit}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-300">
                  {workout.reps} × {workout.sets}
                </td>
                {history.some(w => w.rpe) && (
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-300">
                    {workout.rpe || '-'}
                  </td>
                )}
                <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-300">
                  {calculate1RM(workout.weight, workout.reps, workout.unit)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 