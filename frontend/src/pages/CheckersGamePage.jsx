import { ArrowLeft, Gamepad2, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function CheckersGamePage() {
  const navigate = useNavigate();
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div className="w-full h-[100dvh] md:h-screen flex flex-col bg-base-100">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-base-300 bg-base-200">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/apps')}
              className="btn btn-ghost btn-sm btn-circle"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Gamepad2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-bold">Checkers Game</h1>
                <p className="text-xs text-base-content/60 hidden sm:block">Classic board game</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="btn btn-ghost btn-sm btn-circle"
          >
            <Info className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Info Banner */}
      {showInfo && (
        <div className="alert alert-info m-4">
          <Info className="w-5 h-5" />
          <div>
            <p className="font-semibold text-sm">How to Play</p>
            <p className="text-xs">Click on a piece to select it, then click on a valid square to move. Capture opponent pieces by jumping over them!</p>
          </div>
          <button onClick={() => setShowInfo(false)} className="btn btn-ghost btn-xs">Close</button>
        </div>
      )}

      {/* Game Content - Coming Soon */}
      <div className="flex-1 overflow-hidden flex items-center justify-center p-4">
        <div className="card bg-base-200 shadow-xl max-w-2xl w-full">
          <div className="card-body text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Gamepad2 className="w-10 h-10 text-primary" />
            </div>
            <h2 className="card-title justify-center text-2xl mb-2">Checkers Game</h2>
            <p className="text-base-content/70 mb-6">
              The multiplayer checkers game is being integrated into the platform. 
              This will allow you to play checkers with your friends in real-time!
            </p>
            <div className="alert alert-warning">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-sm">Game integration in progress. Check back soon!</span>
            </div>
            <div className="card-actions justify-center mt-6">
              <button onClick={() => navigate('/apps')} className="btn btn-primary">
                Back to Apps
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
