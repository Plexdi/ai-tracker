import { useState, useEffect } from 'react';
import { Program } from '@/lib/types';
import ModernButton from '@/components/ModernButton';
import { calculateTotalProgramWeeks, calculateProgramEndDate } from '@/lib/utils';

interface EditProgramModalProps {
  program: Program;
  onUpdate: (updates: Partial<Program>) => Promise<void>;
  onClose: () => void;
}

export default function EditProgramModal({ program, onUpdate, onClose }: EditProgramModalProps) {
  const [formData, setFormData] = useState({
    name: program.name || '',
    startDate: program.startDate ? new Date(program.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    daysPerWeek: program.daysPerWeek || 3
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [totalWeeks, setTotalWeeks] = useState(calculateTotalProgramWeeks(program.blocks || []));

  useEffect(() => {
    // Update the total weeks when program blocks change
    setTotalWeeks(calculateTotalProgramWeeks(program.blocks || []));
  }, [program.blocks]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const startTimestamp = new Date(formData.startDate).getTime();
      const endTimestamp = calculateProgramEndDate(startTimestamp, totalWeeks);
      
      await onUpdate({
        name: formData.name,
        startDate: startTimestamp,
        endDate: endTimestamp,
        daysPerWeek: formData.daysPerWeek
      });
      
      onClose();
    } catch (error) {
      console.error('Error updating program:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md p-6 shadow-xl">
        <h2 className="text-xl font-bold text-white mb-4">Edit Program</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="programName" className="block text-sm font-medium text-slate-300 mb-1">
                Program Name
              </label>
              <input
                type="text"
                id="programName"
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-slate-300 mb-1">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
            </div>
            
            <div>
              <label htmlFor="daysPerWeek" className="block text-sm font-medium text-slate-300 mb-1">
                Training Days Per Week
              </label>
              <select
                id="daysPerWeek"
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.daysPerWeek}
                onChange={(e) => setFormData({ ...formData, daysPerWeek: Number(e.target.value) })}
                required
              >
                {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                  <option key={num} value={num}>
                    {num} {num === 1 ? 'day' : 'days'} per week
                  </option>
                ))}
              </select>
            </div>
            
            <div className="bg-slate-800/80 p-3 rounded-lg">
              <p className="text-sm text-slate-300">
                <span className="text-blue-400 font-medium">Program Duration:</span> {totalWeeks} weeks
              </p>
              
              <p className="text-sm text-slate-300 mt-1">
                <span className="text-blue-400 font-medium">End Date:</span> {new Date(calculateProgramEndDate(new Date(formData.startDate).getTime(), totalWeeks)).toLocaleDateString()}
              </p>
              
              <p className="text-xs text-slate-400 mt-2">
                The program duration is automatically calculated based on your training blocks.
              </p>
            </div>
          </div>
          
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
            >
              Save Changes
            </ModernButton>
          </div>
        </form>
      </div>
    </div>
  );
} 