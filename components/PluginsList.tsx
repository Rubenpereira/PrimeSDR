
import React, { useState, useRef, useEffect } from 'react';
import { X, Puzzle } from 'lucide-react';
import { PluginDefinition } from '../types';

interface PluginsListProps {
  plugins: PluginDefinition[];
  onTogglePlugin: (id: number) => void;
  onClose: () => void;
}

const PluginsList: React.FC<PluginsListProps> = ({ plugins, onTogglePlugin, onClose }) => {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    // Store the mouse position relative to the current offset
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
        className="absolute w-96 max-h-[500px] bg-black/95 border border-green-500 shadow-2xl z-50 rounded flex flex-col"
        style={{ 
            top: '50%', 
            left: '50%', 
            transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`
        }}
    >
        <div 
            className="bg-green-900/50 p-2 flex justify-between items-center border-b border-green-700 cursor-move select-none"
            onMouseDown={handleMouseDown}
        >
            <div className="flex items-center gap-2">
                <Puzzle size={16} className="text-green-400"/>
                <h3 className="text-green-400 font-bold text-sm">INSTALLED PLUGINS</h3>
            </div>
            <button onClick={onClose} className="text-green-500 hover:text-white" onMouseDown={e => e.stopPropagation()}>
                <X size={16} />
            </button>
        </div>
        
        <div className="overflow-y-auto p-2 space-y-1 custom-scrollbar flex-1">
            {plugins.map(plugin => (
                <div key={plugin.id} className={`p-2 border rounded flex justify-between items-center ${plugin.active ? 'border-green-400 bg-green-900/30' : 'border-green-900 hover:bg-green-900/20'}`}>
                    <div>
                        <div className="text-sm font-bold text-green-300">{plugin.name}</div>
                        <div className="text-[10px] text-green-700">{plugin.description}</div>
                    </div>
                    <button 
                        onClick={() => onTogglePlugin(plugin.id)}
                        className={`w-4 h-4 border border-green-600 rounded-sm flex items-center justify-center ${plugin.active ? 'bg-green-500' : 'bg-black'}`}
                    >
                        {plugin.active && <div className="w-2 h-2 bg-black rounded-full" />}
                    </button>
                </div>
            ))}
        </div>
    </div>
  );
};

export default PluginsList;
