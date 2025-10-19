import IOSModal from './IOSModal';
import CaptionImageEditor from './CaptionImageEditor';
import { Sparkles } from 'lucide-react';

export default function CaptionImageModal({ isOpen, onClose, onGenerate, initialText = '' }) {
  return (
    <IOSModal isOpen={isOpen} onClose={onClose} className="max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-base-300 bg-gradient-to-r from-primary/5 to-secondary/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-base md:text-lg">Caption Image Creator</h3>
            <p className="text-xs text-base-content/60 hidden sm:block">Design beautiful text images in seconds</p>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <CaptionImageEditor
          initialText={initialText}
          onGenerate={onGenerate}
          onCancel={onClose}
        />
      </div>
    </IOSModal>
  );
}
