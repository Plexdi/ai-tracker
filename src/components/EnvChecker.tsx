'use client';

import { useState, useEffect } from 'react';
import ModernButton from './ModernButton';

export default function EnvChecker() {
  const [envStatus, setEnvStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('Checking environment configuration...');
  const [details, setDetails] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);

  const checkEnv = async () => {
    setEnvStatus('loading');
    setMessage('Checking environment configuration...');
    try {
      const response = await fetch('/api/test-env');
      const data = await response.json();
      
      if (response.ok) {
        setEnvStatus('success');
        setMessage(data.message);
      } else {
        setEnvStatus('error');
        setMessage(data.message || 'Error checking environment configuration');
      }
      
      setDetails(data.env);
    } catch (error) {
      setEnvStatus('error');
      setMessage(error instanceof Error ? error.message : 'Unknown error checking environment');
    }
  };

  useEffect(() => {
    checkEnv();
  }, []);

  return (
    <div className="p-4 mb-4 rounded-lg bg-slate-800 border border-slate-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {envStatus === 'loading' && (
            <div className="animate-spin h-5 w-5 mr-3 border-t-2 border-b-2 border-blue-500 rounded-full"></div>
          )}
          {envStatus === 'success' && (
            <svg className="h-5 w-5 mr-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
          {envStatus === 'error' && (
            <svg className="h-5 w-5 mr-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          <span className={`${
            envStatus === 'error' ? 'text-red-400' : 
            envStatus === 'success' ? 'text-green-400' : 'text-slate-300'
          }`}>{message}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <ModernButton 
            variant="outline" 
            size="sm" 
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </ModernButton>
          <ModernButton 
            variant="secondary" 
            size="sm" 
            onClick={checkEnv}
          >
            Recheck
          </ModernButton>
        </div>
      </div>
      
      {showDetails && details && (
        <div className="mt-4 p-3 bg-slate-900 rounded-lg text-xs font-mono">
          <pre className="text-slate-300 overflow-x-auto">
            {JSON.stringify(details, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 