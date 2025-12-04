
import React, { useState, useRef, useEffect } from 'react';
import { X, Activity } from 'lucide-react';
import { PluginDefinition } from '../types';

interface PluginWindowProps {
  plugin: PluginDefinition;
  onClose: () => void;
  style?: React.CSSProperties;
}

const PluginWindow: React.FC<PluginWindowProps> = ({ plugin, onClose, style }) => {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartRef.current = { 
      x: e.clientX - offset.x, 
      y: e.clientY - offset.y 
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      setOffset({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div 
        className="absolute w-[500px] h-[300px] bg-black/95 border border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)] z-[60] rounded-lg overflow-hidden flex flex-col"
        style={{ 
            top: '50%', 
            left: '50%', 
            // Combine the initial centering from style with drag offset
            transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
            ...style 
        }}
    >
      <div 
        className="bg-green-900/50 p-2 flex justify-between items-center border-b border-green-700 cursor-move select-none"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
            <Activity size={14} className="text-green-400"/>
            <h3 className="text-green-400 font-bold text-sm uppercase">{plugin.name}</h3>
        </div>
        <button onClick={onClose} className="text-green-500 hover:text-white" onMouseDown={e => e.stopPropagation()}><X size={16} /></button>
      </div>
      
      <div className="flex-1 bg-black p-2 font-mono text-xs overflow-y-auto custom-scrollbar">
          <div className="text-green-700 mb-2">
            Initialized {plugin.name} plugin...<br/>
            Bandwidth locked to {plugin.description}<br/>
            Connected to RTL-SDR I/Q stream...
          </div>
          <div className="text-green-500 animate-pulse">
              Acquiring Signal Lock...
          </div>
          <div className="mt-4 text-green-800 opacity-50">
              [SYSTEM] Live RF Processing Active
          </div>
          <div className="mt-2 text-green-400">
             &gt; _
          </div>
      </div>
    </div>
  );
};

export default PluginWindow;
