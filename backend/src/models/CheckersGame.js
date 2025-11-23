import mongoose from "mongoose";

const checkersGameSchema = new mongoose.Schema(
  {
    players: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
      },
      color: {
        type: String,
        enum: ["red", "black"],
        required: true
      },
      score: {
        type: Number,
        default: 12
      }
    }],
    gameType: {
      type: String,
      enum: ["local", "ai", "arena", "friendly"],
      required: true
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard", "expert", "none"],
      default: "none"
    },
    status: {
      type: String,
      enum: ["waiting", "active", "completed", "abandoned"],
      default: "waiting"
    },
    currentPlayer: {
      type: String,
      enum: ["red", "black"],
      default: "red"
    },
    board: {
      type: [[Object]],
      default: () => {
        const board = Array(8).fill(null).map(() => Array(8).fill(null));
        // Initialize black pieces (top)
        for (let row = 0; row < 3; row++) {
          for (let col = 0; col < 8; col++) {
            if ((row + col) % 2 === 1) {
              board[row][col] = { player: "black", type: "regular" };
            }
          }
        }
        // Initialize red pieces (bottom)
        for (let row = 5; row < 8; row++) {
          for (let col = 0; col < 8; col++) {
            if ((row + col) % 2 === 1) {
              board[row][col] = { player: "red", type: "regular" };
            }
          }
        }
        return board;
      }
    },
    winner: {
      type: String,
      enum: ["red", "black", null],
      default: null
    },
    pointsBet: {
      type: Number,
      default: 0
    },
    moveHistory: {
      type: Number,
      default: 0
    },
    lastMoveAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

const CheckersGame = mongoose.model("CheckersGame", checkersGameSchema);

export default CheckersGame;
