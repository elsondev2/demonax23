import { BarChart3 } from 'lucide-react';

const ProfileStats = () => {
  return (
    <div className="h-full flex items-center justify-center bg-base-100">
      <div className="text-center">
        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary-focus/20 border border-primary/30 flex items-center justify-center">
          <BarChart3 className="w-10 h-10 text-primary" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Stats & Recordings</h3>
        <p className="text-sm opacity-60">Coming soon in Phase 6</p>
      </div>
    </div>
  );
};

export default ProfileStats;
