'use client';

import React from 'react';
import { useExerciseHistory } from '@/hooks/useWorkouts';
import ExerciseHistoryTable from './ExerciseHistoryTable';
import ModernButton from './ModernButton';

interface ExerciseHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  exerciseName: string;
}

export default function ExerciseHistoryModal({
  isOpen,
  onClose,
  exerciseName
}: ExerciseHistoryModalProps) {
  const { history, loading, error } = useExerciseHistory(exerciseName);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-3xl p-6 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">
            Workout History: {exerciseName}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-6">
          <ExerciseHistoryTable
            history={history}
            loading={loading}
            error={error}
          />
        </div>

        <div className="flex justify-end">
          <ModernButton
            variant="outline"
            onClick={onClose}
          >
            Close
          </ModernButton>
        </div>
      </div>
    </div>
  );
} 