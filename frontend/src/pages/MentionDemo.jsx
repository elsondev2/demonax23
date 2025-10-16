import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MentionInput from '../components/mentions/MentionInput';
import toast from 'react-hot-toast';

const MentionDemo = () => {
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [mentions, setMentions] = useState([]);
  const [multilineText, setMultilineText] = useState('');
  const [multilineMentions, setMultilineMentions] = useState([]);

  const handleMention = (mention) => {
    setMentions([...mentions, mention]);
    toast.success(`Mentioned: ${mention.name}`);
    console.log('Mention added:', mention);
  };

  const handleMultilineMention = (mention) => {
    setMultilineMentions([...multilineMentions, mention]);
    toast.success(`Mentioned: ${mention.name}`);
    console.log('Mention added:', mention);
  };

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
            <h1 className="text-2xl font-bold">Mention System Demo</h1>
            <p className="text-sm text-base-content/60">Test the @ mention functionality</p>
          </div>
        </div>

        {/* Instructions */}
        <div className="card bg-base-100 shadow-lg mb-6">
          <div className="card-body">
            <h2 className="card-title text-lg">How to Use</h2>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>Type <kbd className="kbd kbd-sm">@</kbd> to mention a user</li>
              <li>Type <kbd className="kbd kbd-sm">#</kbd> to mention a group</li>
              <li>Use <kbd className="kbd kbd-sm">↑</kbd> <kbd className="kbd kbd-sm">↓</kbd> to navigate suggestions</li>
              <li>Press <kbd className="kbd kbd-sm">Enter</kbd> to select</li>
              <li>Press <kbd className="kbd kbd-sm">Esc</kbd> to close dropdown</li>
            </ul>
          </div>
        </div>

        {/* Single Line Input */}
        <div className="card bg-base-100 shadow-lg mb-6">
          <div className="card-body">
            <h2 className="card-title text-lg mb-4">Single Line Input</h2>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text">Type a message with mentions</span>
              </label>
              <MentionInput
                value={text}
                onChange={setText}
                onMention={handleMention}
                placeholder="Type @ to mention someone..."
                className="input input-bordered w-full"
                maxLength={280}
              />
            </div>

            {/* Preview */}
            {text && (
              <div className="mt-4">
                <div className="text-sm font-semibold mb-2">Preview:</div>
                <div className="bg-base-200 p-3 rounded-lg">
                  <p className="text-sm">{text}</p>
                </div>
              </div>
            )}

            {/* Mentions List */}
            {mentions.length > 0 && (
              <div className="mt-4">
                <div className="text-sm font-semibold mb-2">Mentions ({mentions.length}):</div>
                <div className="flex flex-wrap gap-2">
                  {mentions.map((mention, idx) => (
                    <div key={idx} className="badge badge-primary gap-2">
                      {mention.type === 'user' ? '@' : '#'}
                      {mention.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Multiline Input */}
        <div className="card bg-base-100 shadow-lg mb-6">
          <div className="card-body">
            <h2 className="card-title text-lg mb-4">Multiline Input (Textarea)</h2>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text">Write a longer message</span>
              </label>
              <MentionInput
                value={multilineText}
                onChange={setMultilineText}
                onMention={handleMultilineMention}
                placeholder="Type @ to mention someone or # to mention a group..."
                className="textarea textarea-bordered w-full"
                maxLength={2000}
                multiline={true}
                rows={5}
              />
            </div>

            {/* Preview */}
            {multilineText && (
              <div className="mt-4">
                <div className="text-sm font-semibold mb-2">Preview:</div>
                <div className="bg-base-200 p-3 rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{multilineText}</p>
                </div>
              </div>
            )}

            {/* Mentions List */}
            {multilineMentions.length > 0 && (
              <div className="mt-4">
                <div className="text-sm font-semibold mb-2">Mentions ({multilineMentions.length}):</div>
                <div className="flex flex-wrap gap-2">
                  {multilineMentions.map((mention, idx) => (
                    <div key={idx} className="badge badge-primary gap-2">
                      {mention.type === 'user' ? '@' : '#'}
                      {mention.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h2 className="card-title text-lg mb-4">Statistics</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="stat bg-base-200 rounded-lg p-3">
                <div className="stat-title text-xs">Single Line</div>
                <div className="stat-value text-lg">{text.length}</div>
                <div className="stat-desc">characters</div>
              </div>
              
              <div className="stat bg-base-200 rounded-lg p-3">
                <div className="stat-title text-xs">Multiline</div>
                <div className="stat-value text-lg">{multilineText.length}</div>
                <div className="stat-desc">characters</div>
              </div>
              
              <div className="stat bg-base-200 rounded-lg p-3">
                <div className="stat-title text-xs">Total Mentions</div>
                <div className="stat-value text-lg">{mentions.length + multilineMentions.length}</div>
                <div className="stat-desc">added</div>
              </div>
              
              <div className="stat bg-base-200 rounded-lg p-3">
                <div className="stat-title text-xs">User Mentions</div>
                <div className="stat-value text-lg">
                  {[...mentions, ...multilineMentions].filter(m => m.type === 'user').length}
                </div>
                <div className="stat-desc">users</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MentionDemo;
