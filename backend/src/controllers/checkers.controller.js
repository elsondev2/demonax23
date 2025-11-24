import CheckersGame from "../models/CheckersGame.js";
import CheckersProfile from "../models/CheckersProfile.js";
import User from "../models/User.js";

// Get or create user's checkers profile
export const getProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    let profile = await CheckersProfile.findOne({ userId });

    if (!profile) {
      profile = await CheckersProfile.create({ userId });
    }

    // Populate user data
    const user = await User.findById(userId).select('fullName username profilePic');

    res.status(200).json({
      ...profile.toObject(),
      user: {
        fullName: user.fullName,
        username: user.username,
        profilePic: user.profilePic
      }
    });
  } catch (error) {
    console.error("Error in getProfile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get leaderboard
export const getLeaderboard = async (req, res) => {
  try {
    const { type = "points", limit = 10 } = req.query;

    let sortField = {};
    if (type === "points") {
      sortField = { points: -1 };
    } else if (type === "wins") {
      sortField = { "stats.wins": -1 };
    } else if (type === "streak") {
      sortField = { bestStreak: -1 };
    }

    const profiles = await CheckersProfile.find()
      .sort(sortField)
      .limit(parseInt(limit))
      .populate("userId", "fullName username profilePic");

    const leaderboard = profiles.map((profile, index) => ({
      rank: index + 1,
      userId: profile.userId._id,
      fullName: profile.userId.fullName,
      username: profile.userId.username,
      profilePic: profile.userId.profilePic,
      points: profile.points,
      stats: profile.stats,
      currentStreak: profile.currentStreak,
      bestStreak: profile.bestStreak
    }));

    res.status(200).json(leaderboard);
  } catch (error) {
    console.error("Error in getLeaderboard:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Create a new game
export const createGame = async (req, res) => {
  try {
    const userId = req.user._id;
    const { gameType, difficulty, pointsBet = 0 } = req.body;

    if (!["local", "ai", "arena", "friendly"].includes(gameType)) {
      return res.status(400).json({ message: "Invalid game type" });
    }

    // For arena games, check if user has enough points
    if (gameType === "arena" && pointsBet > 0) {
      const profile = await CheckersProfile.findOne({ userId });
      if (!profile || profile.points < pointsBet) {
        return res.status(400).json({ message: "Insufficient points" });
      }
    }

    const game = await CheckersGame.create({
      players: [{
        userId,
        color: "red",
        score: 12
      }],
      gameType,
      difficulty: gameType === "ai" ? difficulty : "none",
      pointsBet: gameType === "arena" ? pointsBet : 0,
      status: gameType === "local" || gameType === "ai" ? "active" : "waiting"
    });

    await game.populate("players.userId", "fullName username profilePic");

    res.status(201).json(game);
  } catch (error) {
    console.error("Error in createGame:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Join an existing game
export const joinGame = async (req, res) => {
  try {
    const userId = req.user._id;
    const { gameId } = req.params;

    const game = await CheckersGame.findById(gameId);

    if (!game) {
      return res.status(404).json({ message: "Game not found" });
    }

    if (game.status !== "waiting") {
      return res.status(400).json({ message: "Game is not available to join" });
    }

    if (game.players.length >= 2) {
      return res.status(400).json({ message: "Game is full" });
    }

    // Check if user already in game
    if (game.players.some(p => p.userId.toString() === userId.toString())) {
      return res.status(400).json({ message: "Already in this game" });
    }

    // For arena games, check points
    if (game.gameType === "arena" && game.pointsBet > 0) {
      const profile = await CheckersProfile.findOne({ userId });
      if (!profile || profile.points < game.pointsBet) {
        return res.status(400).json({ message: "Insufficient points" });
      }
    }

    game.players.push({
      userId,
      color: "black",
      score: 12
    });
    game.status = "active";

    await game.save();
    await game.populate("players.userId", "fullName username profilePic");

    res.status(200).json(game);
  } catch (error) {
    console.error("Error in joinGame:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get active games
export const getActiveGames = async (req, res) => {
  try {
    const { gameType } = req.query;

    const query = { status: { $in: ["waiting", "active"] } };
    if (gameType) {
      query.gameType = gameType;
    }

    const games = await CheckersGame.find(query)
      .sort({ createdAt: -1 })
      .limit(20)
      .populate("players.userId", "fullName username profilePic");

    res.status(200).json(games);
  } catch (error) {
    console.error("Error in getActiveGames:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get user's games
export const getMyGames = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status = "active" } = req.query;

    const query = {
      "players.userId": userId
    };

    if (status === "active") {
      query.status = { $in: ["waiting", "active"] };
    } else if (status === "completed") {
      query.status = "completed";
    }

    const games = await CheckersGame.find(query)
      .sort({ updatedAt: -1 })
      .limit(20)
      .populate("players.userId", "fullName username profilePic");

    res.status(200).json(games);
  } catch (error) {
    console.error("Error in getMyGames:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get specific game
export const getGame = async (req, res) => {
  try {
    const { gameId } = req.params;

    const game = await CheckersGame.findById(gameId)
      .populate("players.userId", "fullName username profilePic");

    if (!game) {
      return res.status(404).json({ message: "Game not found" });
    }

    res.status(200).json(game);
  } catch (error) {
    console.error("Error in getGame:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Make a move
export const makeMove = async (req, res) => {
  try {
    const userId = req.user._id;
    const { gameId } = req.params;
    const { board, currentPlayer, scores, moveData } = req.body;

    console.log(`[makeMove] User ${userId} attempting move in game ${gameId}`);
    console.log(`[makeMove] Request body:`, { board: !!board, currentPlayer, scores, moveData: !!moveData });

    const game = await CheckersGame.findById(gameId);

    if (!game) {
      console.log(`[makeMove] Game ${gameId} not found`);
      return res.status(404).json({ message: "Game not found" });
    }

    console.log(`[makeMove] Game found. Status: ${game.status}, CurrentPlayer: ${game.currentPlayer}, GameType: ${game.gameType}`);
    console.log(`[makeMove] Game players:`, game.players.map(p => ({ userId: p.userId, color: p.color })));

    if (game.status !== "active") {
      console.log(`[makeMove] Game not active: ${game.status}`);
      return res.status(400).json({ message: `Game is not active (status: ${game.status})` });
    }

    // Verify it's the user's turn (for multiplayer games)
    if (game.gameType !== "local" && game.gameType !== "ai") {
      const player = game.players.find(p => p.userId.toString() === userId.toString());
      console.log(`[makeMove] Player found:`, !!player, player?.color);
      if (!player || player.color !== game.currentPlayer) {
        console.log(`[makeMove] Not user's turn. Player: ${player ? 'found' : 'not found'}, Player color: ${player?.color}, Current turn: ${game.currentPlayer}`);
        return res.status(400).json({ message: `Not your turn (you: ${player?.color}, current: ${game.currentPlayer})` });
      }
    }

    // Update game state
    game.board = board;
    game.currentPlayer = currentPlayer;
    game.moveHistory += 1;
    game.lastMoveAt = new Date();

    console.log(`[makeMove] Updating game. New currentPlayer: ${currentPlayer}, Board length: ${board?.length}`);

    // Update scores
    if (scores) {
      game.players.forEach((player, index) => {
        if (scores[player.color] !== undefined) {
          console.log(`[makeMove] Updating ${player.color} score: ${player.score} -> ${scores[player.color]}`);
          player.score = scores[player.color];
        }
      });
    }

    await game.save();
    console.log(`[makeMove] Game saved successfully`);
    await game.populate("players.userId", "fullName username profilePic");

    // Emit socket event for real-time update
    const { io } = await import("../lib/socket.js");
    io.to(`checkers_${gameId}`).emit("checkers:move", {
      gameId,
      board,
      currentPlayer,
      scores,
      moveData,
      movedBy: userId
    });

    res.status(200).json(game);
  } catch (error) {
    console.error("Error in makeMove:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// End game
export const endGame = async (req, res) => {
  try {
    const userId = req.user._id;
    const { gameId } = req.params;
    const { winner, isDraw = false } = req.body;

    const game = await CheckersGame.findById(gameId);

    if (!game) {
      return res.status(404).json({ message: "Game not found" });
    }

    if (game.status === "completed") {
      return res.status(400).json({ message: "Game already completed" });
    }

    game.status = "completed";
    game.winner = isDraw ? null : winner;

    await game.save();

    // Update player profiles
    for (const player of game.players) {
      let profile = await CheckersProfile.findOne({ userId: player.userId });
      
      if (!profile) {
        profile = await CheckersProfile.create({ userId: player.userId });
      }

      profile.stats.totalGames += 1;
      profile.lastGameAt = new Date();

      if (isDraw) {
        profile.stats.draws += 1;
        profile.currentStreak = 0;
      } else if (player.color === winner) {
        // Winner
        profile.stats.wins += 1;
        profile.currentStreak += 1;
        
        if (profile.currentStreak > profile.bestStreak) {
          profile.bestStreak = profile.currentStreak;
        }

        // Award points
        let pointsAwarded = 10;
        if (game.gameType === "ai") {
          pointsAwarded = { easy: 5, medium: 10, hard: 20, expert: 30 }[game.difficulty] || 10;
          profile.stats.aiWins[game.difficulty] = (profile.stats.aiWins[game.difficulty] || 0) + 1;
        } else if (game.gameType === "arena") {
          pointsAwarded = game.pointsBet * 2;
          profile.stats.arenaWins += 1;
        }
        
        profile.points += pointsAwarded;
      } else {
        // Loser
        profile.stats.losses += 1;
        profile.currentStreak = 0;

        if (game.gameType === "arena") {
          profile.stats.arenaLosses += 1;
          profile.points = Math.max(0, profile.points - game.pointsBet);
        }
      }

      // Check for achievements
      checkAchievements(profile);

      await profile.save();
    }

    await game.populate("players.userId", "fullName username profilePic");

    res.status(200).json(game);
  } catch (error) {
    console.error("Error in endGame:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Abandon game
export const abandonGame = async (req, res) => {
  try {
    const userId = req.user._id;
    const { gameId } = req.params;

    const game = await CheckersGame.findById(gameId);

    if (!game) {
      return res.status(404).json({ message: "Game not found" });
    }

    if (game.status === "completed") {
      return res.status(400).json({ message: "Game already completed" });
    }

    // Check if user is in the game
    const player = game.players.find(p => p.userId.toString() === userId.toString());
    if (!player) {
      return res.status(403).json({ message: "Not a player in this game" });
    }

    game.status = "abandoned";
    
    // If multiplayer, the other player wins
    if (game.players.length === 2) {
      const opponent = game.players.find(p => p.userId.toString() !== userId.toString());
      game.winner = opponent.color;

      // Update profiles
      const loserProfile = await CheckersProfile.findOne({ userId });
      if (loserProfile) {
        loserProfile.stats.losses += 1;
        loserProfile.stats.totalGames += 1;
        loserProfile.currentStreak = 0;
        
        if (game.gameType === "arena") {
          loserProfile.stats.arenaLosses += 1;
          loserProfile.points = Math.max(0, loserProfile.points - game.pointsBet);
        }
        
        await loserProfile.save();
      }

      const winnerProfile = await CheckersProfile.findOne({ userId: opponent.userId });
      if (winnerProfile) {
        winnerProfile.stats.wins += 1;
        winnerProfile.stats.totalGames += 1;
        winnerProfile.currentStreak += 1;
        
        if (winnerProfile.currentStreak > winnerProfile.bestStreak) {
          winnerProfile.bestStreak = winnerProfile.currentStreak;
        }

        if (game.gameType === "arena") {
          winnerProfile.stats.arenaWins += 1;
          winnerProfile.points += game.pointsBet * 2;
        } else {
          winnerProfile.points += 10;
        }

        checkAchievements(winnerProfile);
        await winnerProfile.save();
      }
    }

    await game.save();
    await game.populate("players.userId", "fullName username profilePic");

    res.status(200).json(game);
  } catch (error) {
    console.error("Error in abandonGame:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Helper function to check and award achievements
function checkAchievements(profile) {
  const achievements = [];

  // First Win
  if (profile.stats.wins === 1 && !profile.achievements.some(a => a.name === "First Victory")) {
    achievements.push({
      name: "First Victory",
      description: "Won your first game"
    });
  }

  // 10 Wins
  if (profile.stats.wins === 10 && !profile.achievements.some(a => a.name === "Veteran")) {
    achievements.push({
      name: "Veteran",
      description: "Won 10 games"
    });
  }

  // 50 Wins
  if (profile.stats.wins === 50 && !profile.achievements.some(a => a.name === "Champion")) {
    achievements.push({
      name: "Champion",
      description: "Won 50 games"
    });
  }

  // 100 Wins
  if (profile.stats.wins === 100 && !profile.achievements.some(a => a.name === "Legend")) {
    achievements.push({
      name: "Legend",
      description: "Won 100 games"
    });
  }

  // 5 Win Streak
  if (profile.currentStreak === 5 && !profile.achievements.some(a => a.name === "On Fire")) {
    achievements.push({
      name: "On Fire",
      description: "Won 5 games in a row"
    });
  }

  // 10 Win Streak
  if (profile.currentStreak === 10 && !profile.achievements.some(a => a.name === "Unstoppable")) {
    achievements.push({
      name: "Unstoppable",
      description: "Won 10 games in a row"
    });
  }

  // Beat Expert AI
  if (profile.stats.aiWins.expert > 0 && !profile.achievements.some(a => a.name === "AI Master")) {
    achievements.push({
      name: "AI Master",
      description: "Defeated Expert AI"
    });
  }

  // 1000 Points
  if (profile.points >= 1000 && !profile.achievements.some(a => a.name === "Point Collector")) {
    achievements.push({
      name: "Point Collector",
      description: "Earned 1000 points"
    });
  }

  profile.achievements.push(...achievements);
}

// Get game statistics
export const getStats = async (req, res) => {
  try {
    const totalGames = await CheckersGame.countDocuments();
    const activeGames = await CheckersGame.countDocuments({ status: { $in: ["waiting", "active"] } });
    const completedGames = await CheckersGame.countDocuments({ status: "completed" });
    const totalPlayers = await CheckersProfile.countDocuments();

    const topPlayer = await CheckersProfile.findOne().sort({ points: -1 }).populate("userId", "fullName username profilePic");

    res.status(200).json({
      totalGames,
      activeGames,
      completedGames,
      totalPlayers,
      topPlayer: topPlayer ? {
        fullName: topPlayer.userId.fullName,
        username: topPlayer.userId.username,
        profilePic: topPlayer.userId.profilePic,
        points: topPlayer.points,
        stats: topPlayer.stats
      } : null
    });
  } catch (error) {
    console.error("Error in getStats:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
