import { useState } from 'react';
import { usePianoStore } from '../../store/usePianoStore';
import { INSTRUMENTS } from '../../hooks/usePianoAudio';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

const InstrumentSelector = ({ compact = false }) => {
  const instrument = usePianoStore(state => state.instrument);
  const setInstrument = usePianoStore(state => state.setInstrument);
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Group instruments by category
  const categories = ['all', ...new Set(Object.values(INSTRUMENTS).map(i => i.category))];
  
  const filteredInstruments = Object.entries(INSTRUMENTS).filter(([key, config]) => 
    selectedCategory === 'all' || config.category === selectedCategory
  );

  if (compact) {
    return (
      <div className="dropdown dropdown-top dropdown-end">
        <label tabIndex={0} className="btn btn-sm btn-ghost gap-1.5 h-8 min-h-0 px-2 text-gray-300">
          <span className="text-xs">{INSTRUMENTS[instrument]?.name || 'Piano'}</span>
          <ChevronRight className="w-3 h-3 opacity-50 rotate-90" />
        </label>
        <div tabIndex={0} className="dropdown-content z-[1] bg-[#1a1a1a] rounded-lg shadow-xl border border-[#2a2a2a] w-64 mb-2">
          <div className="p-2 max-h-[300px] overflow-y-auto">
            {Object.entries(INSTRUMENTS).map(([key, config]) => (
              <button
                key={key}
                onClick={() => setInstrument(key)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-all
                  ${instrument === key 
                    ? 'bg-orange-500/20 text-orange-400' 
                    : 'text-gray-300 hover:bg-[#2a2a2a]'}`}
              >
                <div>
                  <div className="font-medium">{config.name}</div>
                  <div className="text-[10px] text-gray-500">{config.category}</div>
                </div>
                {instrument === key && <Check className="w-4 h-4" />}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Category tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all
              ${selectedCategory === cat 
                ? 'bg-orange-500 text-white' 
                : 'bg-[#2a2a2a] text-gray-400 hover:text-white'}`}
          >
            {cat === 'all' ? 'All' : cat}
          </button>
        ))}
      </div>

      {/* Instrument grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
        {filteredInstruments.map(([key, config]) => {
          const isSelected = instrument === key;
          
          return (
            <button
              key={key}
              onClick={() => setInstrument(key)}
              className={`
                p-2 rounded-lg text-center transition-all border
                ${isSelected 
                  ? 'bg-orange-500/20 border-orange-500/50 text-orange-400' 
                  : 'bg-[#0d0d0d] border-[#2a2a2a] text-gray-300 hover:border-gray-600'}
              `}
            >
              <div className="text-xs font-medium truncate">{config.name}</div>
              <div className="text-[9px] text-gray-500 mt-0.5">{config.category}</div>
            </button>
          );
        })}
      </div>

      {/* Current instrument info */}
      <div className="flex items-center justify-between px-2 py-1.5 bg-[#0d0d0d] rounded-lg">
        <div className="flex items-center gap-2">
          <button className="p-1 text-gray-400 hover:text-white">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="text-sm font-medium text-white">{INSTRUMENTS[instrument]?.name}</div>
            <div className="text-[10px] text-gray-500">{INSTRUMENTS[instrument]?.category}</div>
          </div>
          <button className="p-1 text-gray-400 hover:text-white">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstrumentSelector;
