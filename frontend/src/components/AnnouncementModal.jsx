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
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => onClose?.()}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          ref={modalRef}
          className="relative w-full max-w-2xl bg-base-100 rounded-2xl shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-base-300">
            <div>
              <h2 className="text-xl font-bold text-base-content">
                {isEditing ? 'Edit Announcement' : 'Create Announcement'}
              </h2>
            </div>

            <button
              onClick={() => onClose?.()}
              disabled={isSubmitting}
              className="btn btn-sm btn-ghost btn-circle"
              title="Close modal (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title Field */}
              <div className="form-control">
                <label className="label pb-2">
                  <span className="label-text font-semibold text-base">
                    Title
                  </span>
                </label>
                <input
                  ref={titleInputRef}
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="input input-bordered focus:input-primary w-full"
                  placeholder="Enter announcement title..."
                  disabled={isSubmitting}
                />
              </div>

              {/* Content Field */}
              <div className="form-control">
                <label className="label pb-2">
                  <span className="label-text font-semibold text-base">
                    Content
                  </span>
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => handleInputChange('content', e.target.value)}
                  className="textarea textarea-bordered focus:textarea-primary resize-none w-full"
                  placeholder="Write your announcement content..."
                  rows={6}
                  disabled={isSubmitting}
                />
              </div>

              {/* Priority Selection */}
              <div className="form-control">
                <label className="label pb-2">
                  <span className="label-text font-semibold text-base">
                    Priority Level
                  </span>
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <label className={`flex flex-col items-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-all hover:bg-base-200 ${
                    formData.priority === 'info' ? 'border-primary bg-primary/10' : 'border-base-300'
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
                    <Info className={`w-5 h-5 ${formData.priority === 'info' ? 'text-primary' : 'text-base-content/60'}`} />
                    <span className={`text-sm font-medium ${formData.priority === 'info' ? 'text-primary' : 'text-base-content/70'}`}>
                      Info
                    </span>
                  </label>

                  <label className={`flex flex-col items-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-all hover:bg-base-200 ${
                    formData.priority === 'warning' ? 'border-warning bg-warning/10' : 'border-base-300'
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
                    <AlertTriangle className={`w-5 h-5 ${formData.priority === 'warning' ? 'text-warning' : 'text-base-content/60'}`} />
                    <span className={`text-sm font-medium ${formData.priority === 'warning' ? 'text-warning' : 'text-base-content/70'}`}>
                      Warning
                    </span>
                  </label>

                  <label className={`flex flex-col items-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-all hover:bg-base-200 ${
                    formData.priority === 'alert' ? 'border-error bg-error/10' : 'border-base-300'
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
                    <AlertCircle className={`w-5 h-5 ${formData.priority === 'alert' ? 'text-error' : 'text-base-content/60'}`} />
                    <span className={`text-sm font-medium ${formData.priority === 'alert' ? 'text-error' : 'text-base-content/70'}`}>
                      Alert
                    </span>
                  </label>
                </div>
              </div>

              {/* Banner Image Upload */}
              <div className="form-control">
                <label className="label pb-2">
                  <span className="label-text font-semibold text-base">
                    Banner Image (Optional)
                  </span>
                </label>
                <ImageUpload
                  onImageSelect={(file) => handleInputChange('bannerImage', file)}
                  onImageRemove={() => handleInputChange('bannerImage', null)}
                  currentImage={formData.bannerImage}
                  maxSize={5 * 1024 * 1024} // 5MB for banner images
                  acceptedTypes={['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']}
                />
              </div>

              {/* Form Actions */}
              <div className="flex gap-4 pt-6 border-t border-base-300">
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
                      <span>{isEditing ? 'Update' : 'Create'}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => onClose?.()}
                  disabled={isSubmitting}
                  className="btn btn-ghost btn-outline"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementModal;