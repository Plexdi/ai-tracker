'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/zustandStore';
import { useSplits } from '@/hooks/useSplits';
import { Split, SplitDay, SplitTemplateType } from '@/lib/types';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { toast } from 'react-hot-toast';
import ModernLayout from '@/components/ModernLayout';
import GlassCard from '@/components/GlassCard';
import GridContainer from '@/components/GridContainer';
import ModernButton from '@/components/ModernButton';
import CreateSplitModal from '@/components/CreateSplitModal';
import SplitDetail from '@/components/SplitDetail';
import DeleteSplitModal from '@/components/DeleteSplitModal';

export default function SplitsPage() {
  const router = useRouter();
  const setCurrentUser = useStore((state) => state.setCurrentUser);
  const currentUser = useStore((state) => state.currentUser);
  
  // UI States
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [selectedSplitId, setSelectedSplitId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [splitToDelete, setSplitToDelete] = useState<Split | null>(null);
  
  // Get splits data using the custom hook
  const { 
    splits, 
    selectedSplit,
    loading: splitsLoading, 
    error: splitsError,
    createNewSplit,
    loadSplit,
    updateSplitDetails,
    deleteSplitById,
    updateSplitDay
  } = useSplits(currentUser?.id);

  // Authentication check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push('/login');
        return;
      }
      setCurrentUser({
        id: user.uid,
        email: user.email || 'Anonymous User',
        displayName: user.displayName || 'Anonymous User',
        photoURL: user.photoURL || undefined,
      });
    });

    return () => unsubscribe();
  }, [router, setCurrentUser]);

  // Set loading state based on splits loading
  useEffect(() => {
    setIsLoading(splitsLoading);
  }, [splitsLoading]);

  // Function to handle create split
  const handleCreateSplit = async (
    name: string,
    daysPerWeek: number,
    template: SplitTemplateType,
    days: SplitDay[] = [],
    combinedTemplates?: {
      templates: SplitTemplateType[];
      daysPerTemplate: number[];
    }
  ) => {
    if (!currentUser?.id) {
      toast.error('Please log in to create a split');
      return '';
    }

    try {
      const splitId = await createNewSplit(
        name,
        daysPerWeek,
        template,
        days,
        combinedTemplates
      );
      
      toast.success('Split created successfully!');
      setSelectedSplitId(splitId);
      return splitId;
    } catch (error) {
      console.error('Failed to create split:', error);
      toast.error('Failed to create split');
      throw error;
    }
  };

  // Function to handle selecting a split
  const handleSelectSplit = async (splitId: string) => {
    try {
      setIsLoading(true);
      await loadSplit(splitId);
      setSelectedSplitId(splitId);
    } catch (error) {
      console.error('Error loading split:', error);
      toast.error('Failed to load split');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle updating a split day
  const handleUpdateSplitDay = async (splitId: string, dayIndex: number, updates: Partial<SplitDay>) => {
    try {
      await updateSplitDay(splitId, dayIndex, updates);
      toast.success('Split day updated successfully');
    } catch (error) {
      console.error('Error updating split day:', error);
      toast.error('Failed to update split day');
      throw error;
    }
  };

  // Function to handle updating a split
  const handleUpdateSplit = async (splitId: string, updates: Partial<Omit<Split, 'id' | 'userId' | 'createdAt'>>) => {
    try {
      await updateSplitDetails(splitId, updates);
    } catch (error) {
      console.error('Error updating split:', error);
      toast.error('Failed to update split');
      throw error;
    }
  };

  // Function to prepare a split for deletion
  const handlePrepareDeleteSplit = (split: Split) => {
    setSplitToDelete(split);
    setShowDeleteModal(true);
  };

  // Function to handle deleting a split
  const handleDeleteSplit = async () => {
    if (!splitToDelete) return;
    
    try {
      await deleteSplitById(splitToDelete.id);
      toast.success('Split deleted successfully');
      
      // If we deleted the currently selected split, go back to the list
      if (selectedSplitId === splitToDelete.id) {
        setSelectedSplitId(null);
      }
      
      setShowDeleteModal(false);
      setSplitToDelete(null);
    } catch (error) {
      console.error('Error deleting split:', error);
      toast.error('Failed to delete split');
      throw error;
    }
  };

  // Function to go back to the list view
  const handleBackToList = () => {
    setSelectedSplitId(null);
  };

  // Helper function to get a formatted template name for display
  const getTemplateDisplayName = (split: Split) => {
    if (split.template === 'Combined' && split.combinedTemplates) {
      return 'Combined';
    }
    return split.template;
  };

  // Render the detail view if a split is selected
  if (selectedSplitId && selectedSplit) {
    return (
      <ModernLayout title="Split Detail" description={selectedSplit.name}>
        <SplitDetail 
          split={selectedSplit}
          onUpdateDay={handleUpdateSplitDay}
          onUpdateSplit={handleUpdateSplit}
          onBack={handleBackToList}
        />
      </ModernLayout>
    );
  }

  // Render the list view
  return (
    <ModernLayout title="Training Splits" description="Manage your workout splits">
      <div className="space-y-6">
        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <div></div>
          <ModernButton
            variant="primary"
            onClick={() => setShowCreateModal(true)}
            icon={
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            }
          >
            Create New Split
          </ModernButton>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {/* Empty State */}
            {!splits || splits.length === 0 ? (
              <GlassCard>
                <div className="flex flex-col items-center justify-center py-12">
                  <svg className="w-16 h-16 text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                  </svg>
                  <h3 className="text-xl font-medium text-white mb-2">No Splits Yet</h3>
                  <p className="text-slate-400 text-center max-w-md mb-6">
                    Create your first training split to organize your workouts and plan your training week.
                  </p>
                  <ModernButton
                    variant="primary"
                    onClick={() => setShowCreateModal(true)}
                  >
                    Create Your First Split
                  </ModernButton>
                </div>
              </GlassCard>
            ) : (
              // Split Cards
              <GridContainer>
                {splits.map((split) => (
                  <GlassCard key={split.id} colSpan="md:col-span-6 lg:col-span-4">
                    <div className="flex flex-col h-full">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center">
                            <h3 className="text-lg font-medium text-white">{split.name}</h3>
                            {split.isFavorite && (
                              <svg className="w-5 h-5 ml-2 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.363 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.363-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            )}
                          </div>
                          <div className="text-sm text-slate-400 mt-1">
                            {getTemplateDisplayName(split)} • {split.daysPerWeek} days/week
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleSelectSplit(split.id)}
                            className="p-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handlePrepareDeleteSplit(split)}
                            className="p-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </GridContainer>
            )}
          </>
        )}
      </div>

      {/* Create Split Modal */}
      {showCreateModal && (
        <CreateSplitModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreateSplit={handleCreateSplit}
        />
      )}

      {/* Delete Split Modal */}
      {showDeleteModal && splitToDelete && (
        <DeleteSplitModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          splitName={splitToDelete.name}
          onConfirmDelete={handleDeleteSplit}
        />
      )}
    </ModernLayout>
  );
} 