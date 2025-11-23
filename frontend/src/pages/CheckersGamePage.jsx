import { ArrowLeft, Gamepad2, Info, Trophy, Star, Crown, Users, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { axiosInstance } from '../lib/axios';
import toast from 'react-hot-toast';
import CheckersBoard from '../components/checkers/CheckersBoard';
import GameModeSelector from '../components/checkers/GameModeSelector';
import DifficultySelector from '../components/checkers/DifficultySelector';
import Avatar from '../components/Avatar';
import { useAuthStore } from '../store/useAuthStore';

export default function CheckersGamePage({ onClose }) {
  const navigate = useNavigate();
  const { authUser, socket } = useAuthStore();
  const [showInfo, setShowInfo] = useState(false);
  const [gameState, setGameState] = useState('menu'); // menu, difficulty, playing, finished
  const [_gameMode, setGameMode] = useState(null);
  const [_difficulty, setDifficulty] = useState(null);
  const [game, setGame] = useState(null);
  const [profile, setProfile] = useState(null);
  const [_loading, setLoading] = useState(false);
  const [showPlayerSelector, setShowPlayerSelector] = useState(false);
  const [availablePlayers, setAvailablePlayers] = useState([]);
  const [selectedMode, setSelectedMode] = useState(null);

  const fetchProfile = useCallback(async () => {
    if (!authUser) return;
    
    try {
      const res = await axiosInstance.get('/api/checkers/profile');
      setProfile(res.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      // If profile doesn't exist, create one with user's info
      if (error.response?.status === 404) {
        try {
          const createRes = await axiosInstance.post('/api/checkers/profile', {
            userId: authUser._id,
            username: authUser.fullName
          });
          setProfile(createRes.data);
        } catch (createError) {
          console.error('Error creating profile:', createError);
        }
      }
    }
  }, [authUser]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Socket listeners for live game updates
  useEffect(() => {
    if (!socket || !game) return;

    const handleGameUpdate = (data) => {
      if (data.gameId === game._id) {
        console.log('🎮 Game update received:', data);
        setGame(data.game);
      }
    };

    const handleGameMove = (data) => {
      if (data.gameId === game._id) {
        console.log('🎮 Move received:', data);
        setGame(prev => ({
          ...prev,
          board: data.board,
          currentPlayer: data.currentPlayer,
          players: data.players
        }));
      }
    };

    const handleGameEnd = (data) => {
      if (data.gameId === game._id) {
        console.log('🎮 Game ended:', data);
        setGame(data.game);
        setGameState('finished');
        fetchProfile();
      }
    };

    socket.on('checkers:gameUpdate', handleGameUpdate);
    socket.on('checkers:move', handleGameMove);
    socket.on('checkers:gameEnd', handleGameEnd);

    return () => {
      socket.off('checkers:gameUpdate', handleGameUpdate);
      socket.off('checkers:move', handleGameMove);
      socket.off('checkers:gameEnd', handleGameEnd);
    };
  }, [socket, game, fetchProfile]);

  const fetchAvailablePlayers = async () => {
    try {
      const res = await axiosInstance.get('/api/messages/contacts');
      // Show all users but mark their online status
      const users = (res.data || []).map(user => ({
        ...user,
        isOnline: user.isOnline || false
      }));
      setAvailablePlayers(users);
    } catch (error) {
      console.error('Error fetching players:', error);
      toast.error('Failed to load players');
    }
  };

  const handleSelectMode = async (mode) => {
    setGameMode(mode);
    setSelectedMode(mode);
    
    if (mode === 'ai') {
      setGameState('difficulty');
    } else if (mode === 'friendly' || mode === 'arena') {
      // Show player selector for online modes
      await fetchAvailablePlayers();
      setShowPlayerSelector(true);
    } else {
      startGame(mode);
    }
  };

  const handleSelectPlayer = (player) => {
    setShowPlayerSelector(false);
    startGame(selectedMode, null, player._id);
    toast.success(`Inviting ${player.fullName} to play...`);
  };

  const handleSelectDifficulty = (diff) => {
    setDifficulty(diff);
    startGame('ai', diff);
  };

  const startGame = async (mode, diff = null, opponentId = null) => {
    setLoading(true);
    try {
      const res = await axiosInstance.post('/api/checkers/games', {
        gameType: mode,
        difficulty: diff,
        pointsBet: 0,
        opponentId
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
        scores: {
          red: scores.red || 0,
          black: scores.black || 0
        }
      });
      setGame(res.data);

      // Check for win condition
      if (scores.red === 0 || scores.black === 0) {
        const winner = scores.red === 0 ? 'black' : 'red';
        await endGame(winner);
      }
    } catch (error) {
      console.error('Error making move:', error);
      toast.error(error.response?.data?.message || 'Failed to make move');
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
    <div className="w-full h-full flex flex-col bg-base-100 overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-base-300 bg-base-200">
        <div className="p-3 md:p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
            <button
              onClick={() => onClose ? onClose() : navigate(-1)}
              className="btn btn-ghost btn-sm btn-circle flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Gamepad2 className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base md:text-lg font-bold truncate">Checkers</h1>
                <p className="text-xs text-base-content/60 hidden sm:block">Classic board game</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
            {authUser && (
              <div className="flex items-center gap-2">
                <Avatar
                  src={authUser.profilePic}
                  name={authUser.fullName}
                  size="w-8 h-8"
                  className="hidden sm:block"
                />
                {profile && (
                  <div className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 bg-primary/10 rounded-full">
                    <Trophy className="w-3 h-3 md:w-4 md:h-4 text-primary" />
                    <span className="text-xs md:text-sm font-semibold">{profile.points}</span>
                  </div>
                )}
              </div>
            )}
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="btn btn-ghost btn-sm btn-circle"
            >
              <Info className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      {showInfo && (
        <div className="alert alert-info m-3 md:m-4">
          <Info className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">How to Play</p>
            <p className="text-xs">Click on a piece to select it, then click on a valid square to move. Capture opponent pieces by jumping over them! Reach the opposite end to become a King!</p>
          </div>
          <button onClick={() => setShowInfo(false)} className="btn btn-ghost btn-xs flex-shrink-0">Close</button>
        </div>
      )}

      {/* Game Content */}
      <div className="flex-1 overflow-y-auto p-3 md:p-4 pb-safe">
        {gameState === 'menu' && (
          <div className="max-w-6xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-6 md:mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-primary to-secondary mb-3 md:mb-4">
                <Gamepad2 className="w-10 h-10 md:w-12 md:h-12 text-primary-content" />
              </div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Checkers Arena
              </h2>
              <p className="text-base-content/70 text-sm md:text-base lg:text-lg px-4">Challenge friends or test your skills against AI</p>
            </div>

            {/* Profile Stats */}
            {profile && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 mb-6 md:mb-8">
                <div className="stat bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-3 md:p-4 border border-primary/20">
                  <div className="stat-figure text-primary">
                    <Trophy className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <div className="stat-title text-xs">Points</div>
                  <div className="stat-value text-xl md:text-2xl text-primary">{profile.points}</div>
                </div>
                <div className="stat bg-gradient-to-br from-success/10 to-success/5 rounded-xl p-3 md:p-4 border border-success/20">
                  <div className="stat-figure text-success">
                    <Star className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <div className="stat-title text-xs">Wins</div>
                  <div className="stat-value text-xl md:text-2xl text-success">{profile.stats.wins}</div>
                </div>
                <div className="stat bg-gradient-to-br from-error/10 to-error/5 rounded-xl p-3 md:p-4 border border-error/20">
                  <div className="stat-figure text-error">
                    <X className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <div className="stat-title text-xs">Losses</div>
                  <div className="stat-value text-xl md:text-2xl text-error">{profile.stats.losses}</div>
                </div>
                <div className="stat bg-gradient-to-br from-warning/10 to-warning/5 rounded-xl p-3 md:p-4 border border-warning/20">
                  <div className="stat-figure text-warning">
                    <Crown className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <div className="stat-title text-xs">Streak</div>
                  <div className="stat-value text-xl md:text-2xl text-warning">{profile.currentStreak}</div>
                </div>
              </div>
            )}

            <div className="text-center mb-4 md:mb-6">
              <h3 className="text-lg md:text-xl font-bold mb-1 md:mb-2">Select Game Mode</h3>
              <p className="text-sm md:text-base text-base-content/60">Choose how you want to play</p>
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
                  <button onClick={() => onClose ? onClose() : navigate('/apps')} className="btn btn-ghost">
                    Back to Apps
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Player Selector Modal */}
      {showPlayerSelector && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <button
              onClick={() => setShowPlayerSelector(false)}
              className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-primary/20 rounded-full">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-xl">Select Opponent</h3>
                  <p className="text-sm text-base-content/70">
                    Choose a player to challenge
                  </p>
                </div>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-2 px-1">
              {availablePlayers.length === 0 ? (
                <div className="text-center py-8 md:py-12">
                  <Users className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 text-base-content/30" />
                  <p className="text-base-content/70 text-sm md:text-base">No contacts found</p>
                  <p className="text-xs md:text-sm text-base-content/50 mt-2">
                    Add friends to play with them or play vs AI!
                  </p>
                </div>
              ) : availablePlayers.filter(p => p.isOnline).length === 0 ? (
                <div className="text-center py-8 md:py-12">
                  <Users className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 text-base-content/30" />
                  <p className="text-base-content/70 text-sm md:text-base">No online players</p>
                  <p className="text-xs md:text-sm text-base-content/50 mt-2">
                    {availablePlayers.length} contact{availablePlayers.length !== 1 ? 's' : ''} offline. Try playing vs AI!
                  </p>
                </div>
              ) : (
                <>
                  {/* Online Players First */}
                  {availablePlayers.filter(p => p.isOnline).map((player) => (
                    <button
                      key={player._id}
                      onClick={() => handleSelectPlayer(player)}
                      className="w-full flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl bg-base-200 hover:bg-base-300 transition-all cursor-pointer"
                    >
                      <div className="relative">
                        <Avatar
                          src={player.profilePic}
                          name={player.fullName}
                          size="w-10 h-10 md:w-12 md:h-12"
                        />
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-base-100"></div>
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <div className="font-semibold text-sm md:text-base truncate flex items-center gap-2">
                          {player.fullName}
                          <span className="badge badge-success badge-xs">Online</span>
                        </div>
                        <div className="text-xs md:text-sm text-base-content/70 truncate">{player.email}</div>
                      </div>
                      <div className="badge badge-primary badge-sm md:badge-md flex-shrink-0">Challenge</div>
                    </button>
                  ))}
                  
                  {/* Offline Players */}
                  {availablePlayers.filter(p => !p.isOnline).length > 0 && (
                    <div className="divider text-xs text-base-content/50">Offline</div>
                  )}
                  {availablePlayers.filter(p => !p.isOnline).map((player) => (
                    <div
                      key={player._id}
                      className="w-full flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl bg-base-200/50 opacity-60 cursor-not-allowed"
                    >
                      <div className="relative">
                        <Avatar
                          src={player.profilePic}
                          name={player.fullName}
                          size="w-10 h-10 md:w-12 md:h-12"
                        />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <div className="font-semibold text-sm md:text-base truncate">{player.fullName}</div>
                        <div className="text-xs md:text-sm text-base-content/70 truncate">{player.email}</div>
                      </div>
                      <div className="badge badge-ghost badge-sm md:badge-md flex-shrink-0">Offline</div>
                    </div>
                  ))}
                </>
              )}
            </div>

            <div className="modal-action">
              <button
                onClick={() => setShowPlayerSelector(false)}
                className="btn btn-ghost"
              >
                Cancel
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop" onClick={() => setShowPlayerSelector(false)}>
            <button>close</button>
          </form>
        </div>
      )}
    </div>
  );
}
