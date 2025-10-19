import { X, Settings, LogOutIcon } from "lucide-react";
import { useNavigate } from "react-router";
import { useAuthStore } from "../../../store/useAuthStore";
import { useThemeStore } from "../../../store/useThemeStore";

export default function AdminSidebar({ isSidebarOpen, setIsSidebarOpen, activeTab, tabs, authUser }) {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const { openModal } = useThemeStore();

  const handleTabClick = (tabId) => {
    const route = tabId === 'dashboard' ? '/admin' : `/admin/${tabId}`;
    navigate(route);
    setIsSidebarOpen(false); // Close sidebar on mobile
  };

  return (
    <div className={`
      fixed lg:relative inset-y-0 left-0 z-50
      w-64 bg-base-100 border-r border-base-300 flex flex-col flex-shrink-0
      transform transition-transform duration-300 ease-in-out
      ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    `}>
      {/* Sidebar Header */}
      <div className="p-4 border-b border-base-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-base-content">Admin Panel</h1>
            <button
              className="btn btn-xs btn-ghost btn-circle"
              title="Appearance & Customization"
              onClick={() => openModal()}
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
          {/* Close button for mobile */}
          <button
            className="btn btn-sm btn-ghost btn-circle lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-base-content/60 mt-1">Logged in as: {authUser?.email}</p>
      </div>

      {/* Sidebar Navigation */}
      <div className="flex-1 overflow-y-auto p-2">
        <nav className="space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === tab.id
                  ? "bg-primary text-primary-content"
                  : "text-base-content hover:bg-base-200"
                  }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-base-300 space-y-2">
        <a
          href="https://justelson-help.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-sm btn-ghost w-full justify-start gap-2"
        >
          <span className="text-xs">Support</span>
        </a>
        <button className="btn btn-sm btn-ghost w-full justify-start gap-2" onClick={() => navigate('/')}>
          <span className="text-xs">Back to App</span>
        </button>
        <button
          className="btn btn-sm btn-error w-full justify-start gap-2"
          onClick={() => { logout(); navigate('/admin/login'); }}
        >
          <LogOutIcon className="w-4 h-4" />
          <span className="text-xs">Logout</span>
        </button>
      </div>
    </div>
  );
}
