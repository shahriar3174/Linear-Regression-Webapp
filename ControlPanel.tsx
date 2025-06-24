
import React, { useRef } from 'react';
import { MIN_TRIALS, MAX_TRIALS } from '../constants';

interface ControlPanelProps {
  numTrials: number;
  onNumTrialsChange: (value: number) => void;
  onFileUpload: (file: File) => void;
  onRunTrials: () => void;
  isLoading: boolean;
  error: string | null;
  hasData: boolean;
  useSampleData: boolean;
  onUseSampleDataChange: (useSample: boolean) => void;
  specificTrialToFocusInput: string;
  onSpecificTrialToFocusInputChange: (value: string) => void;
  onFocusSpecificTrial: () => void;
  maxTrialNumber: number; // Total number of trials available to focus on
}

const UploadIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
  </svg>
);

const PlayIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const FocusIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 10L3 3" />
    </svg>
);


export const ControlPanel: React.FC<ControlPanelProps> = ({
  numTrials,
  onNumTrialsChange,
  onFileUpload,
  onRunTrials,
  isLoading,
  error,
  hasData,
  useSampleData,
  onUseSampleDataChange,
  specificTrialToFocusInput,
  onSpecificTrialToFocusInputChange,
  onFocusSpecificTrial,
  maxTrialNumber,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileUpload(file);
      // Reset file input to allow uploading the same file again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onNumTrialsChange(parseInt(event.target.value, 10));
  };
  
  const handleNumberInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let value = parseInt(event.target.value, 10);
    if (isNaN(value)) value = MIN_TRIALS;
    if (value < MIN_TRIALS) value = MIN_TRIALS;
    if (value > MAX_TRIALS) value = MAX_TRIALS;
    onNumTrialsChange(value);
  };

  const handleSpecificTrialInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onSpecificTrialToFocusInputChange(event.target.value);
  };

  const handleSpecificTrialFocusKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && maxTrialNumber > 0) {
      onFocusSpecificTrial();
    }
  };


  return (
    <aside className="w-full md:w-80 lg:w-96 bg-gray-800 p-4 md:p-6 space-y-4 md:space-y-6 shadow-2xl overflow-y-auto">
      <div>
        <label htmlFor="file-upload" className="block text-sm font-medium text-sky-300 mb-1">Upload CSV File</label>
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md hover:border-sky-500 transition-colors">
          <div className="space-y-1 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="flex text-sm text-gray-400">
              <label
                htmlFor="file-input"
                className="relative cursor-pointer bg-gray-700 rounded-md font-medium text-sky-400 hover:text-sky-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-gray-800 focus-within:ring-sky-500 px-2 py-1"
              >
                <span>Upload a file</span>
                <input id="file-input" name="file-input" type="file" className="sr-only" accept=".csv" onChange={handleFileChange} ref={fileInputRef} />
              </label>
              <p className="pl-1">or drag and drop</p>
            </div>
            <p className="text-xs text-gray-500">CSV files up to 10MB</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-sky-300">Use Sample Data</span>
        <label htmlFor="sampleDataToggle" className="inline-flex relative items-center cursor-pointer">
          <input 
            type="checkbox" 
            id="sampleDataToggle" 
            className="sr-only peer" 
            checked={useSampleData}
            onChange={(e) => onUseSampleDataChange(e.target.checked)}
          />
          <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sky-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
        </label>
      </div>
      
      <div>
        <label htmlFor="numTrialsSlider" className="block text-sm font-medium text-sky-300">Number of Randomized Trials ({MIN_TRIALS}-{MAX_TRIALS})</label>
        <div className="flex items-center space-x-2 mt-1">
            <input
            type="range"
            id="numTrialsSlider"
            name="numTrialsSlider"
            min={MIN_TRIALS}
            max={MAX_TRIALS}
            value={numTrials}
            onChange={handleSliderChange}
            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-sky-500 flex-grow"
            disabled={isLoading}
            />
            <input 
                type="number"
                id="numTrialsInput"
                name="numTrialsInput"
                min={MIN_TRIALS}
                max={MAX_TRIALS}
                value={numTrials}
                onChange={handleNumberInputChange}
                className="w-20 p-2 text-sm bg-gray-700 border border-gray-600 rounded-md focus:ring-sky-500 focus:border-sky-500 text-white"
                disabled={isLoading}
            />
        </div>
      </div>

      <button
        onClick={onRunTrials}
        disabled={isLoading || !hasData}
        className="w-full flex items-center justify-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-sky-500 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading && !maxTrialNumber ? ( // Show processing only if it's the main "Run Trials" loading
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </>
        ) : (
          <>
            <PlayIcon /> Run Trials
          </>
        )}
      </button>

      {hasData && maxTrialNumber > 0 && (
        <div className="pt-2 border-t border-gray-700">
          <label htmlFor="specificTrialInput" className="block text-sm font-medium text-sky-300">
            Focus on Specific Trial (1-{maxTrialNumber})
          </label>
          <div className="flex items-center space-x-2 mt-1">
            <input
              type="number"
              id="specificTrialInput"
              name="specificTrialInput"
              min="1"
              max={maxTrialNumber}
              value={specificTrialToFocusInput}
              onChange={handleSpecificTrialInputChange}
              onKeyPress={handleSpecificTrialFocusKeyPress}
              placeholder={`1-${maxTrialNumber}`}
              className="flex-grow p-2 text-sm bg-gray-700 border border-gray-600 rounded-md focus:ring-sky-500 focus:border-sky-500 text-white"
              disabled={isLoading || maxTrialNumber === 0}
            />
            <button
              onClick={onFocusSpecificTrial}
              disabled={isLoading || maxTrialNumber === 0 || !specificTrialToFocusInput}
              className="px-4 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-teal-500 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              <FocusIcon /> Focus
            </button>
          </div>
        </div>
      )}
      
    </aside>
  );
};
