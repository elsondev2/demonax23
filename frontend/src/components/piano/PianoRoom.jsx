import { useState, useEffect } from 'react';
import { usePianoStore } from '../../store/usePianoStore';
import ResizableSidebar from '../ResizableSidebar';
import ChatsView from '../ChatsView';
import PracticeMode from './PracticeMode';
import PianoHall from './PianoHall';
import ProfileStats from './ProfileStats';
import { Piano, Radio, BarChart3 } from 'lucide-react';

const PianoRoom = () => {
  const [activeTab, setActiveTab] = useState('practice');
  const { fetchProfile, loadLocalRecordings } = usePianoStore();

  useEffect(() => {
    fetchProfile();
    loadLocalRecordings();
  }, [fetchProfile, loadLocalRecordings]);

  const tabs = [
    { id: 'practice', label: 'Practice', icon: Piano },
    { id: 'hall', label: 'Piano Hall', icon: Radio },
    { id: 'stats', label: 'Stats', icon: BarChart3 },
  ];

  return (
    <>
      {/* Desktop Layout */}
      <div className="hidden md:flex w-full h-full overflow-hidden bg-base-100">
        <ResizableSidebar>
          <ChatsView />
        </ResizableSidebar>

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="flex items-center gap-1 px-4 py-3 bg-base-200 border-b border-base-300">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-primary/20 text-primary border border-primary/50'
                      : 'opacity-60 hover:opacity-100 hover:bg-base-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'practice' && <PracticeMode />}
            {activeTab === 'hall' && <PianoHall />}
            {activeTab === 'stats' && <ProfileStats />}
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden w-full h-full flex flex-col overflow-hidden bg-base-100">
        {/* Tabs */}
        <div className="flex items-center gap-1 px-2 py-2 bg-base-200 border-b border-base-300">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-lg text-xs font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-primary/20 text-primary'
                    : 'opacity-60'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'practice' && <PracticeMode />}
          {activeTab === 'hall' && <PianoHall />}
          {activeTab === 'stats' && <ProfileStats />}
        </div>
      </div>
    </>
  );
};

export default PianoRoom;
