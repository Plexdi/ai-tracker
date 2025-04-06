import { useState, useEffect } from 'react';
import { useStore } from '@/lib/zustandStore';
import { Program, TrainingBlock } from '@/lib/types';
import {
  createProgram,
  addTrainingBlock,
  updateTrainingBlock,
  deleteTrainingBlock,
  subscribeToProgram,
  setCurrentBlock,
} from '@/lib/program-service';

interface UseProgramReturn {
  program: Program | null;
  loading: boolean;
  error: string | null;
  createNewProgram: (name: string) => Promise<string>;
  addBlock: (block: Omit<TrainingBlock, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateBlock: (blockId: string, updates: Partial<TrainingBlock>) => Promise<void>;
  deleteBlock: (blockId: string) => Promise<void>;
  setActiveBlock: (blockId: string) => Promise<void>;
}

export function useProgram(programId?: string): UseProgramReturn {
  const currentUser = useStore((state) => state.currentUser);
  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser?.id) {
      setProgram(null);
      setLoading(false);
      return;
    }

    // If no programId is provided, we're in a state where we need to create one
    if (!programId) {
      setProgram(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToProgram(currentUser.id, programId, (newProgram) => {
      setProgram(newProgram);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [currentUser?.id, programId]);

  const createNewProgram = async (name: string) => {
    if (!currentUser?.id) {
      const error = new Error('User must be authenticated');
      setError(error.message);
      throw error;
    }

    setLoading(true);
    setError(null);

    try {
      const newProgramId = await createProgram(currentUser.id, name);
      return newProgramId;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create program';
      setError(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const addBlock = async (block: Omit<TrainingBlock, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!currentUser?.id || !programId) {
      const error = new Error('User must be authenticated and program ID is required');
      setError(error.message);
      throw error;
    }

    setError(null);
    try {
      return await addTrainingBlock(currentUser.id, programId, block);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add training block';
      setError(message);
      throw error;
    }
  };

  const updateBlock = async (blockId: string, updates: Partial<TrainingBlock>) => {
    if (!currentUser?.id || !programId) {
      const error = new Error('User must be authenticated and program ID is required');
      setError(error.message);
      throw error;
    }

    setError(null);
    try {
      await updateTrainingBlock(currentUser.id, programId, blockId, updates);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update training block';
      setError(message);
      throw error;
    }
  };

  const deleteBlock = async (blockId: string) => {
    if (!currentUser?.id || !programId) {
      const error = new Error('User must be authenticated and program ID is required');
      setError(error.message);
      throw error;
    }

    setError(null);
    try {
      await deleteTrainingBlock(currentUser.id, programId, blockId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete training block';
      setError(message);
      throw error;
    }
  };

  const setActiveBlock = async (blockId: string) => {
    if (!currentUser?.id || !programId) {
      const error = new Error('User must be authenticated and program ID is required');
      setError(error.message);
      throw error;
    }

    setError(null);
    try {
      await setCurrentBlock(currentUser.id, programId, blockId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to set active block';
      setError(message);
      throw error;
    }
  };

  return {
    program,
    loading,
    error,
    createNewProgram,
    addBlock,
    updateBlock,
    deleteBlock,
    setActiveBlock,
  };
} 