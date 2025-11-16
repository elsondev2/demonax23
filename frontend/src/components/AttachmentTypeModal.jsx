import { Image, FileText, Video, Music, Sparkles } from "lucide-react";

const AttachmentTypeModal = ({ isOpen, onClose, onSelectType }) => {
  if (!isOpen) return null;

  const attachmentTypes = [
    { 
      type: 'image', 
      label: 'Image', 
      icon: Image, 
      accept: 'image/*',
      color: 'text-blue-500'
    },
    { 
      type: 'document', 
      label: 'Document', 
      icon: FileText, 
      accept: '.pdf,.doc,.docx,.txt,.xlsx,.xls,.ppt,.pptx',
      color: 'text-orange-500'
    },
    { 
      type: 'video', 
      label: 'Video', 
      icon: Video, 
      accept: 'video/*',
      color: 'text-purple-500'
    },
    { 
      type: 'audio', 
      label: 'Audio', 
      icon: Music, 
      accept: 'audio/*',
      color: 'text-green-500'
    },
    { 
      type: 'viby', 
      label: "I'm feeling viby", 
      icon: Sparkles, 
      accept: 'image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.xlsx,.xls,.ppt,.pptx',
      color: 'text-pink-500'
    }
  ];

  return (
    <div className="modal modal-open" onClick={onClose}>
      <div className="modal-box max-w-md bg-base-100 border border-base-300 shadow-xl rounded-xl p-0" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-5 py-4 border-b border-base-300">
          <h3 className="text-lg font-bold text-base-content">Choose Attachment Type</h3>
          <p className="text-sm text-base-content/60 mt-1">Select the type of file you want to share</p>
        </div>
        
        {/* Content */}
        <div className="p-5">
          <div className="grid grid-cols-2 gap-3">
            {attachmentTypes.map((item) => {
              const Icon = item.icon;
              const isViby = item.type === 'viby';
              return (
                <button
                  key={item.type}
                  onClick={() => onSelectType(item.type, item.accept)}
                  className={`group relative flex flex-col items-center justify-center gap-3 p-4 rounded-xl border-2 border-base-300 hover:border-primary hover:bg-primary/5 transition-all duration-200 hover:shadow-md ${
                    isViby ? 'col-span-2 bg-gradient-to-br from-primary/5 to-secondary/5' : 'bg-base-100'
                  }`}
                  style={{ minHeight: '100px' }}
                >
                  <div className={`p-3 rounded-full ${isViby ? 'bg-gradient-to-br from-primary/20 to-secondary/20' : 'bg-base-200 group-hover:bg-primary/10'} transition-colors`}>
                    <Icon className={`w-6 h-6 ${item.color}`} />
                  </div>
                  <span className="text-sm font-medium text-base-content">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Cancel Button */}
          <button className="btn btn-ghost w-full mt-4 hover:bg-base-200" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
      <div className="modal-backdrop bg-black/50 backdrop-blur-sm"></div>
    </div>
  );
};

export default AttachmentTypeModal;
