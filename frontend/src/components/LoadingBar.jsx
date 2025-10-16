import { useEffect, useState } from "react";

function LoadingBar() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((oldProgress) => {
        if (oldProgress === 100) {
          return 0;
        }
        const diff = Math.random() * 30;
        return Math.min(oldProgress + diff, 100);
      });
    }, 500);

    return () => {
      clearInterval(timer);
    };
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4">
      <progress 
        className="progress progress-primary w-full mb-4" 
        value={progress} 
        max="100"
      ></progress>
      <div className="text-center text-base-content opacity-60 text-sm">
        Loading messages...
      </div>
    </div>
  );
}

export default LoadingBar;
