import { useState, useEffect } from 'react';
import ModernButton from './ModernButton';
import { SplitTemplateType, SplitDay } from '@/lib/types';

interface CreateSplitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateSplit: (
    name: string,
    daysPerWeek: number,
    template: SplitTemplateType,
    days: SplitDay[],
    combinedTemplates?: {
      templates: SplitTemplateType[];
      daysPerTemplate: number[];
    }
  ) => Promise<string>;
}

const TEMPLATE_DESCRIPTIONS = {
  PPL: "Push, Pull, Legs - A 3-day split focusing on pushing movements, pulling movements, and legs. Typically run 6 days a week with each split done twice.",
  Arnold: "Chest/Back, Shoulders/Arms, Legs - A 3-day split made famous by Arnold Schwarzenegger. Often run 6 days per week.",
  UpperLower: "Upper body and lower body days alternated. Great for 4 days per week training.",
  FullBody: "Train the entire body in each session. Great for beginners or those training 2-3 days per week.",
  Custom: "Build your own split from scratch. Full customization of training days.",
  Combined: "Mix multiple templates together (e.g., Full Body 2x + Upper/Lower 2x for a 4-day program)."
};

export default function CreateSplitModal({ isOpen, onClose, onCreateSplit }: CreateSplitModalProps) {
  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Form data
  const [name, setName] = useState<string>('');
  const [daysPerWeek, setDaysPerWeek] = useState<number>(4);
  const [selectedTemplate, setSelectedTemplate] = useState<SplitTemplateType>('Custom');
  const [days, setDays] = useState<SplitDay[]>([]);
  
  // Combined template data
  const [isCombining, setIsCombining] = useState<boolean>(false);
  const [template1, setTemplate1] = useState<SplitTemplateType>('FullBody');
  const [template2, setTemplate2] = useState<SplitTemplateType>('UpperLower');
  const [daysTemplate1, setDaysTemplate1] = useState<number>(2);
  const [daysTemplate2, setDaysTemplate2] = useState<number>(2);

  // Reset form when modal is opened/closed
  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setStep(1);
    setName('');
    setDaysPerWeek(4);
    setSelectedTemplate('Custom');
    setDays([]);
    setIsSubmitting(false);
    setError(null);
    setIsCombining(false);
    setTemplate1('FullBody');
    setTemplate2('UpperLower');
    setDaysTemplate1(2);
    setDaysTemplate2(2);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validateNameStep = (): boolean => {
    if (!name.trim()) {
      setError('Please enter a name for your split');
      return false;
    }
    setError(null);
    return true;
  };

  const validateDaysStep = (): boolean => {
    if (daysPerWeek < 2 || daysPerWeek > 7) {
      setError('Please select 2-7 days per week');
      return false;
    }
    
    if (isCombining && daysTemplate1 + daysTemplate2 !== daysPerWeek) {
      setError(`The total days (${daysTemplate1 + daysTemplate2}) must equal days per week (${daysPerWeek})`);
      return false;
    }
    
    setError(null);
    return true;
  };

  const goToNextStep = () => {
    let isValid = false;
    
    switch (step) {
      case 1:
        isValid = validateNameStep();
        break;
      case 2:
        isValid = validateDaysStep();
        break;
      default:
        isValid = true;
    }
    
    if (isValid) {
      setStep(step + 1);
    }
  };

  const goToPrevStep = () => {
    setStep(Math.max(1, step - 1));
    setError(null);
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Prepare data for submission
      const finalTemplate = isCombining ? 'Combined' : selectedTemplate;
      const combinedTemplates = isCombining 
        ? {
            templates: [template1, template2],
            daysPerTemplate: [daysTemplate1, daysTemplate2]
          }
        : undefined;
      
      await onCreateSplit(
        name,
        daysPerWeek,
        finalTemplate,
        days,
        combinedTemplates
      );
      
      handleClose();
    } catch (error) {
      console.error('Error creating split:', error);
      setError('Failed to create split. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // UI handlers
  const handleCombineTemplatesChange = (combine: boolean) => {
    setIsCombining(combine);
    if (combine) {
      setSelectedTemplate('Combined');
      
      // Ensure the days per template add up to the total days per week
      if (daysTemplate1 + daysTemplate2 !== daysPerWeek) {
        // Try to distribute days evenly
        if (daysPerWeek % 2 === 0) {
          setDaysTemplate1(daysPerWeek / 2);
          setDaysTemplate2(daysPerWeek / 2);
        } else {
          setDaysTemplate1(Math.floor(daysPerWeek / 2) + 1);
          setDaysTemplate2(Math.floor(daysPerWeek / 2));
        }
      }
    }
  };

  const renderNameStep = () => (
    <div className="space-y-4">
      <div>
        <label htmlFor="split-name" className="block text-sm font-medium text-white mb-1">
          Split Name
        </label>
        <input
          id="split-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-800/80 text-white p-2.5
                    focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="My Training Split"
        />
      </div>
    </div>
  );

  const renderDaysStep = () => (
    <div className="space-y-4">
      <div>
        <label htmlFor="days-per-week" className="block text-sm font-medium text-white mb-1">
          Days Per Week
        </label>
        <select
          id="days-per-week"
          value={daysPerWeek}
          onChange={(e) => setDaysPerWeek(parseInt(e.target.value))}
          className="w-full rounded-lg border border-slate-700 bg-slate-800/80 text-white p-2.5
                    focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {[2, 3, 4, 5, 6, 7].map((num) => (
            <option key={num} value={num}>
              {num} days
            </option>
          ))}
        </select>
      </div>
      
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-white">
            Combine Templates?
          </label>
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => handleCombineTemplatesChange(false)}
              className={`px-3 py-1 text-sm rounded-l-lg ${
                !isCombining 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-700 text-slate-300'
              }`}
            >
              No
            </button>
            <button
              type="button"
              onClick={() => handleCombineTemplatesChange(true)}
              className={`px-3 py-1 text-sm rounded-r-lg ${
                isCombining 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-700 text-slate-300'
              }`}
            >
              Yes
            </button>
          </div>
        </div>
      </div>
      
      {!isCombining ? (
        <div>
          <label className="block text-sm font-medium text-white mb-1">
            Select Template
          </label>
          <div className="grid grid-cols-1 gap-2 mt-1">
            {(['PPL', 'Arnold', 'UpperLower', 'FullBody', 'Custom'] as SplitTemplateType[]).map((template) => (
              <button
                key={template}
                type="button"
                onClick={() => setSelectedTemplate(template)}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  selectedTemplate === template
                    ? 'border-blue-500 bg-blue-900/30' 
                    : 'border-slate-700 bg-slate-800/80 hover:bg-slate-700/80'
                }`}
              >
                <div className="font-medium text-white">{template}</div>
                <div className="text-xs text-slate-300 mt-1">
                  {TEMPLATE_DESCRIPTIONS[template]}
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-1">
                First Template
              </label>
              <select
                value={template1}
                onChange={(e) => setTemplate1(e.target.value as SplitTemplateType)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800/80 text-white p-2.5
                          focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {(['PPL', 'Arnold', 'UpperLower', 'FullBody'] as SplitTemplateType[]).map((template) => (
                  <option key={template} value={template}>
                    {template}
                  </option>
                ))}
              </select>
              
              <label className="block text-sm font-medium text-white mb-1 mt-3">
                Days
              </label>
              <select
                value={daysTemplate1}
                onChange={(e) => {
                  const newDays = parseInt(e.target.value);
                  setDaysTemplate1(newDays);
                  if (newDays + daysTemplate2 > daysPerWeek) {
                    setDaysTemplate2(Math.max(1, daysPerWeek - newDays));
                  }
                }}
                className="w-full rounded-lg border border-slate-700 bg-slate-800/80 text-white p-2.5
                          focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {[1, 2, 3, 4, 5, 6].filter(d => d < daysPerWeek).map((num) => (
                  <option key={num} value={num}>
                    {num} day{num > 1 ? 's' : ''}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Second Template
              </label>
              <select
                value={template2}
                onChange={(e) => setTemplate2(e.target.value as SplitTemplateType)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800/80 text-white p-2.5
                          focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {(['PPL', 'Arnold', 'UpperLower', 'FullBody'] as SplitTemplateType[]).map((template) => (
                  <option key={template} value={template}>
                    {template}
                  </option>
                ))}
              </select>
              
              <label className="block text-sm font-medium text-white mb-1 mt-3">
                Days
              </label>
              <select
                value={daysTemplate2}
                onChange={(e) => {
                  const newDays = parseInt(e.target.value);
                  setDaysTemplate2(newDays);
                  if (newDays + daysTemplate1 > daysPerWeek) {
                    setDaysTemplate1(Math.max(1, daysPerWeek - newDays));
                  }
                }}
                className="w-full rounded-lg border border-slate-700 bg-slate-800/80 text-white p-2.5
                          focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {[1, 2, 3, 4, 5, 6].filter(d => d < daysPerWeek).map((num) => (
                  <option key={num} value={num}>
                    {num} day{num > 1 ? 's' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700">
            <div className="text-sm font-medium text-white mb-1">
              Split Configuration
            </div>
            <div className="text-xs text-slate-300">
              {`${template1} (${daysTemplate1} days) + ${template2} (${daysTemplate2} days) = ${daysTemplate1 + daysTemplate2} total days`}
            </div>
            {daysTemplate1 + daysTemplate2 !== daysPerWeek && (
              <div className="text-xs text-red-400 mt-1">
                Total days must equal days per week ({daysPerWeek})
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderReviewStep = () => (
    <div className="space-y-4">
      <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700">
        <h3 className="text-lg font-medium text-white mb-2">Split Summary</h3>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-300">Name:</span>
            <span className="text-white font-medium">{name}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-slate-300">Days Per Week:</span>
            <span className="text-white font-medium">{daysPerWeek}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-slate-300">Template:</span>
            <span className="text-white font-medium">
              {isCombining 
                ? `Combined (${template1} + ${template2})` 
                : selectedTemplate}
            </span>
          </div>
          
          {isCombining && (
            <div className="flex justify-between">
              <span className="text-slate-300">Configuration:</span>
              <span className="text-white font-medium">
                {`${template1} (${daysTemplate1} days) + ${template2} (${daysTemplate2} days)`}
              </span>
            </div>
          )}
        </div>
        
        <div className="mt-4 text-sm text-slate-400">
          <p>
            You can customize the details of your split after creation, including day names, 
            training focus for each day, and notes.
          </p>
        </div>
      </div>
    </div>
  );

  // If modal is not open, don't render anything
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/70">
      <div className="bg-slate-900 rounded-lg border border-slate-800 w-full max-w-md max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center border-b border-slate-800 p-4">
          <h2 className="text-lg font-semibold text-white">Create New Split</h2>
          <button 
            onClick={handleClose}
            className="p-1 rounded-md text-slate-400 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Step Indicator */}
        <div className="px-4 pt-4">
          <div className="flex justify-between mb-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col items-center">
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step === i 
                      ? 'bg-blue-600 text-white' 
                      : step > i 
                        ? 'bg-green-600 text-white' 
                        : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {step > i ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    i
                  )}
                </div>
                <span className="text-xs mt-1 text-slate-400">
                  {i === 1 ? 'Name' : i === 2 ? 'Template' : 'Review'}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Form Content */}
        <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 180px)' }}>
          {step === 1 && renderNameStep()}
          {step === 2 && renderDaysStep()}
          {step === 3 && renderReviewStep()}
          
          {error && (
            <div className="mt-4 p-3 rounded-lg bg-red-900/20 border border-red-800 text-red-200 text-sm">
              {error}
            </div>
          )}
        </div>
        
        {/* Actions */}
        <div className="border-t border-slate-800 p-4 flex justify-between">
          {step > 1 ? (
            <ModernButton
              variant="outline"
              onClick={goToPrevStep}
              disabled={isSubmitting}
            >
              Back
            </ModernButton>
          ) : (
            <ModernButton
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </ModernButton>
          )}
          
          {step < 3 ? (
            <ModernButton
              variant="primary"
              onClick={goToNextStep}
              disabled={isSubmitting}
            >
              Next
            </ModernButton>
          ) : (
            <ModernButton
              variant="primary"
              onClick={handleSubmit}
              isLoading={isSubmitting}
              disabled={isSubmitting}
            >
              Create Split
            </ModernButton>
          )}
        </div>
      </div>
    </div>
  );
} 