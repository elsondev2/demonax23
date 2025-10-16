import { useState, useEffect, useRef } from 'react';
import { X, Loader2, CheckCircle, Info, AlertTriangle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import ImageUpload from './ImageUpload';
import { axiosInstance } from '../lib/axios';

const AnnouncementModal = ({ isOpen, onClose, onSuccess, initialData = null, isEditing = false }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'info',
    bannerImage: null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const modalRef = useRef(null);
  const titleInputRef = useRef(null);

  // Reset form when modal opens/closes or initialData changes
  useEffect(() => {
    if (isOpen) {
      setFormData(initialData || {
        title: '',
        content: '',
        priority: 'info',
        bannerImage: null
      });
      // Focus title input after modal animation
      setTimeout(() => titleInputRef.current?.focus(), 150);
    }
  }, [isOpen, initialData]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Please fill in both title and content');
      return;
    }

    setIsSubmitting(true);

    try {
      const url = isEditing
        ? `/api/notices/announcements/${initialData._id}`
        : '/api/notices/announcements';

      // Prepare form data for submission
      const submitData = new FormData();
      submitData.append('title', formData.title.trim());
      submitData.append('content', formData.content.trim());
      submitData.append('priority', formData.priority);

      // Add banner image if provided
      if (formData.bannerImage) {
        submitData.append('bannerImage', formData.bannerImage);
      }

      const response = await axiosInstance({
        method: isEditing ? 'PUT' : 'POST',
        url: url,
        data: submitData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const result = response.data;

      toast.success(`Announcement ${isEditing ? 'updated' : 'created'} successfully!`);

      // Reset form
      setFormData({
        title: '',
        content: '',
        priority: 'info',
        bannerImage: null
      });

      // Call success callback
      onSuccess?.(result);

      // Close modal after a brief delay
      setTimeout(() => {
        onClose?.();
      }, 1500);

    } catch (error) {
      console.error(`Failed to ${isEditing ? 'update' : 'create'} announcement:`, error);
      toast.error(error.message || `Failed to ${isEditing ? 'update' : 'create'} announcement`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => onClose?.()}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className="relative w-full max-w-3xl bg-base-100 rounded-2xl shadow-2xl max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-base-300 flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-base-content">
              {isEditing ? 'Edit Announcement' : 'Create New Announcement'}
            </h2>
            <p className="text-sm text-base-content/60 mt-1">
              {isEditing ? 'Update your announcement details' : 'Share important information with your users'}
            </p>
          </div>

          <button
            onClick={() => onClose?.()}
            disabled={isSubmitting}
            className="btn btn-sm btn-ghost btn-circle"
            title="Close modal (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="p-6 overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Title Field */}
            <div className="form-control">
              <label className="label pb-1">
                <span className="label-text font-semibold">
                  Announcement Title
                </span>
                <span className="label-text-alt text-error">*</span>
              </label>
              <input
                ref={titleInputRef}
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="input input-bordered focus:input-primary w-full"
                placeholder="e.g., System Maintenance Notice"
                disabled={isSubmitting}
                required
              />
            </div>

            {/* Content Field */}
            <div className="form-control">
              <label className="label pb-1">
                <span className="label-text font-semibold">
                  Message Content
                </span>
                <span className="label-text-alt text-error">*</span>
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => handleInputChange('content', e.target.value)}
                className="textarea textarea-bordered focus:textarea-primary resize-none w-full"
                placeholder="Write your announcement message here..."
                rows={4}
                disabled={isSubmitting}
                required
              />
            </div>

            {/* Priority Selection */}
            <div className="form-control">
              <label className="label pb-1">
                <span className="label-text font-semibold">
                  Priority Level
                </span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                <label className={`flex flex-col items-center gap-2 p-4 border-2 rounded-xl cursor-pointer transition-all hover:scale-105 ${formData.priority === 'info' ? 'border-primary bg-primary/10 shadow-lg' : 'border-base-300 hover:border-primary/50'
                  }`}>
                  <input
                    type="radio"
                    name="priority"
                    value="info"
                    checked={formData.priority === 'info'}
                    onChange={(e) => handleInputChange('priority', e.target.value)}
                    className="sr-only"
                    disabled={isSubmitting}
                  />
                  <Info className={`w-6 h-6 ${formData.priority === 'info' ? 'text-primary' : 'text-base-content/60'}`} />
                  <span className={`text-sm font-semibold ${formData.priority === 'info' ? 'text-primary' : 'text-base-content/70'}`}>
                    Info
                  </span>
                  <span className="text-xs text-base-content/50">General updates</span>
                </label>

                <label className={`flex flex-col items-center gap-2 p-4 border-2 rounded-xl cursor-pointer transition-all hover:scale-105 ${formData.priority === 'warning' ? 'border-warning bg-warning/10 shadow-lg' : 'border-base-300 hover:border-warning/50'
                  }`}>
                  <input
                    type="radio"
                    name="priority"
                    value="warning"
                    checked={formData.priority === 'warning'}
                    onChange={(e) => handleInputChange('priority', e.target.value)}
                    className="sr-only"
                    disabled={isSubmitting}
                  />
                  <AlertTriangle className={`w-6 h-6 ${formData.priority === 'warning' ? 'text-warning' : 'text-base-content/60'}`} />
                  <span className={`text-sm font-semibold ${formData.priority === 'warning' ? 'text-warning' : 'text-base-content/70'}`}>
                    Warning
                  </span>
                  <span className="text-xs text-base-content/50">Important notice</span>
                </label>

                <label className={`flex flex-col items-center gap-2 p-4 border-2 rounded-xl cursor-pointer transition-all hover:scale-105 ${formData.priority === 'alert' ? 'border-error bg-error/10 shadow-lg' : 'border-base-300 hover:border-error/50'
                  }`}>
                  <input
                    type="radio"
                    name="priority"
                    value="alert"
                    checked={formData.priority === 'alert'}
                    onChange={(e) => handleInputChange('priority', e.target.value)}
                    className="sr-only"
                    disabled={isSubmitting}
                  />
                  <AlertCircle className={`w-6 h-6 ${formData.priority === 'alert' ? 'text-error' : 'text-base-content/60'}`} />
                  <span className={`text-sm font-semibold ${formData.priority === 'alert' ? 'text-error' : 'text-base-content/70'}`}>
                    Alert
                  </span>
                  <span className="text-xs text-base-content/50">Urgent action</span>
                </label>
              </div>
            </div>

            {/* Banner Image Upload */}
            <div className="form-control">
              <label className="label pb-1">
                <span className="label-text font-semibold">
                  Banner Image
                </span>
                <span className="label-text-alt text-base-content/60">Optional</span>
              </label>
              <div className="bg-base-200 rounded-xl p-4">
                <ImageUpload
                  onImageSelect={(file) => handleInputChange('bannerImage', file)}
                  onImageRemove={() => handleInputChange('bannerImage', null)}
                  currentImage={formData.bannerImage}
                  maxSize={5 * 1024 * 1024}
                  acceptedTypes={['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']}
                />
                <p className="text-xs text-base-content/60 mt-2">
                  Recommended: 1200x400px, Max 5MB
                </p>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => onClose?.()}
                disabled={isSubmitting}
                className="btn btn-ghost flex-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary flex-1 gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{isEditing ? 'Updating...' : 'Creating...'}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>{isEditing ? 'Update Announcement' : 'Create Announcement'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementModal;
