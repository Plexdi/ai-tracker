'use client';

import React, { useState, useEffect } from 'react';
import { MUSCLE_GROUPS, type MuscleGroup, exerciseNameExists, updateExerciseDetails } from '@/lib/workout-service';
import { toast } from 'react-hot-toast';
import ModernButton from './ModernButton';

interface EditExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  exerciseId: string;
  exerciseName: string;
  muscleGroup: MuscleGroup;
  isDefaultExercise: boolean;
  userId: string;
  onUpdate: () => void;
  workingWeight?: number;
  workingWeightUnit?: 'kg' | 'lbs';
}

export default function EditExerciseModal({
  isOpen,
  onClose,
  exerciseId,
  exerciseName,
  muscleGroup,
  isDefaultExercise,
  userId,
  onUpdate,
  workingWeight,
  workingWeightUnit = 'kg'
}: EditExerciseModalProps) {
  const [name, setName] = useState(exerciseName);
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<MuscleGroup>(muscleGroup);
  const [weight, setWeight] = useState(workingWeight?.toString() || '');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>(workingWeightUnit);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Reset form when modal opens with new data
    if (isOpen) {
      setName(exerciseName);
      setSelectedMuscleGroup(muscleGroup);
      setWeight(workingWeight?.toString() || '');
      setWeightUnit(workingWeightUnit || 'kg');
      setError('');
    }
  }, [isOpen, exerciseName, muscleGroup, workingWeight, workingWeightUnit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Exercise name is required');
      return;
    }

    // Parse working weight if provided
    let parsedWeight: number | undefined = undefined;
    if (weight.trim()) {
      parsedWeight = parseFloat(weight);
      if (isNaN(parsedWeight) || parsedWeight <= 0) {
        setError('Working weight must be a positive number');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      // Check if the name already exists (excluding the current exercise)
      if (name.toLowerCase() !== exerciseName.toLowerCase()) {
        const exists = await exerciseNameExists(userId, name, exerciseId);
        if (exists) {
          setError('An exercise with this name already exists');
          setIsSubmitting(false);
          return;
        }
      }

      // Update the exercise
      await updateExerciseDetails(
        userId,
        exerciseId,
        name,
        selectedMuscleGroup,
        isDefaultExercise,
        parsedWeight,
        parsedWeight ? weightUnit : undefined
      );

      toast.success('Exercise updated successfully');
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating exercise:', error);
      toast.error('Failed to update exercise');
      setError('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md p-6 shadow-xl">
        <h2 className="text-xl font-bold text-white mb-4">
          Edit {isDefaultExercise ? 'Default ' : ''}Exercise
        </h2>

        {isDefaultExercise && (
          <div className="mb-6 p-4 bg-amber-900/20 border border-amber-700/30 rounded-lg">
            <p className="text-amber-300 text-sm">
              <span className="font-semibold">Note:</span> This is a default exercise. Editing it will update all your workout logs that use this exercise name. The change only affects your account's data and won't alter the built-in exercise list.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="exercise-name" className="block text-sm font-medium text-slate-300 mb-1">
              Exercise Name
            </label>
            <input
              id="exercise-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter exercise name"
            />
          </div>

          <div>
            <label htmlFor="muscle-group" className="block text-sm font-medium text-slate-300 mb-1">
              Muscle Group
            </label>
            <select
              id="muscle-group"
              value={selectedMuscleGroup}
              onChange={(e) => setSelectedMuscleGroup(e.target.value as MuscleGroup)}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {MUSCLE_GROUPS.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
          </div>
          
          <div className="pt-2 border-t border-slate-700">
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Current Working Weight
            </label>
            
            <div className="flex space-x-2">
              <div className="flex-1">
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  step="0.25"
                  min="0"
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter weight"
                />
              </div>
              
              <div className="w-24">
                <select
                  value={weightUnit}
                  onChange={(e) => setWeightUnit(e.target.value as 'kg' | 'lbs')}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="kg">kg</option>
                  <option value="lbs">lbs</option>
                </select>
              </div>
            </div>
            
            <p className="mt-1 text-xs text-slate-400">
              This will be used as the default weight when logging this exercise
            </p>
          </div>

          {error && <p className="mt-1 text-sm text-red-500">{error}</p>}

          <div className="flex justify-end space-x-3 mt-6">
            <ModernButton
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </ModernButton>
            <ModernButton
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              disabled={isSubmitting}
            >
              Save Changes
            </ModernButton>
          </div>
        </form>
      </div>
    </div>
  );
} 