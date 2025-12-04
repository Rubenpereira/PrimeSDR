import React, { useEffect, useState } from 'react';

interface SMeterProps {
  signalLevel: number; // 0 to 100 roughly
}

const SMeter: React.FC<SMeterProps> = ({ signalLevel }) => {
  const [needleAngle, setNeedleAngle] = useState(-45);

  useEffect(() => {
    // Map signal level (0-100) to angle (-45 to 45)
    // Add some jitter for realism
    const jitter = (Math.random() - 0.5) * 5;
    const targetAngle = -45 + (signalLevel / 100) * 90 + jitter;
    setNeedleAngle(Math.max(-45, Math.min(45, targetAngle)));
  }, [signalLevel]);

  // Generate LED segments
  const leds = Array.from({ length: 15 }).map((_, i) => {
    const isActive = (i / 15) * 100 < signalLevel;
    let colorClass = 'bg-green-500';
    if (i > 9) colorClass = 'bg-yellow-500';
    if (i > 12) colorClass = 'bg-red-600';

    return (
      <div
        key={i}
        className={`w-1.5 h-3 mx-[1px] ${isActive ? colorClass : 'bg-gray-800'} rounded-sm transition-colors duration-75`}
      />
    );
  });

  return (
    <div className="absolute top-2 left-2 z-10 bg-black/80 border border-green-800 p-2 rounded w-48 shadow-[0_0_15px_rgba(34,197,94,0.2)]">
      {/* Analog Scale Background */}
      <div className="relative h-16 w-full mb-1 border-b border-green-900 overflow-hidden">
        <div className="absolute inset-x-0 bottom-0 text-[10px] text-green-600 flex justify-between px-2">
           <span>0</span><span>3</span><span>5</span><span>7</span><span>9</span><span className="text-red-500">+30</span>
        </div>
        
        {/* Needle */}
        <div 
          className="absolute bottom-0 left-1/2 w-0.5 h-14 bg-red-500 origin-bottom transition-transform duration-200 ease-out"
          style={{ transform: `translateX(-50%) rotate(${needleAngle}deg)` }}
        ></div>
        <div className="absolute bottom-[-4px] left-1/2 w-3 h-3 bg-gray-400 rounded-full transform -translate-x-1/2"></div>
      </div>

      {/* LED Bar */}
      <div className="flex justify-center mt-1">
        {leds}
      </div>
      <div className="text-center text-xs text-green-400 font-mono mt-1">S-METER</div>
    </div>
  );
};

export default SMeter;
