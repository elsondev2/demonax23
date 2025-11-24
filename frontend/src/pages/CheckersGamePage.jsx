import { ArrowLeft, Gamepad2, Info, Trophy, Star, Crown, Users, X, Eye, Play } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { axiosInstance } from '../lib/axios';
import toast from 'react-hot-toast';
import CheckersBoard from '../components/checkers/CheckersBoard';
import GameModeSelector from '../components/checkers/GameModeSelector';
import DifficultySelector from '../components/checkers/DifficultySelector';
import Avatar from '../components/Avatar';
import { useAuthStore } from '../store/useAuthStore';
import '../styles/checkers-animations.css';

export default function CheckersGamePage({ onClose }) {
  const navigate = useNavigate();
  const { gameId: urlGameId } = useParams();
  const { authUser, socket, onlineUsers } = useAuthStore();
  const [showInfo, setShowInfo] = useState(false);
  const [gameState, setGameState] = useState('menu');
  const [_gameMode, setGameMode] = useState(null);
  const [_difficulty, setDifficulty] = useState(null);
  const [game, setGame] = useState(null);
  const [profile, setProfile] = useState(null);
  const [_loading, setLoading] = useState(false);
  const [showPlayerSelector, setShowPlayerSelector] = useState(false);
  const [availablePlayers, setAvailablePlayers] = useState([]);
  const [selectedMode, setSelectedMode] = useState(null);
  const [liveMatches, setLiveMatches] = useState([]);
  const [spectators, setSpectators] = useState([]);
  const [isSpectating, setIsSpectating] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!authUser) return;
    try {
      const res = await axiosInstance.get('/api/checkers/profile');
      setProfile(res.data);
    } catch (error) {
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

  const fetchLiveMatches = useCallback(async () => {
    try {
      const res = await axiosInstance.get('/api/checkers/games');
      setLiveMatches(res.data.filter(g => g.status === 'active' && g.players.length === 2));
    } catch (error) {
      console.error('Error fetching live matches:', error);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (urlGameId && socket) {
      loadGame(urlGameId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlGameId, socket]);

  const loadGame = async (gameId) => {
    try {
      const res = await axiosInstance.get(`/api/checkers/games/${gameId}`);
      setGame(res.data);
      const isPlayer = res.data.players.some(p => p.userId._id === authUser._id);
      
      if (isPlayer) {
        setGameState('playing');
        setIsSpectating(false);
        socket.emit('checkers:joinGame', { gameId });
      } else {
        setGameState('spectating');
        setIsSpectating(true);
        socket.emit('checkers:spectate', { gameId });
      }
    } catch (err) {
      console.error('Error loading game:', err);
      toast.error('Failed to load game');
      navigate('/games/checkers');
    }
  };

  useEffect(() => {
    if (!socket) return;

    const handleChallenge = (data) => {
      if (data.challengerId === authUser?._id) return;
      
      const notification = document.createElement('div');
      notification.className = 'fixed top-20 right-4 z-[200] max-w-sm animate-slide-in-right';
      notification.innerHTML = `
        <div class="alert alert-info shadow-2xl border-2 border-primary">
          <div class="flex-1">
            <h3 class="font-bold text-sm">Checkers Challenge!</h3>
            <div class="text-xs mt-1">${data.challengerName} challenged you!</div>
          </div>
          <div class="flex gap-2">
            <button class="btn btn-primary btn-xs" onclick="window.acceptCheckersChallenge('${data.gameId}')">Accept</button>
            <button class="btn btn-ghost btn-xs" onclick="this.closest('.alert').parentElement.remove()">Dismiss</button>
          </div>
        </div>
      `;
      document.body.appendChild(notification);
      setTimeout(() => notification.parentElement && notification.remove(), 30000);
      toast.success(`${data.challengerName} challenged you!`, { duration: 5000 });
    };

    window.acceptCheckersChallenge = async (gameId) => {
      try {
        // Call the joinGame API to officially register the player
        const res = await axiosInstance.post(`/api/checkers/games/${gameId}/join`);
        setGame(res.data);
        setGameState('playing');
        setIsSpectating(false);
        socket.emit('checkers:joinGame', { gameId });
        navigate(`/games/checkers/${gameId}`);
        toast.success('Challenge accepted!');
        document.querySelectorAll('.alert').forEach(alert => {
          if (alert.textContent.includes('Checkers Challenge')) {
            alert.closest('.animate-slide-in-right')?.remove();
          }
        });
      } catch {
        toast.error('Failed to join game');
      }
    };

    socket.on('checkers:receiveChallenge', handleChallenge);

    if (game) {
      const handlePlayerJoined = (data) => {
        // Only reload if game status is still waiting (opponent just joined)
        if (game.status === 'waiting') {
          loadGame(game._id);
        }
        // Only show toast if the joined player is not the current user
        if (data.userId !== authUser._id) {
          toast.success(`${data.userName} joined the game!`);
        }
      };

      const handleGameMove = (data) => {
        if (data.gameId === game._id) {
          setGame(prev => ({
            ...prev,
            board: data.board,
            currentPlayer: data.currentPlayer,
            players: prev.players.map(p => ({ ...p, score: data.scores[p.color] }))
          }));
        }
      };

      const handleGameEnd = (data) => {
        if (data.gameId === game._id) {
          setGame(data.game);
          setGameState('finished');
          fetchProfile();
          fetchLiveMatches();
        }
      };

      const handleSpectatorJoined = (data) => {
        setSpectators(prev => [...prev, data]);
        if (!isSpectating) toast.info(`${data.userName} is watching`);
      };

      const handleSpectatorLeft = (data) => {
        setSpectators(prev => prev.filter(s => s.userId !== data.userId));
      };

      socket.on('checkers:move', handleGameMove);
      socket.on('checkers:gameEnd', handleGameEnd);
      socket.on('checkers:spectatorJoined', handleSpectatorJoined);
      socket.on('checkers:spectatorLeft', handleSpectatorLeft);
      socket.on('checkers:playerJoined', handlePlayerJoined);

      return () => {
        socket.off('checkers:receiveChallenge', handleChallenge);
        socket.off('checkers:move', handleGameMove);
        socket.off('checkers:gameEnd', handleGameEnd);
        socket.off('checkers:spectatorJoined', handleSpectatorJoined);
        socket.off('checkers:spectatorLeft', handleSpectatorLeft);
        socket.off('checkers:playerJoined', handlePlayerJoined);
      };
    }

    const handleLobbyUpdate = () => fetchLiveMatches();
    socket.on('checkers:lobbyUpdate', handleLobbyUpdate);

    return () => {
      socket.off('checkers:receiveChallenge', handleChallenge);
      socket.off('checkers:lobbyUpdate', handleLobbyUpdate);
    };
  }, [socket, game, fetchProfile, fetchLiveMatches, isSpectating, authUser, navigate]);

  const fetchAvailablePlayers = async () => {
    try {
      const res = await axiosInstance.get('/api/messages/contacts');
      const users = (res.data || []).map(user => ({
        ...user,
        isOnline: onlineUsers.includes(user._id)
      }));
      setAvailablePlayers(users);
    } catch {
      toast.error('Failed to load players');
    }
  };

  const handleSelectMode = async (mode) => {
    setGameMode(mode);
    setSelectedMode(mode);
    
    if (mode === 'ai') {
      setGameState('difficulty');
    } else if (mode === 'friendly' || mode === 'arena') {
      await fetchAvailablePlayers();
      setShowPlayerSelector(true);
    } else if (mode === 'lobby') {
      await fetchLiveMatches();
      setGameState('lobby');
    } else {
      startGame(mode);
    }
  };

  const handleSelectPlayer = async (player) => {
    setShowPlayerSelector(false);
    try {
      const gameRes = await axiosInstance.post('/api/checkers/games', {
        gameType: selectedMode,
        pointsBet: 0,
        opponentId: player._id
      });
      
      setGame(gameRes.data);
      setGameState('playing');
      socket.emit('checkers:joinGame', { gameId: gameRes.data._id });
      navigate(`/games/checkers/${gameRes.data._id}`);
      
      if (socket) {
        socket.emit('checkers:sendChallenge', {
          gameId: gameRes.data._id,
          opponentId: player._id,
          challengerId: authUser._id,
          challengerName: authUser.fullName,
          gameMode: selectedMode
        });
      }
      
      toast.success(`Challenge sent to ${player.fullName}!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start game');
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
      if (socket) socket.emit('checkers:joinGame', { gameId: res.data._id });
      navigate(`/games/checkers/${res.data._id}`);
      toast.success('Game started!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to start game');
    } finally {
      setLoading(false);
    }
  };

  const handleMove = async (newBoard, nextPlayer, scores) => {
    try {
      const moveData = {
        board: newBoard,
        currentPlayer: nextPlayer,
        scores: { red: scores.red || 0, black: scores.black || 0 }
      };
      console.log('Sending move:', moveData);
      const res = await axiosInstance.put(`/api/checkers/games/${game._id}/move`, moveData);
      setGame(res.data);

      if (scores.red === 0 || scores.black === 0) {
        const winner = scores.red === 0 ? 'black' : 'red';
        await endGame(winner);
      }
    } catch (err) {
      console.error('Move error response:', err.response?.data);
      console.error('Move error status:', err.response?.status);
      toast.error(err.response?.data?.message || 'Failed to make move');
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
      
      const myPlayer = game.players.find(p => p.userId._id === authUser._id);
      const isWinner = myPlayer && myPlayer.color === winner;
      toast[isWinner ? 'success' : 'error'](isWinner ? 'You won!' : 'You lost. Try again!');
    } catch (error) {
      console.error('Error ending game:', error);
    }
  };

  const handleNewGame = () => {
    if (game && socket) {
      if (isSpectating) {
        socket.emit('checkers:stopSpectate', { gameId: game._id });
      } else {
        socket.emit('checkers:leaveGame', { gameId: game._id });
      }
    }
    setGame(null);
    setGameMode(null);
    setDifficulty(null);
    setGameState('menu');
    setIsSpectating(false);
    setSpectators([]);
    navigate('/games/checkers');
  };

  const handleAbandon = async () => {
    if (!confirm('Are you sure you want to abandon this game?')) return;
    try {
      await axiosInstance.post(`/api/checkers/games/${game._id}/abandon`);
      toast.success('Game abandoned');
      handleNewGame();
    } catch {
      toast.error('Failed to abandon game');
    }
  };

  const handleSpectateGame = async (gameId) => {
    try {
      const res = await axiosInstance.get(`/api/checkers/games/${gameId}`);
      setGame(res.data);
      setGameState('spectating');
      setIsSpectating(true);
      socket.emit('checkers:spectate', { gameId });
      navigate(`/games/checkers/${gameId}`);
      toast.success('Now spectating game');
    } catch {
      toast.error('Failed to spectate game');
    }
  };

  const getMyColor = () => {
    if (!game || !authUser) return null;
    const myPlayer = game.players.find(p => p.userId._id === authUser._id);
    return myPlayer?.color;
  };

  const isMyTurn = () => {
    if (!game || isSpectating) return false;
    const myColor = getMyColor();
    return myColor === game.currentPlayer;
  };

  return (
    <div className="w-full h-full flex flex-col bg-base-100 overflow-hidden">
      <div className="flex-shrink-0 border-b border-base-300 bg-base-200">
        <div className="p-3 md:p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
            <button onClick={() => onClose ? onClose() : navigate(-1)} className="btn btn-ghost btn-sm btn-circle">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Gamepad2 className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base md:text-lg font-bold truncate">Checkers</h1>
                <p className="text-xs text-base-content/60 hidden sm:block">Live Multiplayer</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 md:gap-2">
            {authUser && profile && (
              <div className="flex items-center gap-2">
                <Avatar src={authUser.profilePic} name={authUser.fullName} size="w-8 h-8" className="hidden sm:block" />
                <div className="flex items-center gap-1 px-2 md:px-3 py-1 bg-primary/10 rounded-full">
                  <Trophy className="w-3 h-3 md:w-4 md:h-4 text-primary" />
                  <span className="text-xs md:text-sm font-semibold">{profile.points}</span>
                </div>
              </div>
            )}
            <button onClick={() => setShowInfo(!showInfo)} className="btn btn-ghost btn-sm btn-circle">
              <Info className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
        </div>
      </div>

      {showInfo && (
        <div className="alert alert-info m-3 md:m-4">
          <Info className="w-5 h-5" />
          <div className="flex-1">
            <p className="font-semibold text-sm">How to Play</p>
            <p className="text-xs">Click a piece, then click a valid square to move. Capture by jumping over opponent pieces. Reach the end to become a King!</p>
          </div>
          <button onClick={() => setShowInfo(false)} className="btn btn-ghost btn-xs">Close</button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3 md:p-4 pb-safe">
        {gameState === 'menu' && (
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-6 md:mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-primary to-secondary mb-3 md:mb-4">
                <Gamepad2 className="w-10 h-10 md:w-12 md:h-12 text-primary-content" />
              </div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Checkers Arena
              </h2>
              <p className="text-base-content/70 text-sm md:text-base lg:text-lg px-4">Challenge friends or watch live matches</p>
            </div>

            {profile && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 mb-6 md:mb-8">
                <div className="stat bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-3 md:p-4 border border-primary/20">
                  <div className="stat-figure text-primary"><Trophy className="w-5 h-5 md:w-6 md:h-6" /></div>
                  <div className="stat-title text-xs">Points</div>
                  <div className="stat-value text-xl md:text-2xl text-primary">{profile.points}</div>
                </div>
                <div className="stat bg-gradient-to-br from-success/10 to-success/5 rounded-xl p-3 md:p-4 border border-success/20">
                  <div className="stat-figure text-success"><Star className="w-5 h-5 md:w-6 md:h-6" /></div>
                  <div className="stat-title text-xs">Wins</div>
                  <div className="stat-value text-xl md:text-2xl text-success">{profile.stats.wins}</div>
                </div>
                <div className="stat bg-gradient-to-br from-error/10 to-error/5 rounded-xl p-3 md:p-4 border border-error/20">
                  <div className="stat-figure text-error"><X className="w-5 h-5 md:w-6 md:h-6" /></div>
                  <div className="stat-title text-xs">Losses</div>
                  <div className="stat-value text-xl md:text-2xl text-error">{profile.stats.losses}</div>
                </div>
                <div className="stat bg-gradient-to-br from-warning/10 to-warning/5 rounded-xl p-3 md:p-4 border border-warning/20">
                  <div className="stat-figure text-warning"><Crown className="w-5 h-5 md:w-6 md:h-6" /></div>
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
          <DifficultySelector onSelect={handleSelectDifficulty} onBack={() => setGameState('menu')} />
        )}

        {gameState === 'lobby' && (
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Eye className="w-6 h-6 text-primary" />
                  Live Matches
                </h2>
                <p className="text-sm text-base-content/60">Watch ongoing games</p>
              </div>
              <button onClick={() => setGameState('menu')} className="btn btn-ghost btn-sm">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            </div>

            {liveMatches.length === 0 ? (
              <div className="text-center py-12">
                <Gamepad2 className="w-16 h-16 mx-auto mb-4 text-base-content/30" />
                <p className="text-base-content/70">No live matches at the moment</p>
                <button onClick={() => setGameState('menu')} className="btn btn-primary mt-4">Start a Game</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {liveMatches.map((match) => (
                  <div key={match._id} className="card bg-base-200 shadow-xl hover:shadow-2xl transition-all">
                    <div className="card-body p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="badge badge-success gap-1">
                          <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
                          LIVE
                        </span>
                        <span className="text-xs text-base-content/60">Move #{match.moveHistory}</span>
                      </div>
                      
                      <div className="space-y-2 mb-3">
                        {match.players.map((player) => (
                          <div key={player._id} className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded-full ${player.color === 'red' ? 'bg-red-500' : 'bg-gray-800'}`}></div>
                            <Avatar src={player.userId.profilePic} name={player.userId.fullName} size="w-6 h-6" />
                            <span className="text-sm font-medium truncate flex-1">{player.userId.fullName}</span>
                            <span className="text-xs badge badge-ghost">{player.score}</span>
                          </div>
                        ))}
                      </div>

                      <div className="card-actions">
                        <button onClick={() => handleSpectateGame(match._id)} className="btn btn-primary btn-sm w-full gap-2">
                          <Eye className="w-4 h-4" />
                          Watch Game
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {(gameState === 'playing' || gameState === 'spectating') && game && (
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="flex-1">
                <div className="card bg-base-200 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold">Players</h3>
                    {isSpectating && <span className="badge badge-info gap-1"><Eye className="w-3 h-3" /> Spectating</span>}
                  </div>
                  
                  {game.players.map((player) => {
                    const isCurrentPlayer = player.color === game.currentPlayer;
                    const isMe = player.userId._id === authUser._id;
                    return (
                      <div key={player._id} className={`flex items-center gap-3 p-3 rounded-lg mb-2 ${isCurrentPlayer ? 'bg-primary/10 ring-2 ring-primary' : 'bg-base-300'}`}>
                        <div className={`w-8 h-8 rounded-full ${player.color === 'red' ? 'bg-gradient-to-br from-red-500 to-red-700' : 'bg-gradient-to-br from-gray-800 to-black'}`}></div>
                        <Avatar src={player.userId.profilePic} name={player.userId.fullName} size="w-10 h-10" />
                        <div className="flex-1">
                          <div className="font-semibold text-sm flex items-center gap-2">
                            {player.userId.fullName}
                            {isMe && <span className="badge badge-xs">You</span>}
                          </div>
                          <div className="text-xs text-base-content/60 capitalize">{player.color} Player</div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">{player.score}</div>
                          <div className="text-xs text-base-content/60">pieces</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="text-center p-3 bg-base-200 rounded-lg">
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${game.currentPlayer === 'red' ? 'bg-red-500/20 text-red-500' : 'bg-gray-800/20 text-gray-800'}`}>
                    <Crown className="w-5 h-5" />
                    <span className="font-semibold capitalize">{game.currentPlayer}'s Turn</span>
                  </div>
                  {!isSpectating && (
                    <p className="text-xs mt-2 text-base-content/60">
                      {isMyTurn() ? "It's your turn!" : "Waiting for opponent..."}
                    </p>
                  )}
                </div>

                {game.gameType === 'arena' && game.pointsBet > 0 && (
                  <div className="text-center p-3 bg-warning/10 rounded-lg border-2 border-warning">
                    <div className="text-xs text-base-content/60 mb-1">Stakes at Risk</div>
                    <div className="text-2xl font-bold text-warning">{game.pointsBet} Scones</div>
                  </div>
                )}

                {!isSpectating && (
                  <button onClick={handleAbandon} className="btn btn-error btn-sm">
                    Abandon Game
                  </button>
                )}
                {isSpectating && (
                  <button onClick={handleNewGame} className="btn btn-ghost btn-sm">
                    Stop Watching
                  </button>
                )}
              </div>
            </div>

            <CheckersBoard
              board={game.board}
              onMove={handleMove}
              currentPlayer={game.currentPlayer}
              isMyTurn={isMyTurn()}
              gameType={game.gameType}
              disabled={isSpectating}
            />

            {/* Spectators Section */}
            {spectators.length > 0 && (
              <div className="mt-6 card bg-base-200">
                <div className="card-body py-3">
                  <h3 className="text-sm font-semibold mb-2">Spectators ({spectators.length})</h3>
                  <div className="flex flex-wrap gap-2">
                    {spectators.map(spectator => (
                      <div key={spectator.userId} className="flex items-center gap-2 bg-base-300 px-3 py-1 rounded-full">
                        <img src={spectator.profilePic} alt={spectator.userName} className="w-6 h-6 rounded-full object-cover" />
                        <span className="text-xs font-medium">{spectator.userName}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {gameState === 'finished' && game && (
          <div className="max-w-2xl mx-auto">
            <div className="card bg-base-200 shadow-xl">
              <div className="card-body text-center">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 animate-bounce">
                  <Trophy className="w-10 h-10 text-primary animate-pulse" />
                </div>
                <h2 className="card-title justify-center text-2xl mb-2">Game Over!</h2>
                {!isSpectating && (
                  <div className="mb-4">
                    <p className="text-xl font-bold mb-2 animate-bounce">
                      {(() => {
                        const myPlayer = game.players.find(p => p.userId._id === authUser._id);
                        const isWinner = myPlayer && myPlayer.color === game.winner;
                        return isWinner ? 'You Won!' : 'You Lost';
                      })()}
                    </p>
                    {game.gameType === 'arena' && game.pointsBet > 0 && (
                      <p className={`text-lg font-bold ${(() => {
                        const myPlayer = game.players.find(p => p.userId._id === authUser._id);
                        return myPlayer && myPlayer.color === game.winner ? 'text-success' : 'text-error';
                      })()}`}>
                        {(() => {
                          const myPlayer = game.players.find(p => p.userId._id === authUser._id);
                          const isWinner = myPlayer && myPlayer.color === game.winner;
                          return isWinner ? `+${game.pointsBet} Scones` : `-${game.pointsBet} Scones`;
                        })()}
                      </p>
                    )}
                  </div>
                )}
                {isSpectating && (
                  <p className="text-xl font-bold mb-4 capitalize animate-bounce">
                    {game.winner} Player Won!
                  </p>
                )}
                
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
                  <button onClick={handleNewGame} className="btn btn-primary">New Game</button>
                  <button onClick={() => onClose ? onClose() : navigate('/apps')} className="btn btn-ghost">Back to Apps</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showPlayerSelector && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <button onClick={() => setShowPlayerSelector(false)} className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-primary/20 rounded-full">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-xl">Select Opponent</h3>
                  <p className="text-sm text-base-content/70">Choose a player to challenge</p>
                </div>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-2 px-1">
              {availablePlayers.length === 0 ? (
                <div className="text-center py-8 md:py-12">
                  <Users className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 text-base-content/30" />
                  <p className="text-base-content/70 text-sm md:text-base">No contacts found</p>
                  <p className="text-xs md:text-sm text-base-content/50 mt-2">Add friends to play with them!</p>
                </div>
              ) : availablePlayers.filter(p => p.isOnline).length === 0 ? (
                <div className="text-center py-8 md:py-12">
                  <Users className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 text-base-content/30" />
                  <p className="text-base-content/70 text-sm md:text-base">No online players</p>
                  <p className="text-xs md:text-sm text-base-content/50 mt-2">
                    {availablePlayers.length} contact{availablePlayers.length !== 1 ? 's' : ''} offline
                  </p>
                </div>
              ) : (
                <>
                  {availablePlayers.filter(p => p.isOnline).map((player) => (
                    <button
                      key={player._id}
                      onClick={() => handleSelectPlayer(player)}
                      className="w-full flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl bg-base-200 hover:bg-base-300 transition-all"
                    >
                      <div className="relative">
                        <Avatar src={player.profilePic} name={player.fullName} size="w-10 h-10 md:w-12 md:h-12" />
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-base-100"></div>
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <div className="font-semibold text-sm md:text-base truncate flex items-center gap-2">
                          {player.fullName}
                          <span className="badge badge-success badge-xs">Online</span>
                        </div>
                        <div className="text-xs md:text-sm text-base-content/70 truncate">{player.email}</div>
                      </div>
                      <div className="badge badge-primary badge-sm md:badge-md">Challenge</div>
                    </button>
                  ))}
                  
                  {availablePlayers.filter(p => !p.isOnline).length > 0 && (
                    <div className="divider text-xs text-base-content/50">Offline</div>
                  )}
                  {availablePlayers.filter(p => !p.isOnline).map((player) => (
                    <div key={player._id} className="w-full flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl bg-base-200/50 opacity-60 cursor-not-allowed">
                      <Avatar src={player.profilePic} name={player.fullName} size="w-10 h-10 md:w-12 md:h-12" />
                      <div className="flex-1 text-left min-w-0">
                        <div className="font-semibold text-sm md:text-base truncate">{player.fullName}</div>
                        <div className="text-xs md:text-sm text-base-content/70 truncate">{player.email}</div>
                      </div>
                      <div className="badge badge-ghost badge-sm md:badge-md">Offline</div>
                    </div>
                  ))}
                </>
              )}
            </div>

            <div className="modal-action">
              <button onClick={() => setShowPlayerSelector(false)} className="btn btn-ghost">Cancel</button>
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
