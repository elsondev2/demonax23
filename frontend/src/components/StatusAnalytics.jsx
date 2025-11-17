import { useState } from 'react';
import { X, Eye, Heart, MessageCircle } from 'lucide-react';
import Avatar from './Avatar';

/**
 * Status Analytics Modal
 * Shows who viewed, liked, and commented on status
 * Only visible to status owner
 */
const StatusAnalytics = ({ status, onClose }) => {
  const [activeTab, setActiveTab] = useState('views');

  // Mock data - replace with actual API calls
  const views = status.views || [];
  const likes = status.likes || [];
  const comments = status.comments || [];

  const tabs = [
    { id: 'views', label: 'Views', count: views.length, icon: Eye },
    { id: 'likes', label: 'Likes', count: likes.length, icon: Heart },
    { id: 'comments', label: 'Comments', count: comments.length, icon: MessageCircle },
  ];

  const renderList = () => {
    let items = [];
    if (activeTab === 'views') items = views;
    else if (activeTab === 'likes') items = likes;
    else if (activeTab === 'comments') items = comments;

    if (items.length === 0) {
      return (
        <div className="text-center py-8 text-base-content/60">
          <p>No {activeTab} yet</p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {items.map((item, idx) => {
          const user = item.userId || item.user;
          const timestamp = item.viewedAt || item.likedAt || item.createdAt;
          
          return (
            <div key={idx} className="flex items-center gap-3 p-3 hover:bg-base-200 rounded-lg">
              <Avatar
                src={user?.profilePic}
                name={user?.fullName}
                alt={user?.fullName || 'User'}
                size="w-10 h-10"
                textSize="text-sm"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{user?.fullName || 'Unknown'}</p>
                {activeTab === 'comments' && item.text && (
                  <p className="text-sm text-base-content/70 truncate">{item.text}</p>
                )}
                {timestamp && (
                  <p className="text-xs text-base-content/50">
                    {new Date(timestamp).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <dialog className="modal modal-open" style={{ zIndex: 10001 }}>
      <div className="modal-box max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">Status Analytics</h3>
          <button
            onClick={onClose}
            className="btn btn-circle btn-sm btn-ghost"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="tabs tabs-boxed mb-4">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`tab gap-2 ${activeTab === tab.id ? 'tab-active' : ''}`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                <span className="badge badge-sm">{tab.count}</span>
              </button>
            );
          })}
        </div>

        {/* List */}
        <div className="max-h-[400px] overflow-y-auto">
          {renderList()}
        </div>
      </div>
      
      {/* Backdrop */}
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  );
};

export default StatusAnalytics;
