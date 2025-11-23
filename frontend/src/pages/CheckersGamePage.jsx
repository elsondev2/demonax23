import { ArrowLeft, Gamepad2, Info, Trophy, Star, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { axiosInstance } from '../lib/axios';
import toast from 'react-hot-toast';
import CheckersBoard from '../components/checkers/CheckersBoard';
import GameModeSelector from '../components/checkers/GameModeSelector';
import DifficultySelector from '../components/checkers/DifficultySelector';

export default function CheckersGamePage() {
  const navigate = useNavigate();
  const [showInfo, setShowInfo] = useState(false);
  const [gameState, setGameState] = useState('menu'); // menu, difficulty, playing, finished
  const [_gameMode, setGameMode] = useState(null);
  const [_difficulty, setDifficulty] = useState(null);
  const [game, setGame] = useState(null);
  const [profile, setProfile] = useState(null);
  const [_loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await axiosInstance.get('/api/checkers/profile');
      setProfile(res.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleSelectMode = (mode) => {
    setGameMode(mode);
    if (mode === 'ai') {
      setGameState('difficulty');
    } else {
      startGame(mode);
    }
  };

  const handleSelectDifficulty = (diff) => {
    setDifficulty(diff);
    startGame('ai', diff);
  };

  const startGame = async (mode, diff = null) => {
    setLoading(true);
    try {
      const res = await axiosInstance.post('/api/checkers/games', {
        gameType: mode,
        difficulty: diff,
        pointsBet: 0
      });
      setGame(res.data);
      setGameState('playing');
      toast.success('Game started!');
    } catch (error) {
      console.error('Error starting game:', error);
      toast.error(error.response?.data?.message || 'Failed to start game');
    } finally {
      setLoading(false);
    }
  };

  const handleMove = async (newBoard, nextPlayer, scores) => {
    try {
      const res = await axiosInstance.put(`/api/checkers/games/${game._id}/move`, {
        board: newBoard,
        currentPlayer: nextPlayer,
        scores
      });
      setGame(res.data);

      // Check for win condition
      if (scores.red === 0 || scores.black === 0) {
        const winner = scores.red === 0 ? 'black' : 'red';
        await endGame(winner);
      }
    } catch (error) {
      console.error('Error making move:', error);
      toast.error('Failed to make move');
    }
  };

  const endGame = async (winner) => {
    try {
      const res = await axiosInstance.post(`/api/checkers/games/${game._id}/end`, {
        winner,
        isDraw: false
      });
      setGame(res.data);
      setGameState('finished');
      await fetchProfile();
      
      const isWinner = (game.players[0].color === winner);
      if (isWinner) {
        toast.success('You won! 🎉');
      } else {
        toast.error('You lost. Try again!');
      }
    } catch (error) {
      console.error('Error ending game:', error);
    }
  };

  const handleNewGame = () => {
    setGame(null);
    setGameMode(null);
    setDifficulty(null);
    setGameState('menu');
  };

  const handleAbandon = async () => {
    if (!confirm('Are you sure you want to abandon this game?')) return;
    
    try {
      await axiosInstance.post(`/api/checkers/games/${game._id}/abandon`);
      toast.success('Game abandoned');
      handleNewGame();
    } catch (error) {
      console.error('Error abandoning game:', error);
      toast.error('Failed to abandon game');
    }
  };

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
                <h1 className="text-lg md:text-xl font-bold">Checkers</h1>
                <p className="text-xs text-base-content/60 hidden sm:block">Classic board game</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {profile && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full">
                <Trophy className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold">{profile.points}</span>
              </div>
            )}
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="btn btn-ghost btn-sm btn-circle"
            >
              <Info className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      {showInfo && (
        <div className="alert alert-info m-4">
          <Info className="w-5 h-5" />
          <div>
            <p className="font-semibold text-sm">How to Play</p>
            <p className="text-xs">Click on a piece to select it, then click on a valid square to move. Capture opponent pieces by jumping over them! Reach the opposite end to become a King!</p>
          </div>
          <button onClick={() => setShowInfo(false)} className="btn btn-ghost btn-xs">Close</button>
        </div>
      )}

      {/* Game Content */}
      <div className="flex-1 overflow-y-auto p-4 pb-safe">
        {gameState === 'menu' && (
          <div className="max-w-6xl mx-auto">
            {/* Profile Stats */}
            {profile && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="stat bg-base-200 rounded-lg p-4">
                  <div className="stat-title text-xs">Points</div>
                  <div className="stat-value text-2xl text-primary">{profile.points}</div>
                </div>
                <div className="stat bg-base-200 rounded-lg p-4">
                  <div className="stat-title text-xs">Wins</div>
                  <div className="stat-value text-2xl text-success">{profile.stats.wins}</div>
                </div>
                <div className="stat bg-base-200 rounded-lg p-4">
                  <div className="stat-title text-xs">Losses</div>
                  <div className="stat-value text-2xl text-error">{profile.stats.losses}</div>
                </div>
                <div className="stat bg-base-200 rounded-lg p-4">
                  <div className="stat-title text-xs">Streak</div>
                  <div className="stat-value text-2xl text-warning">{profile.currentStreak}</div>
                </div>
              </div>
            )}

            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">Select Game Mode</h2>
              <p className="text-base-content/70">Choose how you want to play</p>
            </div>

            <GameModeSelector onSelectMode={handleSelectMode} />
          </div>
        )}

        {gameState === 'difficulty' && (
          <DifficultySelector
            onSelect={handleSelectDifficulty}
            onBack={() => setGameState('menu')}
          />
        )}

        {gameState === 'playing' && game && (
          <div className="max-w-6xl mx-auto">
            {/* Game Info */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-4">
                <div className={`badge ${game.currentPlayer === 'red' ? 'badge-error' : 'badge-neutral'} gap-2`}>
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  Red: {game.players.find(p => p.color === 'red')?.score || 0}
                </div>
                <div className={`badge ${game.currentPlayer === 'black' ? 'badge-neutral' : 'badge-ghost'} gap-2`}>
                  <div className="w-3 h-3 rounded-full bg-gray-800"></div>
                  Black: {game.players.find(p => p.color === 'black')?.score || 0}
                </div>
              </div>
              <button onClick={handleAbandon} className="btn btn-error btn-sm">
                Abandon Game
              </button>
            </div>

            {/* Current Player Indicator */}
            <div className="text-center mb-4">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
                game.currentPlayer === 'red' ? 'bg-red-500/20 text-red-500' : 'bg-gray-800/20 text-gray-800'
              }`}>
                <Crown className="w-5 h-5" />
                <span className="font-semibold">{game.currentPlayer === 'red' ? 'Red' : 'Black'}'s Turn</span>
              </div>
            </div>

            {/* Board */}
            <CheckersBoard
              board={game.board}
              onMove={handleMove}
              currentPlayer={game.currentPlayer}
              isMyTurn={true}
              gameType={game.gameType}
            />
          </div>
        )}

        {gameState === 'finished' && game && (
          <div className="max-w-2xl mx-auto">
            <div className="card bg-base-200 shadow-xl">
              <div className="card-body text-center">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Trophy className="w-10 h-10 text-primary" />
                </div>
                <h2 className="card-title justify-center text-2xl mb-2">Game Over!</h2>
                <p className="text-xl font-bold mb-4">
                  {game.winner === game.players[0].color ? 'You Won! 🎉' : 'You Lost'}
                </p>
                
                {/* Game Stats */}
                <div className="stats stats-vertical lg:stats-horizontal shadow mb-4">
                  <div className="stat">
                    <div className="stat-title">Winner</div>
                    <div className="stat-value text-lg capitalize">{game.winner}</div>
                  </div>
                  <div className="stat">
                    <div className="stat-title">Moves</div>
                    <div className="stat-value text-lg">{game.moveHistory}</div>
                  </div>
                  <div className="stat">
                    <div className="stat-title">Mode</div>
                    <div className="stat-value text-lg capitalize">{game.gameType}</div>
                  </div>
                </div>

                <div className="card-actions justify-center gap-2">
                  <button onClick={handleNewGame} className="btn btn-primary">
                    New Game
                  </button>
                  <button onClick={() => navigate('/apps')} className="btn btn-ghost">
                    Back to Apps
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
