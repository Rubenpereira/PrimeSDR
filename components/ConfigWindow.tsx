
import React from 'react';
import { X } from 'lucide-react';
import { SDRState } from '../types';
import { SAMPLE_RATES } from '../constants';

interface ConfigWindowProps {
  sdrState: SDRState;
  setSdrState: React.Dispatch<React.SetStateAction<SDRState>>;
  onClose: () => void;
}

const ConfigWindow: React.FC<ConfigWindowProps> = ({ sdrState, setSdrState, onClose }) => {
  return (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 bg-black/95 border border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)] z-50 rounded-lg overflow-hidden">
      <div className="bg-green-900/50 p-2 flex justify-between items-center border-b border-green-700">
        <h3 className="text-green-400 font-bold text-sm">DEVICE CONFIGURATION</h3>
        <button onClick={onClose} className="text-green-500 hover:text-white"><X size={16} /></button>
      </div>
      <div className="p-4 space-y-4 text-xs">
          
          {/* Source Selection */}
          <div className="flex gap-4 p-2 bg-green-900/20 rounded border border-green-900/50">
               <label className="flex items-center gap-2 text-green-400 cursor-pointer">
                   <input 
                      type="radio" 
                      name="source"
                      checked={sdrState.source === 'RTL-SDR'} 
                      onChange={() => setSdrState(p => ({...p, source: 'RTL-SDR'}))}
                      className="accent-green-500" 
                   />
                   RTL-SDR USB
               </label>
               <label className="flex items-center gap-2 text-green-400 cursor-pointer">
                   <input 
                      type="radio" 
                      name="source"
                      checked={sdrState.source === 'TCP'} 
                      onChange={() => setSdrState(p => ({...p, source: 'TCP'}))}
                      className="accent-green-500" 
                   />
                   TCP-IP NET
               </label>
          </div>

          {/* TCP Settings - Conditional Rendering/Disabling */}
          <div className={`space-y-2 p-2 border border-green-900/50 rounded ${sdrState.source === 'TCP' ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
              <div className="text-green-600 font-bold mb-1">TCP NETWORK SETTINGS</div>
              <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2 space-y-1">
                      <label className="text-green-600 block">Host IP</label>
                      <input 
                          type="text" 
                          value={sdrState.tcpIp}
                          onChange={(e) => setSdrState(p => ({...p, tcpIp: e.target.value}))}
                          className="w-full bg-black border border-green-800 text-green-400 p-1 rounded focus:border-green-500 outline-none"
                          placeholder="127.0.0.1"
                      />
                  </div>
                  <div className="space-y-1">
                      <label className="text-green-600 block">Port</label>
                      <input 
                          type="number" 
                          value={sdrState.tcpPort}
                          onChange={(e) => setSdrState(p => ({...p, tcpPort: parseInt(e.target.value)}))}
                          className="w-full bg-black border border-green-800 text-green-400 p-1 rounded focus:border-green-500 outline-none"
                          placeholder="1234"
                      />
                  </div>
              </div>
          </div>

          <div className="space-y-1">
              <label className="text-green-600">Sample Rate</label>
              <select
                  value={sdrState.sampleRate}
                  onChange={(e) => setSdrState(p => ({...p, sampleRate: parseInt(e.target.value)}))}
                  className="w-full bg-black border border-green-800 text-green-400 p-1 rounded focus:border-green-500 outline-none"
              >
                  {SAMPLE_RATES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
          </div>

          <div className="space-y-1">
              <label className="text-green-600">Sampling Mode</label>
              <select
                  value={sdrState.samplingMode}
                  onChange={(e) => setSdrState(p => ({...p, samplingMode: e.target.value as any}))}
                  className="w-full bg-black border border-green-800 text-green-400 p-1 rounded focus:border-green-500 outline-none"
              >
                  <option value="Quadrature">Quadrature Sampling</option>
                  <option value="Direct Q">Direct Sampling (Q branch)</option>
              </select>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-green-900/50">
               <label className="flex items-center gap-2 text-green-400 cursor-pointer">
                   <input type="checkbox" checked={sdrState.tunerAGC} onChange={e => setSdrState(p => ({...p, tunerAGC: e.target.checked}))} className="accent-green-500" />
                   Tuner AGC
               </label>

               <div className="flex items-center gap-2">
                   <span className="text-green-600">PPM</span>
                   <input
                        type="number"
                        value={sdrState.ppm}
                        onChange={e => setSdrState(p => ({...p, ppm: parseInt(e.target.value)}))}
                        className="w-16 bg-black border border-green-800 text-green-400 text-center p-1 rounded focus:border-green-500 outline-none"
                   />
               </div>
          </div>
      </div>
    </div>
  );
};
export default ConfigWindow;
