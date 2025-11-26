import { useState } from 'react';
import { usePianoStore } from '../../store/usePianoStore';
import VirtualPiano from './VirtualPiano';
import RecordingControls from './RecordingControls';
import { INSTRUMENTS } from '../../hooks/usePianoAudio';
import {
  ChevronLeft,
  ChevronRight,
  Volume2,
  Users,
  Radio as RadioIcon,
} from 'lucide-react';

const PracticeMode = () => {
  const {
    volume,
    setVolume,
    octaveShift,
    setOctaveShift,
    sustainActive,
    setSustainActive,
    instrument,
    setInstrument,
  } = usePianoStore();

  const [isLive, setIsLive] = useState(false);
  const [audienceCount] = useState(0);
  const [reverb, setReverb] = useState(20);
  const [pan, setPan] = useState(50);
  const [treble, setTreble] = useState(50);

  const currentInstrument = INSTRUMENTS[instrument] || INSTRUMENTS['grand-piano'];
  const categories = [...new Set(Object.values(INSTRUMENTS).map((i) => i.category))];

  // Knob component
  const Knob = ({ label, value, onChange, min = 0, max = 100 }) => {
    const rotation = ((value - min) / (max - min)) * 270 - 135;
    return (
      <div className="flex flex-col items-center gap-1.5">
        <div
          className="w-14 h-14 rounded-full bg-gradient-to-br from-base-300 to-base-200 border-2 border-base-300 relative cursor-pointer shadow-lg"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const y = e.clientY - rect.top;
            const newValue = Math.round(((rect.height - y) / rect.height) * (max - min) + min);
            onChange(Math.max(min, Math.min(max, newValue)));
          }}
        >
          <div
            className="absolute w-1.5 h-5 bg-primary rounded-full left-1/2 -translate-x-1/2 origin-bottom shadow-lg"
            style={{ transform: `translateX(-50%) rotate(${rotation}deg)`, bottom: '50%' }}
          />
          <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/5 to-transparent" />
        </div>
        <span className="text-[10px] opacity-60 font-medium">{label}</span>
        <span className="text-[9px] opacity-40">{value}</span>
      </div>
    );
  };

  const handleGoLive = () => {
    setIsLive(!isLive);
    // TODO: Implement streaming logic
  };

  return (
    <div className="h-full flex flex-col bg-base-100">
      {/* Instrument Panel */}
      <div className="flex items-center justify-between px-6 py-4 bg-base-200 border-b border-base-300">
        {/* Instrument Selector */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const keys = Object.keys(INSTRUMENTS);
              const currentIndex = keys.indexOf(instrument);
              const prevIndex = (currentIndex - 1 + keys.length) % keys.length;
              setInstrument(keys[prevIndex]);
            }}
            className="p-1.5 text-gray-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 px-4 py-2.5 bg-base-300 rounded-xl min-w-[200px] border border-base-300">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-focus rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-lg">🎹</span>
            </div>
            <div className="flex-1">
              <select
                value={instrument}
                onChange={(e) => setInstrument(e.target.value)}
                className="w-full bg-transparent text-base-content text-sm font-semibold outline-none cursor-pointer"
              >
                {categories.map((cat) => (
                  <optgroup key={cat} label={cat}>
                    {Object.entries(INSTRUMENTS)
                      .filter(([, config]) => config.category === cat)
                      .map(([key, config]) => (
                        <option key={key} value={key}>
                          {config.name}
                        </option>
                      ))}
                  </optgroup>
                ))}
              </select>
              <div className="text-[10px] opacity-60 font-medium">{currentInstrument.category}</div>
            </div>
          </div>

          <button
            onClick={() => {
              const keys = Object.keys(INSTRUMENTS);
              const currentIndex = keys.indexOf(instrument);
              const nextIndex = (currentIndex + 1) % keys.length;
              setInstrument(keys[nextIndex]);
            }}
            className="p-1.5 text-gray-400 hover:text-white transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Knobs */}
        <div className="hidden lg:flex items-center gap-8">
          <Knob label="Treble" value={treble} onChange={setTreble} />
          <Knob label="Reverb" value={reverb} onChange={setReverb} />
          <Knob label="Pan" value={pan} onChange={setPan} />
          <Knob label="Volume" value={Math.round(volume * 100)} onChange={(v) => setVolume(v / 100)} />
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-base-200 border-b border-base-300">
        {/* Left: Sustain & Octave */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSustainActive(!sustainActive)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              sustainActive
                ? 'bg-primary/20 text-primary border border-primary/50 shadow-lg shadow-primary/20'
                : 'bg-base-300 opacity-60 border border-base-300 hover:opacity-100'
            }`}
          >
            Sustain
          </button>

          <div className="flex items-center gap-2 px-3 py-2 bg-base-300 rounded-lg border border-base-300">
            <button
              onClick={() => setOctaveShift(octaveShift - 1)}
              disabled={octaveShift <= -2}
              className="p-1 opacity-60 hover:opacity-100 disabled:opacity-30 transition-opacity"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex flex-col items-center min-w-[60px]">
              <span className="text-[10px] opacity-60 font-medium">Octave</span>
              <span className="text-sm font-semibold">{octaveShift > 0 ? `+${octaveShift}` : octaveShift}</span>
            </div>
            <button
              onClick={() => setOctaveShift(octaveShift + 1)}
              disabled={octaveShift >= 2}
              className="p-1 opacity-60 hover:opacity-100 disabled:opacity-30 transition-opacity"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right: Go Live & Audience */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleGoLive}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              isLive
                ? 'bg-error/20 text-error border border-error/50 shadow-lg shadow-error/20 animate-pulse'
                : 'bg-primary/20 text-primary border border-primary/50 hover:bg-primary/30'
            }`}
          >
            <RadioIcon className="w-4 h-4" />
            {isLive ? 'Live' : 'Go Live'}
          </button>

          {isLive && (
            <div className="flex items-center gap-2 px-3 py-2 bg-base-300 rounded-lg border border-base-300">
              <Users className="w-4 h-4 opacity-60" />
              <span className="text-sm font-semibold">{audienceCount}</span>
            </div>
          )}
        </div>
      </div>

      {/* Piano */}
      <div className="flex-1 flex items-end justify-center px-6 pb-12 bg-gradient-to-b from-base-100 to-base-200 overflow-hidden relative">
        <VirtualPiano />
      </div>

      {/* Bottom Transport Bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-base-200 border-t border-base-300">
        {/* Volume */}
        <div className="flex items-center gap-3">
          <Volume2 className="w-4 h-4 opacity-60" />
          <input
            type="range"
            min="0"
            max="100"
            value={Math.round(volume * 100)}
            onChange={(e) => setVolume(parseInt(e.target.value) / 100)}
            className="range range-primary range-xs w-24"
          />
          <span className="text-xs opacity-60 font-medium w-8">{Math.round(volume * 100)}</span>
        </div>

        {/* Recording Controls */}
        <RecordingControls />

        {/* Info */}
        <div className="flex items-center gap-4 text-xs opacity-60 font-medium">
          <span>Key -</span>
          <span>120 bpm</span>
          <span>4/4</span>
        </div>
      </div>
    </div>
  );
};

export default PracticeMode;
