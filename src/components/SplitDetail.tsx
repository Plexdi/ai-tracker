import { useState } from 'react';
import { Split, SplitDay } from '@/lib/types';
import ModernButton from './ModernButton';
import GlassCard from './GlassCard';
import EditSplitDayModal from './EditSplitDayModal';

interface SplitDetailProps {
  split: Split;
  onUpdateDay: (splitId: string, dayIndex: number, updates: Partial<SplitDay>) => Promise<void>;
  onUpdateSplit: (splitId: string, updates: Partial<Omit<Split, 'id' | 'userId' | 'createdAt'>>) => Promise<void>;
  onBack: () => void;
}

export default function SplitDetail({ split, onUpdateDay, onUpdateSplit, onBack }: SplitDetailProps) {
  const [editingDayIndex, setEditingDayIndex] = useState<number | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);

  const getDayColor = (index: number) => {
    const colors = [
      'from-blue-600 to-blue-900',
      'from-purple-600 to-purple-900',
      'from-green-600 to-green-900',
      'from-red-600 to-red-900',
      'from-yellow-600 to-yellow-900',
      'from-teal-600 to-teal-900',
      'from-pink-600 to-pink-900',
    ];
    return colors[index % colors.length];
  };

  const handleToggleFavorite = async () => {
    try {
      await onUpdateSplit(split.id, { isFavorite: !split.isFavorite });
    } catch (error) {
      console.error('Error toggling favorite status:', error);
    }
  };

  const handleEditDay = (dayIndex: number) => {
    setEditingDayIndex(dayIndex);
    setIsEditModalOpen(true);
  };

  const handleUpdateDay = async (dayIndex: number, updates: Partial<SplitDay>) => {
    await onUpdateDay(split.id, dayIndex, updates);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-2xl font-semibold text-white">{split.name}</h1>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleToggleFavorite}
            className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300"
            aria-label={split.isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <svg 
              className={`w-5 h-5 ${split.isFavorite ? 'text-yellow-400 fill-current' : 'text-slate-300'}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={split.isFavorite ? 0 : 2} 
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" 
              />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Info Card */}
      <GlassCard>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <div className="text-sm text-slate-400">Template</div>
            <div className="font-medium text-white">
              {split.template === 'Combined' && split.combinedTemplates 
                ? `${split.combinedTemplates.templates.join(' + ')}` 
                : split.template}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-sm text-slate-400">Days Per Week</div>
            <div className="font-medium text-white">{split.daysPerWeek}</div>
          </div>
          <div className="space-y-1">
            <div className="text-sm text-slate-400">Created</div>
            <div className="font-medium text-white">
              {new Date(split.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      </GlassCard>
      
      {/* Days Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {split.days.map((day, index) => (
          <div key={index} className={`rounded-lg overflow-hidden border border-slate-800`}>
            <div className={`bg-gradient-to-br ${getDayColor(index)} p-4`}>
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-medium text-white">{day.name}</h3>
                <button
                  onClick={() => handleEditDay(index)}
                  className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-white"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </div>
              <div className="text-sm text-white/80 mt-1">Day {index + 1}</div>
            </div>
            <div className="bg-slate-900 p-4">
              <div className="mb-3">
                <div className="text-sm text-slate-400 mb-1">Focus</div>
                <div className="flex flex-wrap gap-1">
                  {day.focus.length > 0 ? (
                    day.focus.map((focus, focusIndex) => (
                      <span 
                        key={focusIndex}
                        className="inline-block px-2 py-0.5 bg-slate-800 text-slate-300 text-xs rounded-md"
                      >
                        {focus}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-500 text-sm">No focus areas defined</span>
                  )}
                </div>
              </div>
              
              {(day.programId || day.blockId) && (
                <div className="mt-3 pt-3 border-t border-slate-800">
                  <div className="text-sm text-slate-400 mb-1">Linked To</div>
                  <div className="text-slate-300 text-sm flex items-center">
                    <svg className="w-4 h-4 mr-1 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    Program Block
                  </div>
                </div>
              )}
              
              {day.exercises && day.exercises.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-800">
                  <div className="text-sm text-slate-400 mb-1">Exercises</div>
                  <div className="space-y-2">
                    {day.exercises.map((exercise, index) => (
                      <div key={index} className="text-slate-300 text-sm">
                        {exercise.exercise}: {exercise.sets}×{exercise.reps} @RPE {exercise.rpe}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Edit Day Modal */}
      {editingDayIndex !== null && (
        <EditSplitDayModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          day={split.days[editingDayIndex]}
          dayIndex={editingDayIndex}
          userId={split.userId}
          onUpdateDay={handleUpdateDay}
        />
      )}
    </div>
  );
} 