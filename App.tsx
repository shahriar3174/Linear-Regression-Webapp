
import React, { useState, useCallback, useEffect } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { DataChart } from './components/DataChart';
import { DataPoint, LineParams, ChartLine } from './types';
import { SAMPLE_DATA, DEFAULT_TRIALS } from './constants';

const App: React.FC = () => {
  const [rawData, setRawData] = useState<DataPoint[]>([]);
  const [parsedData, setParsedData] = useState<DataPoint[]>([]);
  const [numTrials, setNumTrials] = useState<number>(DEFAULT_TRIALS);
  const [trialLines, setTrialLines] = useState<LineParams[]>([]);
  const [bestFitLine, setBestFitLine] = useState<LineParams | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [useSampleData, setUseSampleData] = useState<boolean>(true);
  const [chartKey, setChartKey] = useState<number>(0); 

  const [dataMinX, setDataMinX] = useState<number>(0);
  const [dataMaxX, setDataMaxX] = useState<number>(10);

  const [focusedTrialIndex, setFocusedTrialIndex] = useState<number | null>(null);
  const [specificTrialToFocusInput, setSpecificTrialToFocusInput] = useState<string>('');


  useEffect(() => {
    if (useSampleData) {
      setRawData(SAMPLE_DATA);
      setError(null); // Clear error when switching to sample data
    } else {
      // If switching off sample data and no file was uploaded prior, clear rawData
      if(rawData !== SAMPLE_DATA) {
        // keep existing rawData if it's from a file
      } else {
        setRawData([]);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useSampleData]); 

  useEffect(() => {
    if (rawData.length > 0) {
      const validData = rawData.filter(p => typeof p.x === 'number' && typeof p.y === 'number' && !isNaN(p.x) && !isNaN(p.y));
      if (validData.length < 2) {
        setError("Insufficient valid data points (minimum 2 required with numerical X and Y).");
        setParsedData([]);
        return;
      }
      setParsedData(validData);
      if (!error?.startsWith("CSV Parsing Error") && !error?.startsWith("File Read Error") && !error?.startsWith("CSV must have at least") && !error?.startsWith("Could not automatically determine")) {
        // Clear general errors, but not file-specific parsing errors if rawData is now valid from another source (e.g. sample)
         setError(null);
      }

      const xValues = validData.map(p => p.x);
      const newMinX = Math.min(...xValues);
      const newMaxX = Math.max(...xValues);
      setDataMinX(newMinX);
      setDataMaxX(newMaxX);
      
    } else {
      setParsedData([]);
    }
    setTrialLines([]);
    setBestFitLine(null);
    setFocusedTrialIndex(null); 
    setSpecificTrialToFocusInput(''); // Reset specific trial input
    setChartKey(prev => prev + 1); 
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawData]);


  const handleFileUpload = (file: File) => {
    setIsLoading(true);
    setError(null);
    setUseSampleData(false); 

    window.Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true, 
      complete: (results: any) => {
        if (results.errors.length > 0) {
          setError(`CSV Parsing Error: ${results.errors[0].message}`);
          setRawData([]);
          setIsLoading(false);
          return;
        }
        
        const data = results.data as any[];
        if (data.length === 0) {
          setError("CSV file is empty or has no valid data rows.");
          setRawData([]);
          setIsLoading(false);
          return;
        }

        const headers = results.meta.fields;
        let xKey: string | undefined = undefined;
        let yKey: string | undefined = undefined;

        if (headers && headers.length >= 2) {
            const findKey = (potentialNames: string[]) => 
                headers.find((h: string) => potentialNames.some(pn => pn.toLowerCase() === h.toLowerCase()));

            xKey = findKey(['x', 'xvalue', headers[0]]);
            yKey = findKey(['y', 'yvalue', headers[1]]);
            
            if (xKey && xKey === yKey && headers.length > 1) {
                xKey = headers[0];
                yKey = headers[1];
            }
        } else {
            setError("CSV must have at least two columns.");
            setRawData([]);
            setIsLoading(false);
            return;
        }
        
        if (!xKey || !yKey) {
            setError("Could not automatically determine X and Y columns. Please ensure CSV has headers like 'X' and 'Y'.");
            setRawData([]);
            setIsLoading(false);
            return;
        }

        const extractedData: DataPoint[] = data.map((row: any) => ({
          x: parseFloat(row[xKey!]),
          y: parseFloat(row[yKey!]),
        })).filter(p => !isNaN(p.x) && !isNaN(p.y));


        if (extractedData.length < 2) {
          setError("Uploaded CSV does not contain at least two valid numerical data points after parsing.");
          setRawData([]);
        } else {
          setRawData(extractedData);
          setError(null); // Clear error on successful parse and data extraction
        }
        setIsLoading(false);
      },
      error: (err: any) => {
        setError(`File Read Error: ${err.message}`);
        setRawData([]);
        setIsLoading(false);
      }
    });
  };

  const runTrials = useCallback(() => {
    if (parsedData.length < 2) {
      setError("Not enough data points to run trials. Please upload a valid CSV or use sample data.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setFocusedTrialIndex(null); 
    setSpecificTrialToFocusInput('');

    const xValues = parsedData.map(p => p.x);
    const yValues = parsedData.map(p => p.y);

    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);
    const minY = Math.min(...yValues);
    const maxY = Math.max(...yValues);

    const dataWidth = maxX - minX;
    const dataHeight = maxY - minY;
    
    const slopeRangeFactor = dataWidth > 0 ? dataHeight / dataWidth : dataHeight; 

    const newTrialLines: LineParams[] = [];
    let newBestFitLine: LineParams | null = null;

    for (let i = 0; i < numTrials; i++) {
      const m = (Math.random() - 0.5) * 2 * (slopeRangeFactor || 1) * 3; 
      const b = (minY + maxY) / 2 - m * (minX + maxX) / 2 + (Math.random() - 0.5) * 2 * dataHeight;

      let mse = 0;
      for (const point of parsedData) {
        const predictedY = m * point.x + b;
        mse += Math.pow(point.y - predictedY, 2);
      }
      mse /= parsedData.length;

      const currentLine = { m, b, mse };
      newTrialLines.push(currentLine);

      if (!newBestFitLine || mse < newBestFitLine.mse!) {
        newBestFitLine = currentLine;
      }
    }

    setTrialLines(newTrialLines);
    setBestFitLine(newBestFitLine);
    setIsLoading(false);
    setError(null); // Clear any previous errors after successful trials
    setChartKey(prev => prev + 1); 
  }, [parsedData, numTrials]);

  const handleTrialLineFocus = useCallback((index: number | null) => {
    setFocusedTrialIndex(currentIndex => (currentIndex === index ? null : index));
    if (index !== null) { // If focusing via click, clear the input field
      setSpecificTrialToFocusInput('');
    }
    setError(null); // Clear any specific trial focus error
  }, []);

  const handleFocusSpecificTrial = useCallback(() => {
    const trialNum = parseInt(specificTrialToFocusInput, 10);
    if (isNaN(trialNum) || trialNum < 1 || trialNum > trialLines.length) {
      setError(`Invalid trial number. Please enter a number between 1 and ${trialLines.length}.`);
      setFocusedTrialIndex(null);
      return;
    }
    setFocusedTrialIndex(trialNum - 1); // Convert 1-based to 0-based
    setError(null); // Clear error on successful focus
  }, [specificTrialToFocusInput, trialLines.length]);

  const allTrialChartLines: ChartLine[] = trialLines.map((line, index) => {
    const originalIndex = index;
    if (focusedTrialIndex !== null) {
      if (index === focusedTrialIndex) {
        return {
          ...line,
          color: 'rgba(59, 130, 246, 0.9)', 
          borderWidth: 2.5,
          label: `Trial ${index + 1} (Focused)`,
          originalIndex,
        };
      } else {
        return { 
          ...line,
          color: 'rgba(128, 128, 128, 0.05)', 
          borderWidth: 1,
          label: `Trial ${index + 1}`,
          originalIndex,
        };
      }
    }
    return {
      ...line,
      color: 'rgba(128, 128, 128, 0.3)', 
      borderWidth: 1,
      label: `Trial ${index + 1}`,
      originalIndex,
    };
  });

  const bestFitChartLine: ChartLine[] = bestFitLine ? [{
    ...bestFitLine,
    color: 'rgba(255, 0, 0, 0.8)', 
    borderWidth: 2,
    label: 'Best Fit Line'
  }] : [];

  return (
    <div className="flex flex-col md:flex-row h-screen max-h-screen bg-gray-900 text-white">
      <header className="md:hidden p-4 bg-gray-800 shadow-lg">
         <h1 className="text-xl font-bold text-center text-sky-400">Linear Regression Visualizer</h1>
      </header>
      <ControlPanel
        numTrials={numTrials}
        onNumTrialsChange={setNumTrials}
        onFileUpload={handleFileUpload}
        onRunTrials={runTrials}
        isLoading={isLoading}
        error={error}
        hasData={parsedData.length > 0}
        useSampleData={useSampleData}
        onUseSampleDataChange={setUseSampleData}
        specificTrialToFocusInput={specificTrialToFocusInput}
        onSpecificTrialToFocusInputChange={setSpecificTrialToFocusInput}
        onFocusSpecificTrial={handleFocusSpecificTrial}
        maxTrialNumber={trialLines.length}
      />
      <main className="flex-grow p-2 md:p-6 flex flex-col overflow-auto bg-gray-800">
        <h1 className="text-3xl font-bold mb-2 md:mb-6 text-center text-sky-400 hidden md:block">Linear Regression Trial Visualizer</h1>
        {error && !isLoading && (
          <div className="mb-4 p-3 bg-red-700 text-white rounded-md text-sm transition-all duration-300 ease-in-out">{error}</div>
        )}
        {parsedData.length === 0 && !isLoading && !error && (
            <div className="flex-grow flex items-center justify-center">
                <p className="text-gray-400 text-lg">Upload a CSV or use sample data to begin.</p>
            </div>
        )}

        {parsedData.length > 0 && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 md:gap-6 flex-grow min-h-[300px] md:min-h-[400px]">
              <div className="bg-gray-700 p-2 md:p-4 rounded-lg shadow-xl h-full min-h-[250px] md:min-h-0">
                <h2 className="text-lg md:text-xl font-semibold mb-1 md:mb-3 text-sky-300">
                  All Trial Lines {focusedTrialIndex !== null ? `(Trial ${focusedTrialIndex + 1} Focused)` : ''}
                </h2>
                <DataChart
                  key={`trials-chart-${chartKey}-${focusedTrialIndex}`}
                  chartId="trialsChart"
                  dataPoints={parsedData}
                  lines={allTrialChartLines}
                  minX={dataMinX}
                  maxX={dataMaxX}
                  onLineClick={handleTrialLineFocus}
                />
              </div>
              <div className="bg-gray-700 p-2 md:p-4 rounded-lg shadow-xl h-full min-h-[250px] md:min-h-0">
                <h2 className="text-lg md:text-xl font-semibold mb-1 md:mb-3 text-red-400">Best Fit Line</h2>
                <DataChart
                  key={`bestfit-chart-${chartKey}`}
                  chartId="bestFitChart"
                  dataPoints={parsedData}
                  lines={bestFitChartLine}
                  minX={dataMinX}
                  maxX={dataMaxX}
                />
              </div>
            </div>

            {bestFitLine && (
              <div className="mt-2 md:mt-6 p-3 md:p-4 bg-gray-700 rounded-lg shadow-xl">
                <h3 className="text-lg md:text-xl font-semibold mb-1 md:mb-2 text-sky-300">Best Fit Line Details:</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1 md:gap-4 text-sm md:text-base">
                  <p><strong className="text-sky-400">Equation:</strong> y = {bestFitLine.m.toFixed(4)}x + {bestFitLine.b.toFixed(4)}</p>
                  <p><strong className="text-sky-400">Slope (m):</strong> {bestFitLine.m.toFixed(4)}</p>
                  <p><strong className="text-sky-400">Intercept (b):</strong> {bestFitLine.b.toFixed(4)}</p>
                  <p><strong className="text-sky-400">MSE:</strong> {bestFitLine.mse?.toFixed(4)}</p>
                </div>
              </div>
            )}
            {focusedTrialIndex !== null && trialLines[focusedTrialIndex] && (
              <div className="mt-2 md:mt-6 p-3 md:p-4 bg-gray-700 rounded-lg shadow-xl border-2 border-sky-500">
                <h3 className="text-lg md:text-xl font-semibold mb-1 md:mb-2 text-sky-300">Focused Trial Line Details (Trial {focusedTrialIndex + 1}):</h3>
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1 md:gap-4 text-sm md:text-base">
                  <p><strong className="text-sky-400">Equation:</strong> y = {trialLines[focusedTrialIndex].m.toFixed(4)}x + {trialLines[focusedTrialIndex].b.toFixed(4)}</p>
                  <p><strong className="text-sky-400">Slope (m):</strong> {trialLines[focusedTrialIndex].m.toFixed(4)}</p>
                  <p><strong className="text-sky-400">Intercept (b):</strong> {trialLines[focusedTrialIndex].b.toFixed(4)}</p>
                  <p><strong className="text-sky-400">MSE:</strong> {trialLines[focusedTrialIndex].mse?.toFixed(4)}</p>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default App;
