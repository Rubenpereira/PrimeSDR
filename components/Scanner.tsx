
import React, { useState, useEffect } from 'react';
import { Play, Pause, Square } from 'lucide-react';

interface ScannerProps {
  onClose: () => void;
  onTune: (freq: number) => void;
  step: number; // Receive current step
}

const Scanner: React.FC<ScannerProps> = ({ onClose, onTune, step }) => {
  const [active, setActive] = useState(false);
  const [currentFreq, setCurrentFreq] = useState(144000000);
  
  // Define scan range (fixed 144-148 MHz per initial specs)
  const START_FREQ = 144000000;
  const END_FREQ = 148000000;

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (active) {
      interval = setInterval(() => {
        setCurrentFreq(prevFreq => {
            let nextFreq = prevFreq + step;
            if (nextFreq > END_FREQ) {
                nextFreq = START_FREQ;
            }
            return nextFreq;
        });

        // Simulation: Randomly "find" a signal to stop on
        // In a real app, this would check RSSI/Squelch
        if (Math.random() > 0.95) { // 5% chance to stop
             // We need to use the functional update of setCurrentFreq's result here, 
             // but since we can't easily access the result of the state update immediately inside the interval,
             // we simulate the "lock" logic loosely or use a ref. 
             // For this UI simulation, we just trigger onTune occasionally.
             
             // To be accurate to the UI display, we tune to the calculated next freq.
             // Since state updates are async, we can't grab 'nextFreq' perfectly here without logic change.
             // We will simply tune to 'currentFreq' + step for the simulation effect.
             onTune(currentFreq + step);
        }
      }, 100); // Scan speed
    }
    return () => clearInterval(interval);
  }, [active, onTune, step, currentFreq]);

  return (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 bg-black/95 border border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)] z-50 rounded-lg overflow-hidden">
      <div className="bg-green-900/50 p-2 flex justify-between items-center cursor-move border-b border-green-700">
        <h3 className="text-green-400 font-bold text-sm">SCANNER SYSTEM</h3>
        <button onClick={onClose} className="text-green-500 hover:text-white">×</button>
      </div>
      
      <div className="p-4 flex flex-col gap-4">
        <div className="bg-black border border-green-800 p-3 text-center rounded">
          <span className="text-2xl font-mono text-green-400">
            {(currentFreq / 1000000).toFixed(4)} MHz
          </span>
        </div>

        <div className="flex justify-center gap-2">
            <button 
                onClick={() => setActive(true)}
                className={`flex items-center gap-1 px-4 py-2 rounded ${active ? 'bg-green-600 text-black shadow-[0_0_10px_#22c55e]' : 'bg-green-900/30 border border-green-600 hover:bg-green-800'}`}
            >
                <Play size={16} /> INICIAR
            </button>
            <button 
                onClick={() => setActive(false)}
                className="flex items-center gap-1 px-4 py-2 bg-green-900/30 border border-green-600 hover:bg-green-800 rounded"
            >
                <Pause size={16} /> PAUSE
            </button>
            <button 
                onClick={() => { setActive(false); setCurrentFreq(START_FREQ); }}
                className="flex items-center gap-1 px-4 py-2 bg-red-900/30 border border-red-600 hover:bg-red-900 rounded text-red-400"
            >
                <Square size={16} /> PARAR
            </button>
        </div>

        <div className="text-xs text-green-600 text-center">
            Range: 144-148 MHz | Step: {step/1000}kHz
        </div>
      </div>
    </div>
  );
};

export default Scanner;
