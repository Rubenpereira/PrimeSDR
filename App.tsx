
import React, { useState, useEffect, useRef } from 'react';
import { Power, Radio, Activity, X, Minus, Globe, Wifi, WifiOff } from 'lucide-react';
import { BANDS, formatFrequency, STEPS } from './constants';
import { DemodMode, SDRState, PluginDefinition } from './types';
import { AVAILABLE_PLUGINS } from './constants'; 
import SMeter from './components/SMeter';
import Visualizer from './components/Visualizer';
import Scanner from './components/Scanner';
import ConfigWindow from './components/ConfigWindow';
import PluginWindow from './components/PluginWindow';
import PluginsList from './components/PluginsList';

const App: React.FC = () => {
  // --- Global State ---
  const [sdrState, setSdrState] = useState<SDRState>({
    isPlaying: false,
    frequency: 145350000,
    mode: DemodMode.NFM,
    bandwidth: 10000,
    squelch: 0.0,
    gain: 49.6,
    step: 10000,
    sampleRate: 1024000,
    samplingMode: 'Quadrature',
    tunerAGC: true,
    ppm: 0,
    volume: 75,
    nrEnabled: false,
    source: 'RTL-SDR',
    tcpIp: '127.0.0.1',
    tcpPort: 1234
  });

  const [showScanner, setShowScanner] = useState(false);
  const [showPluginsList, setShowPluginsList] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [plugins, setPlugins] = useState<PluginDefinition[]>(AVAILABLE_PLUGINS);
  const [isConnected, setIsConnected] = useState(false);
  
  // Real Data Refs
  const wsRef = useRef<WebSocket | null>(null);
  // 4096 points FFT buffer
  const spectrumDataRef = useRef<Float32Array>(new Float32Array(4096).fill(-100));
  
  const [hoverFreq, setHoverFreq] = useState<number | null>(null);
  const [bandwidthInput, setBandwidthInput] = useState(sdrState.bandwidth.toString());
  const [freqInput, setFreqInput] = useState(formatFrequency(sdrState.frequency));

  const [visControls, setVisControls] = useState({
      offset: -20, 
      range: 67,   
      contrast: 15 
  });

  const [signalLevel, setSignalLevel] = useState(0);

  // --- WebSocket Connection ---
  useEffect(() => {
    // Attempt to connect to local Python server
    const connect = () => {
        const ws = new WebSocket('ws://localhost:8765');
        
        ws.binaryType = 'arraybuffer';

        ws.onopen = () => {
            console.log("Connected to PrimeSDR Server");
            setIsConnected(true);
            // Send initial state
            sendState(ws, sdrState);
        };

        ws.onclose = () => {
            console.log("Disconnected from PrimeSDR Server");
            setIsConnected(false);
            setTimeout(connect, 3000); // Reconnect attempt
        };

        ws.onerror = (err) => {
            console.error("WS Error", err);
            ws.close();
        };

        ws.onmessage = (event) => {
            if (event.data instanceof ArrayBuffer) {
                // Binary Spectrum Data
                const floatArray = new Float32Array(event.data);
                // Copy to ref for Visualizer
                if (floatArray.length === spectrumDataRef.current.length) {
                    spectrumDataRef.current.set(floatArray);
                    
                    // Simple S-Meter calculation from FFT peak
                    let maxVal = -120;
                    for(let i=0; i<floatArray.length; i++) {
                        if(floatArray[i] > maxVal) maxVal = floatArray[i];
                    }
                    // Map -80...-10 to 0...100 approx
                    const sMeter = Math.max(0, Math.min(100, (maxVal + 80) * 1.5));
                    setSignalLevel(sMeter);
                }
            } else {
                // JSON Message (if any)
                try {
                    const msg = JSON.parse(event.data);
                    // Handle server messages if needed
                } catch(e) {}
            }
        };

        wsRef.current = ws;
    };

    connect();

    return () => {
        wsRef.current?.close();
    };
  }, []);

  // --- Send Commands to Server ---
  const sendState = (ws: WebSocket | null, state: SDRState) => {
      if (ws && ws.readyState === WebSocket.OPEN) {
          const payload = {
              type: 'UPDATE_CONFIG',
              config: {
                  frequency: state.frequency,
                  sampleRate: state.sampleRate,
                  gain: state.gain,
                  agc: state.tunerAGC,
                  ppm: state.ppm,
                  mode: state.mode,
                  bw: state.bandwidth,
                  squelch: state.squelch,
                  playing: state.isPlaying,
                  samplingMode: state.samplingMode
              }
          };
          ws.send(JSON.stringify(payload));
      }
  };

  // Sync state changes to server
  useEffect(() => {
      sendState(wsRef.current, sdrState);
  }, [sdrState]);

  // Sync inputs
  useEffect(() => { setBandwidthInput(sdrState.bandwidth.toString()); }, [sdrState.bandwidth]);
  useEffect(() => { setFreqInput(formatFrequency(sdrState.frequency)); }, [sdrState.frequency]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return;

      switch (e.key) {
        case 'ArrowUp': e.preventDefault(); setSdrState(p => ({ ...p, frequency: Math.max(0, p.frequency + 1000000) })); break;
        case 'ArrowDown': e.preventDefault(); setSdrState(p => ({ ...p, frequency: Math.max(0, p.frequency - 1000000) })); break;
        case 'ArrowRight': e.preventDefault(); setSdrState(p => ({ ...p, frequency: Math.max(0, p.frequency + 10000) })); break;
        case 'ArrowLeft': e.preventDefault(); setSdrState(p => ({ ...p, frequency: Math.max(0, p.frequency - 10000) })); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const togglePower = () => setSdrState(p => ({ ...p, isPlaying: !p.isPlaying }));
  const updateFreq = (f: number) => setSdrState(p => ({ ...p, frequency: Math.max(0, f) }));
  
  const handleBandSelect = (band: typeof BANDS[0]) => {
      setSdrState(prev => ({
          ...prev,
          frequency: band.freq,
          mode: band.mode,
          step: band.step 
      }));
  };

  const togglePlugin = (id: number) => setPlugins(plugins.map(p => p.id === id ? { ...p, active: !p.active } : p));

  const handleBandwidthKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
          const val = parseInt(bandwidthInput.replace(/\D/g, ''));
          if (!isNaN(val) && val > 0) setSdrState(p => ({ ...p, bandwidth: val }));
          else setBandwidthInput(sdrState.bandwidth.toString());
      }
  };

  const handleFreqChange = (e: React.ChangeEvent<HTMLInputElement>) => setFreqInput(e.target.value);
  const handleFreqKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
          const val = parseInt(freqInput.replace(/\D/g, ''), 10);
          if (!isNaN(val)) {
              updateFreq(val);
              e.currentTarget.blur(); 
          } else {
              setFreqInput(formatFrequency(sdrState.frequency));
          }
      }
  };

  const [contextMenu, setContextMenu] = useState<{x: number, y: number} | null>(null);
  const handleContextMenu = (e: React.MouseEvent) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY }); };
  const closeContextMenu = () => setContextMenu(null);

  return (
    <div className="w-screen h-screen bg-green-950 flex flex-col overflow-hidden font-sans select-none text-green-500" onClick={closeContextMenu}>
      {/* HEADER */}
      <header className="h-8 bg-black border-b border-green-800 flex items-center justify-between px-2 shrink-0">
        <div className="flex items-center gap-2">
            <Radio size={16} className="text-green-400" />
            <span className="font-bold text-sm tracking-wide text-green-400">PrimeSDR v 1.0 <span className="text-green-700 font-normal">| Desenvolvido Por PU1XTB</span></span>
            {/* Connection Status Indicator */}
            <div className={`ml-4 flex items-center gap-1 text-[10px] ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
                {isConnected ? <Wifi size={12}/> : <WifiOff size={12}/>}
                {isConnected ? 'HARDWARE CONNECTED' : 'NO CONNECTION TO SERVER'}
            </div>
        </div>
        <div className="flex gap-1">
            <button className="p-1 hover:bg-green-900 rounded"><Minus size={14} /></button>
            <button className="p-1 hover:bg-red-900 hover:text-red-500 rounded"><X size={14} /></button>
        </div>
      </header>

      {/* MAIN */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT CONTROLS */}
        <aside className="w-[25%] min-w-[300px] bg-black border-r border-green-800 flex flex-col p-2 gap-4 overflow-y-auto custom-scrollbar">
            
            {/* POWER & TABS */}
            <div className="grid grid-cols-4 gap-1">
                <button 
                    onClick={togglePower}
                    className={`col-span-1 h-10 flex items-center justify-center rounded border ${sdrState.isPlaying ? 'bg-green-600 text-black border-green-400 shadow-[0_0_10px_#22c55e]' : 'bg-gray-900 border-green-800 text-green-700'}`}
                >
                    <Power size={18} />
                </button>
                <button onClick={() => setShowConfig(true)} className={`border border-green-800 hover:bg-green-900 text-xs rounded ${showConfig ? 'bg-green-800 text-white' : 'bg-gray-900'}`}>CONFIG</button>
                <button onClick={() => setShowScanner(!showScanner)} className={`border border-green-800 hover:bg-green-900 text-xs rounded ${showScanner ? 'bg-green-800 text-white' : 'bg-gray-900'}`}>SCANNER</button>
                <button onClick={() => setShowPluginsList(!showPluginsList)} className={`border border-green-800 hover:bg-green-900 text-xs rounded ${showPluginsList ? 'bg-green-800 text-white' : 'bg-gray-900'}`}>PLUGINS</button>
            </div>

            {/* FREQ DISPLAY */}
            <div className="bg-gray-900 border-2 border-green-900 rounded p-2 text-center relative shadow-inner">
                 <div className="text-[10px] text-green-700 absolute top-1 left-2">FREQUENCY</div>
                 <input 
                    type="text" 
                    value={freqInput}
                    onChange={handleFreqChange}
                    onKeyDown={handleFreqKeyDown}
                    className="w-full bg-transparent text-3xl font-mono text-green-400 font-bold text-center outline-none tracking-widest"
                 />
                 <div className="flex justify-center mt-2 px-4 h-4">
                     <span className="text-xs text-green-600 font-mono tracking-wider">
                        {hoverFreq !== null ? formatFrequency(hoverFreq) : '---.---.---'}
                     </span>
                 </div>
            </div>

            {/* DEMOD MODES */}
            <div className="space-y-1">
                <label className="text-xs font-bold text-green-700">DEMODULADOR</label>
                <div className="grid grid-cols-3 gap-1">
                    {Object.values(DemodMode).map(m => (
                        <button 
                            key={m}
                            onClick={() => setSdrState(p => ({ ...p, mode: m }))}
                            className={`py-1 text-xs border rounded ${sdrState.mode === m ? 'bg-green-600 text-black border-green-400 font-bold' : 'bg-transparent border-green-800 text-green-600 hover:bg-green-900'}`}
                        >
                            {m}
                        </button>
                    ))}
                </div>
                
                <div className="flex flex-col gap-2 mt-2">
                    <div className="flex items-center justify-between text-xs">
                        <span>Bandwidth:</span>
                        <div className="flex items-center">
                            <input 
                                type="text" 
                                value={bandwidthInput}
                                onChange={(e) => setBandwidthInput(e.target.value)}
                                onKeyDown={handleBandwidthKeyDown}
                                className="bg-gray-900 border border-green-800 w-24 px-1 text-right text-green-400 outline-none focus:border-green-500"
                            />
                            <span className="ml-1">Hz</span>
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs">
                        <span>STEP [EDIT]:</span>
                        <div className="flex items-center">
                            <select 
                                value={sdrState.step}
                                onChange={(e) => setSdrState(p => ({ ...p, step: parseInt(e.target.value) }))}
                                className="bg-gray-900 border border-green-800 w-28 px-1 text-right text-green-400 outline-none focus:border-green-500"
                            >
                                {STEPS.map(s => <option key={s} value={s}>{s < 1000 ? `${s} Hz` : `${s/1000} kHz`}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* AUDIO & GAIN */}
            <div className="space-y-2 border-t border-green-900 pt-2">
                 <div className="flex items-center justify-between">
                     <span className="text-xs">VOL</span>
                     <input type="range" min="0" max="100" value={sdrState.volume} onChange={(e) => setSdrState(p => ({...p, volume: parseInt(e.target.value)}))} className="w-32 accent-green-500 h-1 bg-green-900 rounded-lg appearance-none cursor-pointer" />
                 </div>
                 <div className="flex items-center justify-between">
                     <span className="text-xs">SQL</span>
                     <input type="number" step="0.1" value={sdrState.squelch} onChange={(e) => setSdrState(p => ({...p, squelch: parseFloat(e.target.value)}))} className="w-24 bg-gray-900 border border-green-800 text-right text-xs" />
                 </div>
                 <div className="flex items-center justify-between">
                     <span className="text-xs">GAIN</span>
                     <div className="flex flex-col w-full ml-2">
                         <input type="range" min="0" max="50" step="0.1" value={sdrState.gain} onChange={(e) => setSdrState(p => ({...p, gain: parseFloat(e.target.value)}))} className="w-full accent-green-500 h-1 bg-green-900 rounded-lg appearance-none cursor-pointer" />
                         <span className="text-[10px] text-right text-green-600">{sdrState.gain.toFixed(1)} dB</span>
                     </div>
                 </div>
                 
                 <div className="space-y-1 mt-2">
                    <button 
                        onClick={() => setSdrState(p => ({...p, nrEnabled: !p.nrEnabled}))}
                        className={`w-full py-1 text-xs border rounded flex items-center justify-center gap-2 ${sdrState.nrEnabled ? 'bg-yellow-600 text-black border-yellow-400 shadow-[0_0_8px_rgba(234,179,8,0.5)]' : 'bg-gray-900 border-green-800 text-green-700'}`}
                    >
                        <Activity size={12} /> NR (REDUTOR DE RUIDOS)
                    </button>
                    <a href="http://www.eibispace.de/dx/eibi.txt" target="_blank" rel="noopener noreferrer" className="w-full py-1 text-xs border border-green-800 rounded flex items-center justify-center gap-2 bg-gray-900 text-green-700 hover:bg-green-900 hover:text-green-400">
                        <Globe size={12} /> EiBI
                    </a>
                 </div>
            </div>
        </aside>

        {/* RIGHT DISPLAY */}
        <main className="w-[75%] bg-black relative flex" onContextMenu={handleContextMenu}>
            <SMeter signalLevel={signalLevel} />
            
            <Visualizer 
                isPlaying={sdrState.isPlaying}
                frequency={sdrState.frequency}
                mode={sdrState.mode}
                zoom={visControls.range}
                offset={visControls.offset}
                contrast={visControls.contrast}
                step={sdrState.step}
                spectrumDataRef={spectrumDataRef} // Pass real data ref
                onFreqChange={updateFreq}
                onHoverFreq={setHoverFreq}
            />

            {/* VISUALIZER CONTROLS */}
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-black/80 border-l border-green-900 flex flex-col items-center justify-center gap-12 py-4 z-10">
                 {/* OFF */}
                 <div className="flex flex-col items-center gap-2 h-32 justify-center" onWheel={(e) => setVisControls(p => ({ ...p, offset: Math.max(-50, Math.min(50, p.offset + (e.deltaY > 0 ? -2 : 2))) }))}>
                    <span className="text-[9px] text-green-600 font-bold rotate-0">OFF</span>
                    <div className="relative h-24 w-4">
                        <input type="range" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-4 bg-green-900/30 rounded-lg appearance-none cursor-pointer -rotate-90 origin-center accent-green-500 border border-green-800" min="-50" max="50" value={visControls.offset} onChange={e => setVisControls(p => ({...p, offset: parseInt(e.target.value)}))} />
                    </div>
                 </div>
                 {/* RNG */}
                 <div className="flex flex-col items-center gap-2 h-32 justify-center" onWheel={(e) => setVisControls(p => ({ ...p, range: Math.max(10, Math.min(200, p.range + (e.deltaY > 0 ? -5 : 5))) }))}>
                    <span className="text-[9px] text-green-600 font-bold rotate-0">RNG</span>
                    <div className="relative h-24 w-4">
                         <input type="range" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-4 bg-green-900/30 rounded-lg appearance-none cursor-pointer -rotate-90 origin-center accent-green-500 border border-green-800" min="10" max="200" value={visControls.range} onChange={e => setVisControls(p => ({...p, range: parseInt(e.target.value)}))} />
                    </div>
                 </div>
                 {/* CON */}
                 <div className="flex flex-col items-center gap-2 h-32 justify-center" onWheel={(e) => setVisControls(p => ({ ...p, contrast: Math.max(0, Math.min(50, p.contrast + (e.deltaY > 0 ? -2 : 2))) }))}>
                    <span className="text-[9px] text-green-600 font-bold rotate-0">CON</span>
                     <div className="relative h-24 w-4">
                        <input type="range" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-4 bg-green-900/30 rounded-lg appearance-none cursor-pointer -rotate-90 origin-center accent-green-500 border border-green-800" min="0" max="50" value={visControls.contrast} onChange={e => setVisControls(p => ({...p, contrast: parseInt(e.target.value)}))} />
                    </div>
                 </div>
            </div>

            {showScanner && <Scanner onClose={() => setShowScanner(false)} onTune={updateFreq} step={sdrState.step} />}
            {showConfig && <ConfigWindow sdrState={sdrState} setSdrState={setSdrState} onClose={() => setShowConfig(false)} />}
            {plugins.map(plugin => (plugin.active && <PluginWindow key={plugin.id} plugin={plugin} onClose={() => togglePlugin(plugin.id)} style={{ marginLeft: `${(plugin.id % 5) * 5}px`, marginTop: `${(plugin.id % 5) * 5}px` }} />))}
            {showPluginsList && <PluginsList plugins={plugins} onTogglePlugin={togglePlugin} onClose={() => setShowPluginsList(false)} />}
            
            {contextMenu && (
                <div className="fixed bg-black border border-green-500 z-[100] w-40 py-1 shadow-[0_0_10px_rgba(0,0,0,0.8)]" style={{ top: contextMenu.y, left: contextMenu.x }}>
                    <div className="text-xs text-green-700 px-2 pb-1 border-b border-green-900 mb-1">QUICK BANDS</div>
                    {BANDS.map(band => (
                        <button key={band.name} className="w-full text-left px-3 py-1 text-xs text-green-400 hover:bg-green-900 hover:text-white" onClick={() => { handleBandSelect(band); closeContextMenu(); }}>
                            <span className="font-bold w-10 inline-block">{band.name}</span><span className="opacity-70">{formatFrequency(band.freq)}</span>
                        </button>
                    ))}
                </div>
            )}
        </main>
      </div>
    </div>
  );
};

export default App;
