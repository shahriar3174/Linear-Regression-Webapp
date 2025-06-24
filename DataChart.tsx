
import React, { useEffect, useRef } from 'react';
import { DataPoint, ChartLine } from '../types';

interface DataChartProps {
  chartId: string;
  dataPoints: DataPoint[];
  lines: ChartLine[];
  minX: number;
  maxX: number;
  onLineClick?: (lineIndex: number) => void; // Callback for line clicks
}

export const DataChart: React.FC<DataChartProps> = ({ chartId, dataPoints, lines, minX, maxX, onLineClick }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<any>(null); 

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    if (window.Chart && window.ChartZoom && !window.Chart.registry.plugins.get('zoom')) {
         window.Chart.register(window.ChartZoom);
    }

    const datasets = [];

    if (dataPoints.length > 0) {
      datasets.push({
        type: 'scatter',
        label: 'Data Points',
        data: dataPoints,
        backgroundColor: 'rgba(75, 192, 192, 0.6)', 
        borderColor: 'rgba(75, 192, 192, 1)',
        pointRadius: 5,
        pointHoverRadius: 7,
        order: 1 // Render points on top of lines if overlapping
      });
    }

    lines.forEach((line) => { // line here is a ChartLine object from props
      const y1 = line.m * minX + line.b;
      const y2 = line.m * maxX + line.b;
      datasets.push({
        type: 'line',
        label: line.label, // This label is already set correctly in App.tsx
        data: [
          { x: minX, y: y1 },
          { x: maxX, y: y2 }
        ],
        borderColor: line.color,
        borderWidth: line.borderWidth,
        fill: false,
        tension: 0, 
        pointRadius: 0,
        originalIndex: line.originalIndex, // Store originalIndex for click handling and tooltips
        // Store m, b, mse directly on dataset for tooltip, if not relying on finding from lines prop
        m: line.m,
        b: line.b,
        mse: line.mse,
        order: 0 // Render lines behind points
      });
    });
    
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    chartRef.current = new window.Chart(ctx, {
      type: 'scatter', 
      data: {
        datasets: datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        onClick: (event: any, elements: any[], chart: any) => {
          if (onLineClick && elements.length > 0 && chartId === 'trialsChart') { // Only for trialsChart
            const clickedElement = elements[0];
            const datasetIndex = clickedElement.datasetIndex;
            const clickedDataset = chart.data.datasets[datasetIndex];

            // Check if it's a line dataset and has our originalIndex property
            if (clickedDataset && clickedDataset.type === 'line' && typeof clickedDataset.originalIndex === 'number') {
              onLineClick(clickedDataset.originalIndex);
            }
          }
        },
        onHover: (event: any, activeElements: any[], chart: any) => {
          const target = event.native?.target as HTMLElement | undefined;
          if (target) {
            if (activeElements.length > 0 && chartId === 'trialsChart') {
                const datasetIndex = activeElements[0].datasetIndex;
                const dataset = chart.data.datasets[datasetIndex];
                if (dataset && dataset.type === 'line') {
                    target.style.cursor = 'pointer';
                    return;
                }
            }
            target.style.cursor = 'default';
          }
        },
        scales: {
          x: {
            type: 'linear',
            position: 'bottom',
            title: {
              display: true,
              text: 'X Value',
              color: '#cbd5e1' 
            },
            ticks: { color: '#94a3b8' }, 
            grid: { color: 'rgba(100, 116, 139, 0.2)'} 
          },
          y: {
            type: 'linear',
            title: {
              display: true,
              text: 'Y Value',
              color: '#cbd5e1'
            },
            ticks: { color: '#94a3b8' },
            grid: { color: 'rgba(100, 116, 139, 0.2)'}
          }
        },
        plugins: {
          legend: {
            display: false, 
            labels: {
                color: '#cbd5e1' 
            }
          },
          tooltip: {
            mode: 'index', // 'nearest' or 'point' might be better for lines if 'index' is confusing
            intersect: false,
            backgroundColor: 'rgba(31, 41, 55, 0.9)', 
            titleColor: '#e5e7eb', 
            bodyColor: '#d1d5db', 
            callbacks: {
                title: function(tooltipItems) {
                    // For line datasets, use their label as the title (e.g., "Trial X (Focused)")
                    if (tooltipItems.length > 0) {
                        const item = tooltipItems[0];
                        const dataset = item.chart.data.datasets[item.datasetIndex];
                        if (dataset.type === 'line') {
                            return dataset.label || '';
                        }
                    }
                    return ''; // Default title for scatter points (usually X value)
                },
                label: function(context) {
                    const dataset = context.chart.data.datasets[context.datasetIndex];
                    let labelParts: string[] = [];

                    if (dataset.type === 'line' && typeof dataset.originalIndex === 'number') {
                        // Access m, b, mse stored on the dataset object
                        const m = (dataset as any).m;
                        const b = (dataset as any).b;
                        const mse = (dataset as any).mse;
                        
                        if (typeof m === 'number' && typeof b === 'number') {
                           labelParts.push(`Eq: y = ${m.toFixed(3)}x + ${b.toFixed(3)}`);
                        }
                        if (typeof mse === 'number') {
                           labelParts.push(`MSE: ${mse.toFixed(3)}`);
                        }
                        return labelParts;
                    }
                    
                    if (dataset.type === 'scatter' && context.parsed.x !== null && context.parsed.y !== null) {
                        return `${dataset.label}: (${context.parsed.x.toFixed(2)}, ${context.parsed.y.toFixed(2)})`;
                    }
                    // Fallback or default label string
                    return context.dataset.label + ': ' + context.formattedValue;
                }
            }
          },
          zoom: {
            pan: {
              enabled: true,
              mode: 'xy',
              threshold: 5,
            },
            zoom: {
              wheel: {
                enabled: true,
              },
              pinch: {
                enabled: true
              },
              mode: 'xy',
            }
          }
        }
      }
    });
    
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartId, dataPoints, lines, minX, maxX, onLineClick]); // `lines` is included because its content (m, b, mse) is used for tooltips

  return <canvas ref={canvasRef} id={chartId} className="w-full h-full"></canvas>;
};
