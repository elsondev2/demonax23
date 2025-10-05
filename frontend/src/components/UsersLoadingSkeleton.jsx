function UsersLoadingSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((item) => (
        <div key={item} className="bg-base-300/30 hover:bg-base-300/50 p-3 md:p-4 rounded-xl cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-base-300 rounded-full"></div>
            <div className="flex-1 min-w-0">
              <div className="h-4 bg-base-300 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-base-300/70 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
export default UsersLoadingSkeleton;
