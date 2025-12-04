
export enum DemodMode {
  NFM = 'NFM',
  WFM = 'WFM',
  AM = 'AM',
  LSB = 'LSB',
  USB = 'USB',
  CW = 'CW'
}

export interface BandPreset {
  name: string;
  freq: number; // in Hz
  mode: DemodMode;
  step: number; // in Hz
}

export interface PluginDefinition {
  id: number;
  name: string;
  description: string;
  active: boolean;
}

export interface SDRState {
  isPlaying: boolean;
  frequency: number; // in Hz
  mode: DemodMode;
  bandwidth: number; // in Hz
  squelch: number;
  gain: number;
  step: number; // in Hz
  sampleRate: number;
  samplingMode: 'Quadrature' | 'Direct Q';
  tunerAGC: boolean;
  ppm: number;
  volume: number;
  nrEnabled: boolean;
  // Connectivity
  source: 'RTL-SDR' | 'TCP';
  tcpIp: string;
  tcpPort: number;
}
