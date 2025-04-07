import { useState, useEffect } from 'react';
import { WeekDay, TrainingBlock, ALL_WEEK_DAYS, ProgramWorkout, WeekSchedule } from '@/lib/types';
import ModernButton from '@/components/ModernButton';
import { calculateProgramEndDate } from '@/lib/utils';
import { SUPPORTED_EXERCISES, MUSCLE_GROUPS, MuscleGroup, getCustomExercises, CustomExercise } from '@/lib/workout-service';

interface CreateProgramModalProps {
  onCreateProgram: (
    name: string, 
    startDate: number, 
    daysPerWeek: number, 
    initialBlock?: Omit<TrainingBlock, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<string>;
  onClose: () => void;
  userId: string;
}

type Step = 'name' | 'details' | 'block' | 'summary';

interface ProgramFormData {
  name: string;
  startDate: string;
  daysPerWeek: number;
}

interface BlockFormData {
  name: string;
  startWeek: number;
  endWeek: number;
  focus: 'Volume' | 'Intensity' | 'Peak' | 'Deload' | 'Custom';
  customFocus?: string;
  workoutDays: WeekDay[];
  notes?: string;
}

export default function CreateProgramModal({ onCreateProgram, onClose, userId }: CreateProgramModalProps) {
  // State for multi-step form
  const [currentStep, setCurrentStep] = useState<Step>('name');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customExercises, setCustomExercises] = useState<CustomExercise[]>([]);
  
  // Form data for each step
  const [programData, setProgramData] = useState<ProgramFormData>({
    name: '',
    startDate: new Date().toISOString().split('T')[0],
    daysPerWeek: 3
  });
  
  const [blockData, setBlockData] = useState<BlockFormData>({
    name: 'Initial Block',
    startWeek: 1,
    endWeek: 4,
    focus: 'Volume',
    workoutDays: [],
    notes: ''
  });

  // Track if we're adding a block or just basic program info
  const [includeInitialBlock, setIncludeInitialBlock] = useState(false);
  
  // Calculate program duration and end date
  const calculateEndDate = () => {
    if (!programData.startDate) return null;
    
    const startTimestamp = new Date(programData.startDate).getTime();
    const weeks = includeInitialBlock ? blockData.endWeek : 0;
    return calculateProgramEndDate(startTimestamp, weeks);
  };

  // Fetch custom exercises when component mounts
  useEffect(() => {
    const fetchCustomExercises = async () => {
      if (userId) {
        try {
          const exercises = await getCustomExercises(userId);
          setCustomExercises(exercises);
        } catch (error) {
          console.error('Error fetching custom exercises:', error);
        }
      }
    };
    
    fetchCustomExercises();
  }, [userId]);
  
  // Validation for each step
  const validateNameStep = (): boolean => {
    if (!programData.name.trim()) {
      setError('Program name is required');
      return false;
    }
    return true;
  };
  
  const validateDetailsStep = (): boolean => {
    if (!programData.startDate) {
      setError('Start date is required');
      return false;
    }
    if (programData.daysPerWeek < 1 || programData.daysPerWeek > 7) {
      setError('Training days must be between 1 and 7');
      return false;
    }
    return true;
  };
  
  const validateBlockStep = (): boolean => {
    if (!blockData.name.trim()) {
      setError('Block name is required');
      return false;
    }
    if (blockData.startWeek < 1) {
      setError('Start week must be at least 1');
      return false;
    }
    if (blockData.endWeek <= blockData.startWeek) {
      setError('End week must be greater than start week');
      return false;
    }
    if (blockData.workoutDays.length === 0) {
      setError('Please select at least one workout day');
      return false;
    }
    if (blockData.workoutDays.length > programData.daysPerWeek) {
      setError(`You can't select more workout days than your training days per week (${programData.daysPerWeek})`);
      return false;
    }
    if (blockData.focus === 'Custom' && !blockData.customFocus?.trim()) {
      setError('Custom focus description is required');
      return false;
    }
    return true;
  };
  
