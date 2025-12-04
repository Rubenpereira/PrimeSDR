
import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

interface VisualizerProps {
  isPlaying: boolean;
  frequency: number;
  mode: string;
  zoom: number; // For range
  contrast: number;
  offset: number;
  step: number;
  spectrumDataRef: React.MutableRefObject<Float32Array>; // Reference to real data
  onFreqChange: (hz: number) => void;
  onHoverFreq: (hz: number | null) => void;
}

const Visualizer: React.FC<VisualizerProps> = ({ 
  isPlaying, 
  frequency, 
  zoom, 
  contrast, 
  offset, 
  step, 
  spectrumDataRef,
  onFreqChange, 
  onHoverFreq 
}) => {
  const spectrumRef = useRef<HTMLDivElement>(null);
  const waterfallCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Data points should match the FFT size sent from Python (e.g., 4096)
  const dataPoints = 4096;
  
  useEffect(() => {
    if (!spectrumRef.current || !waterfallCanvasRef.current || !containerRef.current) return;

    const svg = d3.select(spectrumRef.current)
      .selectAll("svg")
      .data([null])
      .join("svg")
      .attr("width", "100%")
      .attr("height", "100%")
      .style("overflow", "visible");

    // Waterfall Context
    const canvas = waterfallCanvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    // Resize handling
    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        if (entry.target === containerRef.current) {
          const { width, height } = entry.contentRect;
          const specHeight = height * 0.25;
          const waterHeight = height * 0.75;
          
          svg.attr("height", specHeight).attr("width", width);
          canvas.width = width;
          canvas.height = waterHeight;
          
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, width, waterHeight);
        }
      }
    });

    resizeObserver.observe(containerRef.current);

    // Animation Loop
    let animationId: number;
    
    const draw = () => {
        if (!ctx) return;
        const width = canvas.width;
        const height = canvas.height;
        const specHeight = (containerRef.current?.clientHeight || 600) * 0.25;

        // If not playing, stop drawing updates (freeze or clear)
        if (!isPlaying) {
             svg.selectAll("path").remove();
             svg.selectAll("path.area").remove();
             
             // Draw flat line
             const xScale = d3.scaleLinear().domain([0, dataPoints - 1]).range([0, width]);
             const flatData = new Array(dataPoints).fill(specHeight);
             const line = d3.line<number>()
                .x((d, i) => xScale(i))
                .y(specHeight)
                .curve(d3.curveLinear);

             svg.selectAll("path.flat")
                .data([flatData])
                .join("path")
                .attr("class", "flat")
                .attr("d", line(flatData) || "")
                .attr("stroke", "#14532d")
                .attr("stroke-width", 1)
                .attr("fill", "none");
            return;
        }

        // Get Real Data from Ref (Updated by WebSocket in App.tsx)
        const rawData = spectrumDataRef.current;
        
        // Apply Offset manually if needed, though Python sends dB. 
        // We map the raw dB data to the visual scale.
        // Copy to a standard array for D3 (performance note: direct TypedArray usage is better but D3 handles arrays well)
        // We sub-sample for the SVG path if performance is bad, but 4096 is manageable.
        
        // 1. Draw Spectrum (D3)
        const xScale = d3.scaleLinear().domain([0, dataPoints - 1]).range([0, width]);
        
        // Dynamic Y Scale based on Range (zoom) and Offset
        // Typical SDR range: -100dBm to 0dBm.
        // Offset shifts the baseline. Range compresses/expands the view.
        const minDb = -120 + offset;
        const maxDb = -20 + offset + (200 - zoom); // inverse zoom logic for range
        
        const yScale = d3.scaleLinear()
            .domain([minDb, maxDb])
            .range([specHeight, 0]);

        const line = d3.line<number>()
            .x((d, i) => xScale(i))
            .y(d => yScale(d)) // Raw data is already in dB
            .curve(d3.curveLinear);

        svg.selectAll("path.flat").remove();

        svg.selectAll("path.signal")
            .data([rawData]) // Pass the TypedArray directly
            .join("path")
            .attr("class", "signal")
            .attr("d", line(rawData as any) || "")
            .attr("fill", "none")
            .attr("stroke", "#4ade80")
            .attr("stroke-width", 1)
            .attr("opacity", 0.9);

        // Fill area
        const area = d3.area<number>()
            .x((d, i) => xScale(i))
            .y0(specHeight)
            .y1(d => yScale(d))
            .curve(d3.curveLinear);
            
        svg.selectAll("path.area")
            .data([rawData])
            .join("path")
            .attr("class", "area")
            .attr("d", area(rawData as any) || "")
            .attr("fill", "#22c55e")
            .attr("fill-opacity", 0.1)
            .attr("stroke", "none");


        // 2. Draw Waterfall (Canvas)
        ctx.drawImage(canvas, 0, 0, width, height - 1, 0, 1, width, height - 1);

        const rowData = ctx.createImageData(width, 1);
        
        // Draw new line
        for (let x = 0; x < width; x++) {
            // Map screen X to data index
            const dataIndex = Math.floor((x / width) * dataPoints);
            const value = rawData[dataIndex]; // value is in dB (e.g. -100 to -30)
            
            // Waterfall Color Mapping
            // Normalize based on contrast and offset
            // Value is roughly -120 to 0.
            // AdjustedValue = (Value - Min) / (Max - Min)
            
            const wMin = -120 + offset;
            const wMax = -40 + offset - (contrast * 1.5); // Contrast tightens the dynamic range
            
            let intensity = (value - wMin) / (wMax - wMin);
            intensity = Math.max(0, Math.min(1, intensity));

            let r=0, g=0, b=0;
            
            // Standard Jet/Rainbow Colormap approximation
            if (intensity < 0.2) { // Deep Blue
                b = intensity * 5 * 255;
            } else if (intensity < 0.4) { // Blue to Cyan
                g = (intensity - 0.2) * 5 * 255;
                b = 255;
            } else if (intensity < 0.6) { // Cyan to Green
                g = 255;
                b = 255 - ((intensity - 0.4) * 5 * 255);
            } else if (intensity < 0.8) { // Green to Yellow
                r = (intensity - 0.6) * 5 * 255;
                g = 255;
            } else { // Yellow to Red
                r = 255;
                g = 255 - ((intensity - 0.8) * 5 * 255);
            }
            
            const pixelIndex = x * 4;
            rowData.data[pixelIndex] = r;
            rowData.data[pixelIndex + 1] = g;
            rowData.data[pixelIndex + 2] = b;
            rowData.data[pixelIndex + 3] = 255;
        }
        ctx.putImageData(rowData, 0, 0);

        // Center Line
        svg.selectAll("line.center").data([null]).join("line")
            .attr("class", "center")
            .attr("x1", width / 2)
            .attr("x2", width / 2)
            .attr("y1", 0)
            .attr("y2", specHeight)
            .attr("stroke", "rgba(255, 0, 0, 0.5)")
            .attr("stroke-dasharray", "4,4");

        animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
        cancelAnimationFrame(animationId);
        resizeObserver.disconnect();
    };
  }, [isPlaying, frequency, contrast, offset, zoom, spectrumDataRef]); // spectrumDataRef dependency is stable

  // Helper to calculate frequency from mouse X
  const getFreqFromMouse = (clientX: number): number => {
      if (!containerRef.current) return frequency;
      const rect = containerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const width = rect.width;
      
      const center = width / 2;
      const deviationPercent = (x - center) / width;
      // Note: Sample Rate defines the view bandwidth.
      // Assuming typical 2.048 MHz for calculation here or pass sampleRate as prop.
      // Using 2M as safe default approximation for UI.
      const viewBw = 2000000; 
      return frequency + (deviationPercent * viewBw);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
      let newFreq = getFreqFromMouse(e.clientX);
      if (step > 0) {
        newFreq = Math.round(newFreq / step) * step;
      }
      onFreqChange(newFreq);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      const freq = getFreqFromMouse(e.clientX);
      onHoverFreq(freq);
  };

  const handleMouseLeave = () => {
      onHoverFreq(null);
  };

  return (
    <div 
        ref={containerRef} 
        className="w-full h-full flex flex-col relative cursor-crosshair select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onWheel={(e) => {
            onFreqChange(frequency + (e.deltaY > 0 ? -step : step));
        }}
    >
        <div ref={spectrumRef} className="w-full h-[25%] bg-black/50 border-b border-green-900/50" />
        <canvas ref={waterfallCanvasRef} className="w-full h-[75%] block" />
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-[1px] h-full bg-red-500/30"></div>
            <div className="h-[1px] w-full bg-red-500/30 absolute"></div>
        </div>
    </div>
  );
};

export default Visualizer;
