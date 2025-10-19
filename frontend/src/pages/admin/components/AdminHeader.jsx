import { Menu, RefreshCw } from "lucide-react";

export default function AdminHeader({ activeTab, tabs, setIsSidebarOpen, onRefresh }) {
  return (
    <div className="bg-base-100 border-b border-base-300 px-3 md:px-6 py-3 flex-shrink-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Mobile Menu Button */}
          <button
            className="btn btn-sm btn-ghost btn-circle lg:hidden"
            onClick={() => setIsSidebarOpen(true)}
            title="Open Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <h2 className="text-base md:text-lg font-semibold text-base-content">
              {tabs.find(tab => tab.id === activeTab)?.label || 'Dashboard'}
            </h2>
            <p className="text-xs md:text-sm text-base-content/60 hidden sm:block">
              Manage and monitor your application
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="btn btn-sm btn-ghost gap-2"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline text-xs">Refresh</span>
          </button>
        </div>
      </div>
    </div>
  );
}
