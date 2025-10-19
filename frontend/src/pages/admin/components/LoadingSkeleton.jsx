export default function LoadingSkeleton({ activeTab }) {
  // Dashboard skeleton
  if (activeTab === "dashboard") {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="card bg-base-100 shadow">
          <div className="card-body p-4 md:p-6">
            <div className="skeleton h-6 w-48 mb-2"></div>
            <div className="skeleton h-4 w-64"></div>
          </div>
        </div>

        {/* Stats grid skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card bg-base-100 shadow">
              <div className="card-body p-3 md:p-6">
                <div className="skeleton h-4 w-20 mb-2"></div>
                <div className="skeleton h-8 w-16 mb-2"></div>
                <div className="skeleton h-3 w-24"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Cards grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card bg-base-100 shadow">
              <div className="card-body">
                <div className="skeleton h-5 w-32 mb-4"></div>
                <div className="space-y-3">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="skeleton h-12 w-full"></div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Users skeleton
  if (activeTab === "users") {
    return (
      <div className="space-y-4">
        <div className="card bg-base-100 shadow">
          <div className="card-body p-4 md:p-6">
            <div className="skeleton h-6 w-48 mb-2"></div>
            <div className="skeleton h-4 w-64"></div>
          </div>
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="card bg-base-100 shadow">
            <div className="card-body p-4 md:p-6">
              <div className="flex items-center gap-4">
                <div className="skeleton w-16 h-16 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-5 w-48"></div>
                  <div className="skeleton h-4 w-64"></div>
                  <div className="skeleton h-3 w-32"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Messages skeleton
  if (activeTab === "messages") {
    return (
      <div className="space-y-4">
        <div className="card bg-base-100 shadow">
          <div className="card-body p-4 md:p-6">
            <div className="skeleton h-6 w-48 mb-4"></div>
            <div className="flex gap-2 mb-4">
              <div className="skeleton h-10 w-24"></div>
              <div className="skeleton h-10 w-32"></div>
            </div>
          </div>
        </div>
        {[...Array(8)].map((_, i) => (
          <div key={i} className="card bg-base-100 shadow">
            <div className="card-body p-4">
              <div className="flex items-center gap-3">
                <div className="skeleton w-10 h-10 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-full"></div>
                  <div className="skeleton h-3 w-3/4"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Groups skeleton
  if (activeTab === "groups") {
    return (
      <div className="space-y-4">
        <div className="card bg-base-100 shadow">
          <div className="card-body p-4 md:p-6">
            <div className="skeleton h-6 w-48 mb-4"></div>
          </div>
        </div>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="card bg-base-100 shadow">
            <div className="card-body p-4">
              <div className="flex items-center gap-3">
                <div className="skeleton w-12 h-12 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-5 w-48"></div>
                  <div className="skeleton h-3 w-32"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Posts skeleton
  if (activeTab === "posts") {
    return (
      <div className="space-y-4">
        <div className="card bg-base-100 shadow">
          <div className="card-body p-4 md:p-6">
            <div className="skeleton h-6 w-48 mb-4"></div>
          </div>
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="card bg-base-100 shadow">
            <div className="card-body p-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="skeleton w-10 h-10 rounded-full"></div>
                  <div className="flex-1">
                    <div className="skeleton h-4 w-32 mb-2"></div>
                    <div className="skeleton h-3 w-24"></div>
                  </div>
                </div>
                <div className="skeleton h-20 w-full"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Uploads skeleton
  if (activeTab === "uploads") {
    return (
      <div className="space-y-4">
        <div className="card bg-base-100 shadow">
          <div className="card-body p-4 md:p-6">
            <div className="skeleton h-6 w-48 mb-4"></div>
          </div>
        </div>
        {[...Array(8)].map((_, i) => (
          <div key={i} className="card bg-base-100 shadow">
            <div className="card-body p-4">
              <div className="flex items-center gap-3">
                <div className="skeleton w-12 h-12"></div>
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-48"></div>
                  <div className="skeleton h-3 w-32"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Statuses skeleton
  if (activeTab === "statuses") {
    return (
      <div className="space-y-4">
        <div className="card bg-base-100 shadow">
          <div className="card-body p-4 md:p-6">
            <div className="skeleton h-6 w-48 mb-4"></div>
          </div>
        </div>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="card bg-base-100 shadow">
            <div className="card-body p-4">
              <div className="flex items-center gap-3">
                <div className="skeleton w-10 h-10 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-32"></div>
                  <div className="skeleton h-3 w-24"></div>
                </div>
              </div>
              <div className="skeleton h-32 w-full mt-3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Announcements skeleton
  if (activeTab === "announcements") {
    return (
      <div className="space-y-4">
        <div className="card bg-base-100 shadow">
          <div className="card-body p-4 md:p-6">
            <div className="skeleton h-6 w-48 mb-4"></div>
          </div>
        </div>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card bg-base-100 shadow">
            <div className="card-body p-4">
              <div className="skeleton h-5 w-64 mb-3"></div>
              <div className="skeleton h-16 w-full mb-2"></div>
              <div className="skeleton h-3 w-32"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Feature requests skeleton
  if (activeTab === "feature-requests") {
    return (
      <div className="space-y-4">
        <div className="card bg-base-100 shadow">
          <div className="card-body p-4 md:p-6">
            <div className="skeleton h-6 w-48 mb-4"></div>
          </div>
        </div>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="card bg-base-100 shadow">
            <div className="card-body p-4">
              <div className="flex items-start gap-3">
                <div className="skeleton w-10 h-10 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-5 w-full"></div>
                  <div className="skeleton h-4 w-3/4"></div>
                  <div className="skeleton h-3 w-32"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Follow leaderboard skeleton
  if (activeTab === "follow-leaderboard") {
    return (
      <div className="space-y-4">
        <div className="card bg-base-100 shadow">
          <div className="card-body p-4 md:p-6">
            <div className="skeleton h-6 w-48 mb-4"></div>
          </div>
        </div>
        <div className="card bg-base-100 shadow">
          <div className="card-body p-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-3 border-b border-base-300 last:border-0">
                <div className="skeleton w-8 h-8 rounded-full"></div>
                <div className="skeleton w-10 h-10 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-32"></div>
                  <div className="skeleton h-3 w-24"></div>
                </div>
                <div className="skeleton h-6 w-16"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Community skeleton
  if (activeTab === "community") {
    return (
      <div className="space-y-4">
        <div className="card bg-base-100 shadow">
          <div className="card-body p-4 md:p-6">
            <div className="skeleton h-6 w-48 mb-4"></div>
          </div>
        </div>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card bg-base-100 shadow">
            <div className="card-body p-4">
              <div className="flex items-center gap-3">
                <div className="skeleton w-16 h-16 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-5 w-48"></div>
                  <div className="skeleton h-4 w-full"></div>
                  <div className="skeleton h-3 w-32"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Default skeleton
  return (
    <div className="flex justify-center py-12">
      <span className="loading loading-spinner loading-lg"></span>
    </div>
  );
}
