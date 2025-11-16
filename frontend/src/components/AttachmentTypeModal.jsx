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
      <div className="modal-box max-w-sm" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-bold text-lg mb-4">Choose file type</h3>
        
        <div className="grid grid-cols-2 gap-3">
          {attachmentTypes.map((item) => {
            const Icon = item.icon;
            const isViby = item.type === 'viby';
            return (
              <button
                key={item.type}
                onClick={() => onSelectType(item.type, item.accept)}
                className={`btn btn-outline flex-col h-24 gap-2 ${isViby ? 'col-span-2' : ''}`}
              >
                <Icon className={`w-8 h-8 ${item.color}`} />
                <span className="text-sm">{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="modal-action">
          <button className="btn btn-sm btn-ghost" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default AttachmentTypeModal;
