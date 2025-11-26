import { usePianoStore } from '../../store/usePianoStore';
import { Usb, RefreshCw, Check, X } from 'lucide-react';

const MIDIDeviceSelector = ({ compact = false }) => {
  const midiDevices = usePianoStore(state => state.midiDevices);
  const selectedMidiDevice = usePianoStore(state => state.selectedMidiDevice);
  const midiConnected = usePianoStore(state => state.midiConnected);
  
  const disconnectDevice = () => {
    usePianoStore.getState().setSelectedMidiDevice(null);
    usePianoStore.getState().setMidiConnected(false);
  };
  
  const refreshDevices = () => {
    if (navigator.requestMIDIAccess) {
      navigator.requestMIDIAccess({ sysex: false }).then(midiAccess => {
        const devices = [];
        midiAccess.inputs.forEach((input) => {
          devices.push({
            id: input.id,
            name: input.name,
            manufacturer: input.manufacturer,
            state: input.state
          });
        });
        usePianoStore.getState().setMidiDevices(devices);
      }).catch(() => {
        console.log('MIDI not available');
      });
    }
  };

  const connectToDevice = (deviceId) => {
    if (navigator.requestMIDIAccess) {
      navigator.requestMIDIAccess({ sysex: false }).then(midiAccess => {
        const input = midiAccess.inputs.get(deviceId);
        if (input) {
          usePianoStore.getState().setSelectedMidiDevice({
            id: input.id,
            name: input.name,
            manufacturer: input.manufacturer
          });
          usePianoStore.getState().setMidiConnected(true);
        }
      }).catch(() => {
        console.log('MIDI not available');
      });
    }
  };

  if (compact) {
    return (
      <div className="dropdown dropdown-end">
        <label tabIndex={0} className="btn btn-sm btn-ghost gap-2">
          <Usb className={`w-4 h-4 ${midiConnected ? 'text-success' : 'text-base-content/50'}`} />
          <span className="hidden sm:inline">
            {midiConnected ? 'MIDI' : 'No MIDI'}
          </span>
          {midiConnected && <span className="badge badge-success badge-xs"></span>}
        </label>
        <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow-lg bg-base-200 rounded-box w-64">
          <li className="menu-title flex flex-row items-center justify-between">
            <span>MIDI Devices</span>
            <button 
              onClick={refreshDevices}
              className="btn btn-ghost btn-xs btn-circle"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </li>
          
          {midiDevices.length === 0 ? (
            <li className="disabled">
              <span className="text-base-content/50 text-sm">
                No MIDI devices found
              </span>
            </li>
          ) : (
            midiDevices.map((device) => (
              <li key={device.id}>
                <button
                  onClick={() => {
                    if (selectedMidiDevice?.id === device.id) {
                      disconnectDevice();
                    } else {
                      connectToDevice(device.id);
                    }
                  }}
                  className={selectedMidiDevice?.id === device.id ? 'active' : ''}
                >
                  <Usb className="w-4 h-4" />
                  <div className="flex-1 text-left">
                    <div className="text-sm">{device.name}</div>
                    {device.manufacturer && (
                      <div className="text-xs text-base-content/50">
                        {device.manufacturer}
                      </div>
                    )}
                  </div>
                  {selectedMidiDevice?.id === device.id && (
                    <Check className="w-4 h-4 text-success" />
                  )}
                </button>
              </li>
            ))
          )}
          
          {midiConnected && (
            <li>
              <button onClick={disconnectDevice} className="text-error">
                <X className="w-4 h-4" />
                Disconnect
              </button>
            </li>
          )}
        </ul>
      </div>
    );
  }

  return (
    <div className="card bg-base-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold flex items-center gap-2">
          <Usb className="w-4 h-4" />
          MIDI Devices
        </h3>
        <button 
          onClick={refreshDevices}
          className="btn btn-ghost btn-xs btn-circle"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {midiDevices.length === 0 ? (
        <div className="text-center py-4 text-base-content/50">
          <Usb className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No MIDI devices found</p>
          <p className="text-xs mt-1">Connect a MIDI keyboard to get started</p>
        </div>
      ) : (
        <div className="space-y-2">
          {midiDevices.map((device) => {
            const isSelected = selectedMidiDevice?.id === device.id;
            
            return (
              <button
                key={device.id}
                onClick={() => {
                  if (isSelected) {
                    disconnectDevice();
                  } else {
                    connectToDevice(device.id);
                  }
                }}
                className={`
                  w-full p-3 rounded-lg flex items-center gap-3 transition-all
                  ${isSelected 
                    ? 'bg-success/20 border-2 border-success' 
                    : 'bg-base-300 hover:bg-base-300/80 border-2 border-transparent'}
                `}
              >
                <Usb className={`w-5 h-5 ${isSelected ? 'text-success' : ''}`} />
                <div className="flex-1 text-left">
                  <div className="font-medium text-sm">{device.name}</div>
                  {device.manufacturer && (
                    <div className="text-xs text-base-content/50">
                      {device.manufacturer}
                    </div>
                  )}
                </div>
                {isSelected && (
                  <span className="badge badge-success badge-sm">Connected</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {midiConnected && (
        <button 
          onClick={disconnectDevice}
          className="btn btn-error btn-sm w-full mt-3"
        >
          <X className="w-4 h-4" />
          Disconnect
        </button>
      )}
    </div>
  );
};

export default MIDIDeviceSelector;
