
import { BandPreset, DemodMode, PluginDefinition } from './types';

// Updated STEPS to match specific request: 0.5, 1, 2.5, 5, 10, 25, 50, 100, 200 Khz
export const STEPS = [500, 1000, 2500, 5000, 10000, 25000, 50000, 100000, 200000];

export const BANDS: BandPreset[] = [
  { name: 'OM', freq: 940000, mode: DemodMode.AM, step: 10000 },
  { name: '160m', freq: 1745000, mode: DemodMode.LSB, step: 500 },
  { name: '80m', freq: 3710000, mode: DemodMode.LSB, step: 500 },
  { name: '60m', freq: 5360000, mode: DemodMode.LSB, step: 500 },
  { name: '40m', freq: 7100000, mode: DemodMode.LSB, step: 500 },
  { name: '30m', freq: 10100000, mode: DemodMode.USB, step: 500 },
  { name: '20m', freq: 14200000, mode: DemodMode.USB, step: 500 },
  { name: '17m', freq: 18100000, mode: DemodMode.USB, step: 500 },
  { name: '15m', freq: 21200000, mode: DemodMode.USB, step: 500 },
  { name: '11m', freq: 27455000, mode: DemodMode.USB, step: 500 },
  { name: '10m', freq: 28460000, mode: DemodMode.USB, step: 500 },
  { name: '6m', freq: 50150000, mode: DemodMode.USB, step: 1000 },
  { name: 'AIR', freq: 119450000, mode: DemodMode.AM, step: 25000 },
  { name: 'VHF', freq: 145350000, mode: DemodMode.NFM, step: 10000 },
  { name: 'UHF', freq: 439400000, mode: DemodMode.NFM, step: 10000 },
  { name: 'ADSB', freq: 1090000000, mode: DemodMode.AM, step: 25000 },
  { name: 'SAT', freq: 1545000000, mode: DemodMode.USB, step: 1000 },
];

export const AVAILABLE_PLUGINS: PluginDefinition[] = [
  { id: 1, name: 'SimpleDMR Decoder v1.0', description: 'Sample Rate 10k', active: false },
  { id: 2, name: 'TETRA Decoder Pro', description: 'Bandwidth 25k', active: false },
  { id: 3, name: 'P25 Decoder Phase 1/2', description: 'BW 10k', active: false },
  { id: 4, name: 'ACARS Decoder v1.2', description: 'BW 6k', active: false },
  { id: 5, name: 'FT8 Decoder Pro', description: 'BW 3k USB + Msg View', active: false },
  { id: 6, name: 'FT4 Decoder', description: 'BW 3k USB + 7.5s Cycle', active: false },
  { id: 7, name: 'RTTY Decoder', description: '45 baud, BW 3k USB', active: false },
  { id: 8, name: 'PACTOR/NAVTEX Decoder', description: 'BW 3k USB', active: false },
  { id: 9, name: 'HFDL Global Monitor', description: 'BW 3k USB', active: false },
  { id: 10, name: 'ADSB Radar 1090', description: 'BW 2M', active: false },
  { id: 11, name: 'CW Decoder', description: 'Auto Speed, BW 500Hz', active: false },
];

export const SAMPLE_RATES = [
  { label: '512 KSPS', value: 512000 },
  { label: '1.024 MSPS', value: 1024000 },
  { label: '1.2 MSPS', value: 1200000 },
  { label: '1.5 MSPS', value: 1500000 },
  { label: '1.8 MSPS', value: 1800000 },
  { label: '2.0 MSPS', value: 2000000 },
  { label: '2.4 MSPS', value: 2400000 },
];

export const formatFrequency = (hz: number): string => {
  // Ensure we are working with a positive integer
  const val = Math.max(0, Math.round(hz));
  
  const mhz = Math.floor(val / 1000000);
  const khz = Math.floor((val % 1000000) / 1000);
  const rest = val % 1000;
  
  return `${mhz}.${khz.toString().padStart(3, '0')}.${rest.toString().padStart(3, '0')}`;
};
