import { Megaphone, Bell, Edit, Trash2 } from "lucide-react";

export default function AnnouncementsView({ announcements, setDeleteModal, setIsAnnouncementModalOpen, onEditAnnouncement }) {
  return (
    <div className="space-y-4">
      {/* Header Section */}
      <div className="card bg-base-100 shadow">
        <div className="card-body p-4 md:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-base md:text-lg font-semibold">Announcements Management</h2>
              <p className="text-sm text-base-content/60 hidden sm:block">Create and manage announcements for users</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="stats shadow">
                <div className="stat py-2 px-3">
                  <div className="stat-title text-xs">Total</div>
                  <div className="stat-value text-sm md:text-lg text-primary">{announcements.length}</div>
                </div>
              </div>
              <button
                className="btn btn-primary gap-2"
                onClick={() => setIsAnnouncementModalOpen(true)}
              >
                <Megaphone className="w-4 h-4" />
                <span className="hidden sm:inline">New Announcement</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Announcements Grid */}
      {announcements.length === 0 ? (
        <div className="card bg-base-100 shadow">
          <div className="card-body text-center py-12">
            <Megaphone className="w-16 h-16 mx-auto mb-4 text-base-content/30" />
            <p className="text-base-content/60">No announcements yet</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {announcements.map((announcement) => {
            // Determine banner color based on priority
            const bannerColor =
              announcement.priority === 'alert' ? 'bg-gradient-to-r from-error to-error/80' :
                announcement.priority === 'warning' ? 'bg-gradient-to-r from-warning to-warning/80' :
                  'bg-gradient-to-r from-primary to-primary/80';

            const iconColor =
              announcement.priority === 'alert' ? 'text-error' :
                announcement.priority === 'warning' ? 'text-warning' :
                  'text-primary';

            const priorityLabel =
              announcement.priority === 'alert' ? 'Alert' :
                announcement.priority === 'warning' ? 'Warning' :
                  'Info';

            const PriorityIcon =
              announcement.priority === 'alert' ? Bell :
                announcement.priority === 'warning' ? Bell :
                  Bell;

            return (
              <div key={announcement._id} className="card bg-base-100 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                {/* Banner Header - Use actual banner image if available */}
                {announcement.bannerImage ? (
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={announcement.bannerImage}
                      alt={announcement.title}
                      className="w-full h-full object-cover"
                    />
                    {/* Overlay gradient for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>

                    {/* Content overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 text-white">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg md:text-xl line-clamp-2 mb-2">
                            {announcement.title}
                          </h3>
                          <span className="badge badge-sm bg-white/30 backdrop-blur-sm border-white/50 text-white gap-1">
                            <PriorityIcon className="w-3 h-3" />
                            {priorityLabel}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={`${bannerColor} p-4 md:p-6 text-white relative overflow-hidden h-48`}>
                    <div className="absolute top-0 right-0 opacity-10">
                      <Megaphone className="w-32 h-32 transform rotate-12" />
                    </div>
                    <div className="relative z-10 h-full flex flex-col justify-end">
                      <h3 className="font-bold text-lg md:text-xl line-clamp-2 mb-2">
                        {announcement.title}
                      </h3>
                      <span className="badge badge-sm bg-white/30 backdrop-blur-sm border-white/50 text-white w-fit gap-1">
                        <PriorityIcon className="w-3 h-3" />
                        {priorityLabel}
                      </span>
                    </div>
                  </div>
                )}

                {/* Card Body */}
                <div className="card-body p-4 md:p-6">
                  {/* Content */}
                  <div className="mb-4">
                    <p className="text-sm md:text-base text-base-content/80 whitespace-pre-wrap line-clamp-4">
                      {announcement.content}
                    </p>
                  </div>

                  {/* Footer Info */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-base-300">
                    <div className="flex items-center gap-2 text-xs md:text-sm text-base-content/60">
                      <div className={`w-2 h-2 rounded-full ${iconColor.replace('text-', 'bg-')} animate-pulse`}></div>
                      <span>Posted {new Date(announcement.createdAt).toLocaleDateString()}</span>
                      <span className="hidden sm:inline">at {new Date(announcement.createdAt).toLocaleTimeString()}</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        className="btn btn-xs md:btn-sm btn-ghost gap-1"
                        onClick={() => onEditAnnouncement(announcement)}
                      >
                        <Edit className="w-3 h-3 md:w-4 md:h-4" />
                        <span>Edit</span>
                      </button>
                      <button
                        className="btn btn-xs md:btn-sm btn-error btn-ghost gap-1"
                        onClick={() => setDeleteModal({ type: 'announcements', id: announcement._id, name: announcement.title })}
                      >
                        <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
