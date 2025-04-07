import { useState, useEffect } from 'react';
import { Split, SplitTemplateType, SplitDay } from '@/lib/types';
import { 
  createSplit, 
  getUserSplits, 
  getSplit, 
  updateSplit, 
  deleteSplit, 
  toggleFavorite, 
  generateCombinedTemplateDays,
  linkSplitDayToProgram
} from '@/lib/split-service';
import { toast } from 'react-hot-toast';

export function useSplits(userId?: string) {
  const [splits, setSplits] = useState<Split[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSplit, setSelectedSplit] = useState<Split | null>(null);

  // Load all splits for the user
  useEffect(() => {
    const loadSplits = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const userSplits = await getUserSplits(userId);
        setSplits(userSplits);
        setError(null);
      } catch (error) {
        console.error('Error loading splits:', error);
        setError('Failed to load splits');
        toast.error('Failed to load splits');
      } finally {
        setLoading(false);
      }
    };

    loadSplits();
  }, [userId]);

  // Create a new split
  const createNewSplit = async (
    name: string,
    daysPerWeek: number,
    template: SplitTemplateType,
    days: SplitDay[] = [],
    combinedTemplates?: {
      templates: SplitTemplateType[];
      daysPerTemplate: number[];
    }
  ): Promise<string> => {
    if (!userId) {
      throw new Error('User must be authenticated to create a split');
    }

    try {
      // For combined templates, generate the days based on the selected templates
      let splitDays = days;
      if (template === 'Combined' && combinedTemplates) {
        splitDays = generateCombinedTemplateDays(
          combinedTemplates.templates,
          combinedTemplates.daysPerTemplate
        );
      }

      const splitId = await createSplit(
        userId,
        name,
        daysPerWeek,
        template,
        splitDays,
        combinedTemplates
      );

      // Refresh the splits list
      const userSplits = await getUserSplits(userId);
      setSplits(userSplits);

      // Select the new split
      const newSplit = await getSplit(userId, splitId);
      if (newSplit) {
        setSelectedSplit(newSplit);
      }

      return splitId;
    } catch (error) {
      console.error('Error creating split:', error);
      const message = error instanceof Error ? error.message : 'Failed to create split';
      setError(message);
      toast.error(message);
      throw error;
    }
  };

  // Load a specific split
  const loadSplit = async (splitId: string): Promise<void> => {
    if (!userId) {
      throw new Error('User must be authenticated to load a split');
    }

    try {
      setLoading(true);
      const split = await getSplit(userId, splitId);
      if (split) {
        setSelectedSplit(split);
        setError(null);
      } else {
        setError('Split not found');
        toast.error('Split not found');
      }
    } catch (error) {
      console.error('Error loading split:', error);
      const message = error instanceof Error ? error.message : 'Failed to load split';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // Update a split
  const updateSplitDetails = async (
    splitId: string,
    updates: Partial<Omit<Split, 'id' | 'userId' | 'createdAt'>>
  ): Promise<void> => {
    if (!userId) {
      throw new Error('User must be authenticated to update a split');
    }

    try {
      await updateSplit(userId, splitId, updates);
      
      // Refresh the splits list
      const userSplits = await getUserSplits(userId);
      setSplits(userSplits);
      
      // Refresh the selected split if it's the one that was updated
      if (selectedSplit && selectedSplit.id === splitId) {
        const updatedSplit = await getSplit(userId, splitId);
        if (updatedSplit) {
          setSelectedSplit(updatedSplit);
        }
      }
      
      toast.success('Split updated successfully');
    } catch (error) {
      console.error('Error updating split:', error);
      const message = error instanceof Error ? error.message : 'Failed to update split';
      setError(message);
      toast.error(message);
      throw error;
    }
  };

  // Delete a split
  const deleteSplitById = async (splitId: string): Promise<void> => {
    if (!userId) {
      throw new Error('User must be authenticated to delete a split');
    }

    try {
      await deleteSplit(userId, splitId);
      
      // Remove from the list
      setSplits(splits.filter(split => split.id !== splitId));
      
      // Clear selected split if it was deleted
      if (selectedSplit && selectedSplit.id === splitId) {
        setSelectedSplit(null);
      }
      
      toast.success('Split deleted successfully');
    } catch (error) {
      console.error('Error deleting split:', error);
      const message = error instanceof Error ? error.message : 'Failed to delete split';
      setError(message);
      toast.error(message);
      throw error;
    }
  };

  // Toggle favorite status
  const toggleSplitFavorite = async (splitId: string): Promise<void> => {
    if (!userId) {
      throw new Error('User must be authenticated to toggle favorite status');
    }

    try {
      await toggleFavorite(userId, splitId);
      
      // Update the splits list
      const userSplits = await getUserSplits(userId);
      setSplits(userSplits);
      
      // Update the selected split if it's the one that was toggled
      if (selectedSplit && selectedSplit.id === splitId) {
        const updatedSplit = await getSplit(userId, splitId);
        if (updatedSplit) {
          setSelectedSplit(updatedSplit);
        }
      }
    } catch (error) {
      console.error('Error toggling favorite status:', error);
      const message = error instanceof Error ? error.message : 'Failed to update favorite status';
      setError(message);
      toast.error(message);
      throw error;
    }
  };

  // Update a day in a split
  const updateSplitDay = async (
    splitId: string,
    dayIndex: number,
    dayUpdates: Partial<SplitDay>
  ): Promise<void> => {
    if (!userId) {
      throw new Error('User must be authenticated to update a split day');
    }

    try {
      // Get the current split
      const currentSplit = await getSplit(userId, splitId);
      if (!currentSplit) {
        throw new Error('Split not found');
      }
      
      if (dayIndex < 0 || dayIndex >= currentSplit.days.length) {
        throw new Error('Invalid day index');
      }
      
      // Update the day
      const updatedDays = [...currentSplit.days];
      updatedDays[dayIndex] = {
        ...updatedDays[dayIndex],
        ...dayUpdates
      };
      
      // Update the split
      await updateSplit(userId, splitId, { days: updatedDays });
      
      // Refresh the splits list
      const userSplits = await getUserSplits(userId);
      setSplits(userSplits);
      
      // Refresh the selected split if it's the one that was updated
      if (selectedSplit && selectedSplit.id === splitId) {
        const updatedSplit = await getSplit(userId, splitId);
        if (updatedSplit) {
          setSelectedSplit(updatedSplit);
        }
      }
      
      toast.success('Split day updated successfully');
    } catch (error) {
      console.error('Error updating split day:', error);
      const message = error instanceof Error ? error.message : 'Failed to update split day';
      setError(message);
      toast.error(message);
      throw error;
    }
  };

  // Link a split day to a program/block
  const linkDayToProgram = async (
    splitId: string,
    dayIndex: number,
    programId: string | null,
    blockId: string | null
  ): Promise<void> => {
    if (!userId) {
      throw new Error('User must be authenticated to link a split day to a program');
    }

    try {
      await linkSplitDayToProgram(userId, splitId, dayIndex, programId, blockId);
      
      // Refresh the selected split
      if (selectedSplit && selectedSplit.id === splitId) {
        const updatedSplit = await getSplit(userId, splitId);
        if (updatedSplit) {
          setSelectedSplit(updatedSplit);
        }
      }
      
      toast.success('Split day linked to program successfully');
    } catch (error) {
      console.error('Error linking split day to program:', error);
      const message = error instanceof Error ? error.message : 'Failed to link split day to program';
      setError(message);
      toast.error(message);
      throw error;
    }
  };

  return {
    splits,
    selectedSplit,
    loading,
    error,
    createNewSplit,
    loadSplit,
    updateSplitDetails,
    deleteSplitById,
    toggleSplitFavorite,
    updateSplitDay,
    linkDayToProgram
  };
} 