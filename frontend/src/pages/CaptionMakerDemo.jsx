import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CaptionMaker from '../components/caption/CaptionMaker';
import toast from 'react-hot-toast';

const CaptionMakerDemo = () => {
  const navigate = useNavigate();
  const [savedCaption, setSavedCaption] = useState(null);
  const [selectedContext, setSelectedContext] = useState('pulse');
  const [selectedMode, setSelectedMode] = useState('quick');

  const handleSave = (captionData) => {
    setSavedCaption(captionData);
    toast.success('Caption saved!');
    console.log('Caption Data:', captionData);
  };

  const handleCancel = () => {
    toast.info('Caption cancelled');
  };

  const contexts = [
    { id: 'pulse', label: 'Pulse', maxLength: 280 },
    { id: 'post', label: 'Post', maxLength: 5000 },
    { id: 'track', label: 'Track', maxLength: 1000 },
    { id: 'message', label: 'Message', maxLength: 2000 },
    { id: 'status', label: 'Status', maxLength: 150 }
  ];

  return (
    <div className="min-h-screen bg-base-300 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="btn btn-circle btn-ghost"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Caption Maker Demo</h1>
            <p className="text-sm text-base-content/60">Test the caption creation system</p>
          </div>
        </div>

        {/* Controls */}
        <div className="card bg-base-100 shadow-lg mb-6">
          <div className="card-body">
            <h2 className="card-title text-lg mb-4">Settings</h2>
            
            {/* Mode Selection */}
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text font-semibold">Mode</span>
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedMode('quick')}
                  className={`btn btn-sm ${selectedMode === 'quick' ? 'btn-primary' : 'btn-ghost'}`}
                >
                  Quick
                </button>
                <button
                  onClick={() => setSelectedMode('advanced')}
                  className={`btn btn-sm ${selectedMode === 'advanced' ? 'btn-primary' : 'btn-ghost'}`}
                >
                  Advanced
                </button>
              </div>
            </div>

            {/* Context Selection */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Context</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {contexts.map((ctx) => (
                  <button
                    key={ctx.id}
                    onClick={() => setSelectedContext(ctx.id)}
                    className={`btn btn-sm ${selectedContext === ctx.id ? 'btn-primary' : 'btn-ghost'}`}
                  >
                    {ctx.label}
                    <span className="badge badge-sm ml-2">{ctx.maxLength}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Caption Maker */}
        <div className="card bg-base-100 shadow-lg mb-6">
          <div className="card-body">
            <h2 className="card-title text-lg mb-4">Create Caption</h2>
            <CaptionMaker
              mode={selectedMode}
              context={selectedContext}
              onSave={handleSave}
              onCancel={handleCancel}
              placeholder={`Write your ${selectedContext} caption...`}
              allowedFormats={['bold', 'italic', 'emoji', 'mention', 'hashtag']}
            />
          </div>
        </div>

        {/* Saved Caption Preview */}
        {savedCaption && (
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <h2 className="card-title text-lg mb-4">Saved Caption</h2>
              
              <div className="bg-base-200 p-4 rounded-lg mb-4">
                <div className="whitespace-pre-wrap break-words">
                  {savedCaption.text}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-base-content/60">Length</div>
                  <div className="font-semibold">{savedCaption.length} chars</div>
                </div>
                <div>
                  <div className="text-base-content/60">Context</div>
                  <div className="font-semibold capitalize">{savedCaption.context}</div>
                </div>
                <div>
                  <div className="text-base-content/60">Formatting</div>
                  <div className="font-semibold">{savedCaption.formatting.length} items</div>
                </div>
                <div>
                  <div className="text-base-content/60">Words</div>
                  <div className="font-semibold">{savedCaption.text.split(/\s+/).length}</div>
                </div>
              </div>

              {savedCaption.formatting.length > 0 && (
                <div className="mt-4">
                  <div className="text-sm font-semibold mb-2">Formatting Applied:</div>
                  <div className="flex flex-wrap gap-2">
                    {savedCaption.formatting.map((fmt, idx) => (
                      <div key={idx} className="badge badge-primary badge-sm">
                        {fmt.type}: "{fmt.value}"
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4">
                <button
                  onClick={() => setSavedCaption(null)}
                  className="btn btn-sm btn-ghost"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CaptionMakerDemo;