  // Handle navigation between steps
  const goToNextStep = () => {
    setError(null);
    
    if (currentStep === 'name') {
      if (validateNameStep()) {
        setCurrentStep('details');
      }
    } else if (currentStep === 'details') {
      if (validateDetailsStep()) {
        if (includeInitialBlock) {
          setCurrentStep('block');
        } else {
          setCurrentStep('summary');
        }
      }
    } else if (currentStep === 'block') {
      if (validateBlockStep()) {
        setCurrentStep('summary');
      }
    }
  };
  
  const goToPrevStep = () => {
    setError(null);
    
    if (currentStep === 'details') {
      setCurrentStep('name');
    } else if (currentStep === 'block') {
      setCurrentStep('details');
    } else if (currentStep === 'summary') {
      if (includeInitialBlock) {
        setCurrentStep('block');
      } else {
        setCurrentStep('details');
      }
    }
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    setError(null);
    setIsSubmitting(true);
    
    try {
      const startTimestamp = new Date(programData.startDate).getTime();
      
      // If including initial block, prepare its data
      let initialBlock;
      if (includeInitialBlock) {
        // Initialize weeks structure with empty workouts for selected days
        const weeks: Record<number, WeekSchedule> = {};
        for (let week = blockData.startWeek; week <= blockData.endWeek; week++) {
          const emptyDays = ALL_WEEK_DAYS.reduce((acc, day) => {
            acc[day] = blockData.workoutDays.includes(day) ? [] : [];
            return acc;
          }, {} as Record<WeekDay, ProgramWorkout[]>);
          
          weeks[week] = {
            days: emptyDays,
            notes: ''
          };
        }
        
        initialBlock = {
          ...blockData,
          status: 'Upcoming' as const,
          weeks
        };
      }
      
      await onCreateProgram(
        programData.name, 
        startTimestamp, 
        programData.daysPerWeek, 
        includeInitialBlock ? initialBlock : undefined
      );
      
      onClose();
    } catch (error) {
      console.error('Error creating program:', error);
      setError('Failed to create program. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Render different steps of the form
  const renderNameStep = () => (
    <div className="space-y-4">
      <div>
        <label htmlFor="programName" className="block text-sm font-medium text-slate-300 mb-1">
          Program Name
        </label>
        <input
          type="text"
          id="programName"
          className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={programData.name}
          onChange={(e) => setProgramData({ ...programData, name: e.target.value })}
          placeholder="My Training Program"
          required
        />
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
          type="button"
          variant="primary"
          onClick={goToNextStep}
        >
          Next
        </ModernButton>
      </div>
    </div>
  );
  
  const renderDetailsStep = () => (
    <div className="space-y-4">
      <div>
        <label htmlFor="startDate" className="block text-sm font-medium text-slate-300 mb-1">
          Start Date
        </label>
        <input
          type="date"
          id="startDate"
          className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={programData.startDate}
          onChange={(e) => setProgramData({ ...programData, startDate: e.target.value })}
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
          value={programData.daysPerWeek}
          onChange={(e) => setProgramData({ ...programData, daysPerWeek: Number(e.target.value) })}
          required
        >
          {[1, 2, 3, 4, 5, 6, 7].map((num) => (
            <option key={num} value={num}>
              {num} {num === 1 ? 'day' : 'days'} per week
            </option>
          ))}
        </select>
      </div>
      
      <div className="mt-4">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="includeBlock"
            className="h-4 w-4 rounded border-slate-700 text-blue-600 focus:ring-blue-500"
            checked={includeInitialBlock}
            onChange={(e) => setIncludeInitialBlock(e.target.checked)}
          />
          <label htmlFor="includeBlock" className="text-sm font-medium text-slate-300">
            Add an initial training block
          </label>
        </div>
        <p className="text-xs text-slate-400 mt-1 ml-6">
          A training block is a period of time focused on specific training goals (e.g., volume, intensity, etc.)
        </p>
      </div>
      
      <div className="flex justify-between space-x-3 mt-6">
        <ModernButton
          type="button"
          variant="outline"
          onClick={goToPrevStep}
        >
          Back
        </ModernButton>
        <ModernButton
          type="button"
          variant="primary"
          onClick={goToNextStep}
        >
          {includeInitialBlock ? 'Next' : 'Review'}
        </ModernButton>
      </div>
    </div>
  );
  
  const renderBlockStep = () => (
    <div className="space-y-4">
      <div>
        <label htmlFor="blockName" className="block text-sm font-medium text-slate-300 mb-1">
          Block Name
        </label>
        <input
          type="text"
          id="blockName"
          className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={blockData.name}
          onChange={(e) => setBlockData({ ...blockData, name: e.target.value })}
          required
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="startWeek" className="block text-sm font-medium text-slate-300 mb-1">
            Start Week
          </label>
          <input
            type="number"
            id="startWeek"
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={blockData.startWeek}
            onChange={(e) => setBlockData({ ...blockData, startWeek: parseInt(e.target.value) })}
            min="1"
            required
          />
        </div>
        <div>
          <label htmlFor="endWeek" className="block text-sm font-medium text-slate-300 mb-1">
            End Week
          </label>
          <input
            type="number"
            id="endWeek"
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={blockData.endWeek}
            onChange={(e) => setBlockData({ ...blockData, endWeek: parseInt(e.target.value) })}
            min={blockData.startWeek + 1}
            required
          />
        </div>
      </div>
      
      <div>
        <label htmlFor="focus" className="block text-sm font-medium text-slate-300 mb-1">
          Training Focus
        </label>
        <select
          id="focus"
          className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={blockData.focus}
          onChange={(e) => setBlockData({ ...blockData, focus: e.target.value as any })}
          required
        >
          <option value="Volume">Volume</option>
          <option value="Intensity">Intensity</option>
          <option value="Peak">Peak</option>
          <option value="Deload">Deload</option>
          <option value="Custom">Custom</option>
        </select>
      </div>
      
      {blockData.focus === 'Custom' && (
        <div>
          <label htmlFor="customFocus" className="block text-sm font-medium text-slate-300 mb-1">
            Custom Focus Description
          </label>
          <input
            type="text"
            id="customFocus"
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={blockData.customFocus || ''}
            onChange={(e) => setBlockData({ ...blockData, customFocus: e.target.value })}
            required={blockData.focus === 'Custom'}
          />
        </div>
      )}
      
      <div>
        <span className="block text-sm font-medium text-slate-300 mb-1">
          Workout Days <span className="text-slate-500">({blockData.workoutDays.length}/{programData.daysPerWeek} days)</span>
        </span>
        <p className="text-xs text-slate-400 mb-2">
          Select which days of the week you'll train
        </p>
        <div className="flex flex-wrap gap-2">
          {ALL_WEEK_DAYS.map((day) => (
            <button
              key={day}
              type="button"
              disabled={blockData.workoutDays.includes(day) ? false : blockData.workoutDays.length >= programData.daysPerWeek}
              className={`px-3 py-1 rounded-lg text-sm font-medium ${
                blockData.workoutDays.includes(day)
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                  : blockData.workoutDays.length >= programData.daysPerWeek
                    ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
              onClick={() => {
                if (blockData.workoutDays.includes(day)) {
                  setBlockData({
                    ...blockData,
                    workoutDays: blockData.workoutDays.filter((d) => d !== day)
                  });
                } else if (blockData.workoutDays.length < programData.daysPerWeek) {
                  setBlockData({
                    ...blockData,
                    workoutDays: [...blockData.workoutDays, day]
                  });
                }
              }}
            >
              {day}
            </button>
          ))}
        </div>
      </div>
      
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-slate-300 mb-1">
          Notes (Optional)
        </label>
        <textarea
          id="notes"
          className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={blockData.notes || ''}
          onChange={(e) => setBlockData({ ...blockData, notes: e.target.value })}
          rows={3}
          placeholder="Any additional notes about this training block..."
        />
      </div>
      
      <div className="flex justify-between space-x-3 mt-6">
        <ModernButton
          type="button"
          variant="outline"
          onClick={goToPrevStep}
        >
          Back
        </ModernButton>
        <ModernButton
          type="button"
          variant="primary"
          onClick={goToNextStep}
        >
          Review
        </ModernButton>
      </div>
    </div>
  );
  
  const renderSummaryStep = () => {
    const endDate = calculateEndDate();
    
    return (
      <div className="space-y-6">
        <div className="bg-slate-800/60 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-4">Program Summary</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-400">Name:</span>
              <span className="text-white font-medium">{programData.name}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-slate-400">Start Date:</span>
              <span className="text-white font-medium">{new Date(programData.startDate).toLocaleDateString()}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-slate-400">Training Days:</span>
              <span className="text-white font-medium">{programData.daysPerWeek} days per week</span>
            </div>
            
            {includeInitialBlock && (
              <>
                <div className="border-t border-slate-700 my-2"></div>
                
                <div className="flex justify-between">
                  <span className="text-slate-400">Initial Block:</span>
                  <span className="text-white font-medium">{blockData.name}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-slate-400">Duration:</span>
                  <span className="text-white font-medium">
                    Weeks {blockData.startWeek}-{blockData.endWeek} ({blockData.endWeek - blockData.startWeek + 1} weeks)
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-slate-400">Focus:</span>
                  <span className="text-white font-medium">
                    {blockData.focus === 'Custom' ? blockData.customFocus : blockData.focus}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-slate-400">Workout Days:</span>
                  <span className="text-white font-medium">
                    {blockData.workoutDays.join(', ')}
                  </span>
                </div>
              </>
            )}
            
            <div className="border-t border-slate-700 my-2"></div>
            
            <div className="flex justify-between">
              <span className="text-slate-400">End Date:</span>
              <span className="text-white font-medium">
                {endDate ? new Date(endDate).toLocaleDateString() : 'Not set'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex justify-between space-x-3 mt-6">
          <ModernButton
            type="button"
            variant="outline"
            onClick={goToPrevStep}
          >
            Back
          </ModernButton>
          <ModernButton
            type="button"
            variant="primary"
            onClick={handleSubmit}
            isLoading={isSubmitting}
          >
            Create Program
          </ModernButton>
        </div>
      </div>
    );
  };
  
  // Render step indicator
  const renderStepIndicator = () => {
    const steps = [
      { id: 'name', label: 'Name' },
      { id: 'details', label: 'Details' },
      ...(includeInitialBlock ? [{ id: 'block', label: 'Block' }] : []),
      { id: 'summary', label: 'Review' }
    ];
    
    return (
      <div className="flex items-center justify-center mb-6">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div 
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${currentStep === step.id 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-800 text-slate-400'}`}
            >
              {index + 1}
            </div>
            <div className="text-xs text-slate-400 absolute mt-10">{step.label}</div>
            {index < steps.length - 1 && (
              <div className={`h-0.5 w-10 mx-1 ${index < steps.findIndex(s => s.id === currentStep) ? 'bg-blue-600' : 'bg-slate-700'}`}></div>
            )}
          </div>
        ))}
      </div>
    );
  };
  
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-white mb-6 text-center">Create Training Program</h2>
        
        {renderStepIndicator()}
        
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-2 rounded-lg mb-4">
            {error}
          </div>
        )}
        
        {currentStep === 'name' && renderNameStep()}
        {currentStep === 'details' && renderDetailsStep()}
        {currentStep === 'block' && renderBlockStep()}
        {currentStep === 'summary' && renderSummaryStep()}
      </div>
    </div>
  );
} 