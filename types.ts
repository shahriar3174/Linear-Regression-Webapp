
export interface DataPoint {
  x: number;
  y: number;
}

export interface LineParams {
  m: number; // slope
  b: number; // intercept
  mse?: number; // mean squared error
}

export interface ChartLine extends LineParams {
  color: string;
  borderWidth: number;
  label: string;
  originalIndex?: number; // Index of the line in the original trialLines array
}

// Declare global variables for CDN libraries
declare global {
  interface Window {
    Papa: any; // PapaParse
    Chart: any; // Chart.js
    ChartZoom: any; // chartjs-plugin-zoom
  }
}

// This export is just to make TypeScript treat this as a module.
export {};