import React, { useState } from "react";
import { XIcon, Volume2, VolumeX, Keyboard, Play, Phone } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useCallStore } from "../store/useCallStore";
import { playSound } from "../lib/soundUtils";
import IOSModal from "./IOSModal";

const KEYSTROKE_SOUNDS = [
  { id: "keystroke1", name: "Classic", description: "Traditional typewriter sound" },
  { id: "keystroke2", name: "Modern", description: "Soft mechanical keyboard" },
  { id: "keystroke3", name: "Retro", description: "Vintage computer keyboard" },
  { id: "keystroke4", name: "Minimal", description: "Subtle click sound" }
];

const RINGTONES = [
  { id: "Swing_Jazz", name: "Swing Jazz", description: "Smooth jazz melody (Default)" },
  { id: "guitar_2013", name: "Guitar 2013", description: "Acoustic guitar tune" },
  { id: "memories By DjCufool", name: "Memories", description: "Melodic ringtone by DjCufool" },
  { id: "minor2go-guitar-quality-gold-sitting-on-the-moon", name: "Sitting on the Moon", description: "Quality gold guitar melody" }
];

function SoundSettingsModal({ isOpen, onClose }) {
  const { 
    isSoundEnabled, 
    isKeystrokeSoundEnabled, 
    selectedKeystrokeSound, 
    toggleSound, 
    toggleKeystrokeSound, 
    setKeystrokeSound 
  } = useChatStore();
  
  const { selectedRingtone, setRingtone } = useCallStore();
  
  const [previewingSound, setPreviewingSound] = useState(null);
  const [previewingRingtone, setPreviewingRingtone] = useState(null);

  const handlePreviewSound = async (soundId) => {
    setPreviewingSound(soundId);
    try {
      await playSound(`/sounds/${soundId}.mp3`);
    } catch (error) {
      console.warn('Failed to preview sound:', error);
    } finally {
      setTimeout(() => setPreviewingSound(null), 500);
    }
  };

  const handlePreviewNotification = async () => {
    setPreviewingSound('notification');
    try {
      await playSound('/sounds/notification.mp3');
    } catch (error) {
      console.warn('Failed to preview notification sound:', error);
    } finally {
      setTimeout(() => setPreviewingSound(null), 500);
    }
  };

  const handlePreviewRingtone = async (ringtoneId) => {
    // Stop any currently playing ringtone
    if (previewingRingtone) {
      const audio = document.getElementById('ringtone-preview');
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    }

    setPreviewingRingtone(ringtoneId);
    try {
      const audio = new Audio(`/rigntone/${ringtoneId}.mp3`);
      audio.id = 'ringtone-preview';
      audio.volume = 0.5;
      await audio.play();
      
      // Stop after 5 seconds
      setTimeout(() => {
        audio.pause();
        audio.currentTime = 0;
        setPreviewingRingtone(null);
      }, 5000);
    } catch (error) {
      console.warn('Failed to preview ringtone:', error);
      setPreviewingRingtone(null);
    }
  };

  const modalContent = (
    <>
      <div className="flex items-center justify-between p-4 border-b border-base-300">
        <div className="flex items-center gap-2">
          <Volume2 className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-base-content">Sound Settings</h3>
        </div>
        <button className="btn btn-ghost btn-sm btn-circle" onClick={onClose} aria-label="Close">
          <XIcon className="h-5 w-5" />
        </button>
      </div>
      
      <div className="p-4 overflow-y-auto flex-1 space-y-6">
        {/* Main Sound Toggle */}
        <div className="card bg-base-200/50 shadow-sm">
          <div className="card-body p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isSoundEnabled ? (
                  <Volume2 className="w-5 h-5 text-success" />
                ) : (
                  <VolumeX className="w-5 h-5 text-base-content/50" />
                )}
                <div>
                  <h4 className="font-medium text-base-content">Sound Effects</h4>
                  <p className="text-sm text-base-content/60">Enable notification sounds</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={isSoundEnabled}
                onChange={toggleSound}
                className="toggle toggle-primary"
              />
            </div>
            
            {isSoundEnabled && (
              <div className="mt-3 pt-3 border-t border-base-300">
                <button
                  onClick={handlePreviewNotification}
                  className={`btn btn-sm btn-outline gap-2 ${previewingSound === 'notification' ? 'btn-primary' : ''}`}
                  disabled={previewingSound === 'notification'}
                >
                  <Play className="w-4 h-4" />
                  {previewingSound === 'notification' ? 'Playing...' : 'Preview Notification'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Call Ringtone Settings */}
        {isSoundEnabled && (
          <div className="card bg-base-200/50 shadow-sm">
            <div className="card-body p-4">
              <div className="flex items-center gap-3 mb-4">
                <Phone className="w-5 h-5 text-primary" />
                <div>
                  <h4 className="font-medium text-base-content">Call Ringtone</h4>
                  <p className="text-sm text-base-content/60">Choose your incoming call ringtone</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-sm font-medium text-base-content/80 mb-2">Select Ringtone:</div>
                {RINGTONES.map((ringtone) => (
                  <div
                    key={ringtone.id}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedRingtone === ringtone.id
                        ? 'border-primary bg-primary/10'
                        : 'border-base-300 hover:border-primary/50 hover:bg-base-300/50'
                    }`}
                    onClick={() => setRingtone(ringtone.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-base-content">{ringtone.name}</div>
                        <div className="text-sm text-base-content/60">{ringtone.description}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreviewRingtone(ringtone.id);
                          }}
                          className={`btn btn-sm btn-circle btn-ghost ${
                            previewingRingtone === ringtone.id ? 'btn-primary' : ''
                          }`}
                          disabled={previewingRingtone === ringtone.id}
                        >
                          <Play className="w-3 h-3" />
                        </button>
                        <input
                          type="radio"
                          name="ringtone"
                          checked={selectedRingtone === ringtone.id}
                          onChange={() => setRingtone(ringtone.id)}
                          className="radio radio-primary"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Keystroke Sound Settings */}
        {isSoundEnabled && (
          <div className="card bg-base-200/50 shadow-sm">
            <div className="card-body p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Keyboard className="w-5 h-5 text-primary" />
                  <div>
                    <h4 className="font-medium text-base-content">Keystroke Sounds</h4>
                    <p className="text-sm text-base-content/60">Play sounds while typing</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isKeystrokeSoundEnabled}
                  onChange={toggleKeystrokeSound}
                  className="toggle toggle-primary"
                />
              </div>

              {isKeystrokeSoundEnabled && (
                <div className="space-y-3">
                  <div className="text-sm font-medium text-base-content/80 mb-2">Choose Keystroke Sound:</div>
                  {KEYSTROKE_SOUNDS.map((sound) => (
                    <div
                      key={sound.id}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedKeystrokeSound === sound.id
                          ? 'border-primary bg-primary/10'
                          : 'border-base-300 hover:border-primary/50 hover:bg-base-300/50'
                      }`}
                      onClick={() => setKeystrokeSound(sound.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-base-content">{sound.name}</div>
                          <div className="text-sm text-base-content/60">{sound.description}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePreviewSound(sound.id);
                            }}
                            className={`btn btn-sm btn-circle btn-ghost ${
                              previewingSound === sound.id ? 'btn-primary' : ''
                            }`}
                            disabled={previewingSound === sound.id}
                          >
                            <Play className="w-3 h-3" />
                          </button>
                          <input
                            type="radio"
                            name="keystrokeSound"
                            checked={selectedKeystrokeSound === sound.id}
                            onChange={() => setKeystrokeSound(sound.id)}
                            className="radio radio-primary"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sound Tips */}
        <div className="alert alert-info">
          <div className="flex items-start gap-2">
            <Volume2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <div className="font-medium mb-1">Sound Tips:</div>
              <ul className="list-disc list-inside space-y-1 text-xs opacity-80">
                <li>Ringtones play when you receive an incoming call</li>
                <li>Notification sounds play for new messages from other users</li>
                <li>Keystroke sounds only play when typing in message input</li>
                <li>Sounds respect your browser's audio settings</li>
                <li>You can preview sounds before selecting them</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <IOSModal isOpen={isOpen} onClose={onClose} className="max-w-lg mx-auto">
      <div className="flex flex-col h-full">
        {modalContent}
      </div>
    </IOSModal>
  );
}

export default SoundSettingsModal;