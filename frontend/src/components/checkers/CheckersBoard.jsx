import { useState, useEffect } from 'react';
import { Eye } from 'lucide-react';

const CheckersBoard = ({ board, onMove, currentPlayer, isMyTurn, gameType, disabled = false }) => {
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [animatingPiece, setAnimatingPiece] = useState(null);

  useEffect(() => {
    if (selectedPiece) {
      const moves = getValidMoves(selectedPiece.row, selectedPiece.col);
      setValidMoves(moves);
    } else {
      setValidMoves([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPiece, board]);

  const getValidMoves = (row, col) => {
    const piece = board[row][col];
    if (!piece || piece.player !== currentPlayer) return [];

    const moves = [];
    const direction = piece.player === 'red' ? -1 : 1;
    const isKing = piece.type === 'king';

    // Regular moves
    const checkMove = (newRow, newCol) => {
      if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
        if (!board[newRow][newCol]) {
          moves.push({ row: newRow, col: newCol, type: 'move' });
        }
      }
    };

    // Check forward moves
    checkMove(row + direction, col - 1);
    checkMove(row + direction, col + 1);

    // Kings can move backward
    if (isKing) {
      checkMove(row - direction, col - 1);
      checkMove(row - direction, col + 1);
    }

    // Check for jumps
    const checkJump = (newRow, newCol, jumpRow, jumpCol) => {
      if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
        const jumpedPiece = board[jumpRow][jumpCol];
        if (jumpedPiece && jumpedPiece.player !== piece.player && !board[newRow][newCol]) {
          moves.push({ row: newRow, col: newCol, type: 'jump', jumpedRow: jumpRow, jumpedCol: jumpCol });
        }
      }
    };

    // Forward jumps
    checkJump(row + direction * 2, col - 2, row + direction, col - 1);
    checkJump(row + direction * 2, col + 2, row + direction, col + 1);

    // Backward jumps for kings
    if (isKing) {
      checkJump(row - direction * 2, col - 2, row - direction, col - 1);
      checkJump(row - direction * 2, col + 2, row - direction, col + 1);
    }

    return moves;
  };

  const handleSquareClick = (row, col) => {
    if (disabled) return;
    if (!isMyTurn && gameType !== 'local' && gameType !== 'ai') return;

    const piece = board[row][col];

    // If clicking on own piece, select it
    if (piece && piece.player === currentPlayer) {
      setSelectedPiece({ row, col });
      return;
    }

    // If a piece is selected and clicking on valid move
    if (selectedPiece) {
      const move = validMoves.find(m => m.row === row && m.col === col);
      if (move) {
        // Animate the move
        setAnimatingPiece({ from: selectedPiece, to: { row, col } });
        setTimeout(() => {
          makeMove(move);
          setAnimatingPiece(null);
        }, 300);
      }
      setSelectedPiece(null);
    }
  };

  const makeMove = (move) => {
    const newBoard = board.map(row => row.map(cell => cell ? { ...cell } : null));
    const piece = newBoard[selectedPiece.row][selectedPiece.col];

    // Move piece
    newBoard[move.row][move.col] = piece;
    newBoard[selectedPiece.row][selectedPiece.col] = null;

    // Remove jumped piece
    if (move.type === 'jump') {
      newBoard[move.jumpedRow][move.jumpedCol] = null;
    }

    // Promote to king
    if ((piece.player === 'red' && move.row === 0) || (piece.player === 'black' && move.row === 7)) {
      newBoard[move.row][move.col].type = 'king';
    }

    // Calculate scores
    const scores = {
      red: newBoard.flat().filter(p => p && p.player === 'red').length,
      black: newBoard.flat().filter(p => p && p.player === 'black').length
    };

    // Switch player
    const nextPlayer = currentPlayer === 'red' ? 'black' : 'red';

    onMove(newBoard, nextPlayer, scores);
  };

  const isValidMove = (row, col) => {
    return validMoves.some(m => m.row === row && m.col === col);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="aspect-square w-full bg-base-300 rounded-lg overflow-hidden shadow-2xl relative">
        <div className="grid grid-cols-8 h-full">
          {board.map((row, rowIndex) =>
            row.map((cell, colIndex) => {
              const isLight = (rowIndex + colIndex) % 2 === 0;
              const isSelected = selectedPiece?.row === rowIndex && selectedPiece?.col === colIndex;
              const isValid = isValidMove(rowIndex, colIndex);
              const isFromSquare = animatingPiece?.from.row === rowIndex && animatingPiece?.from.col === colIndex;
              const isToSquare = animatingPiece?.to.row === rowIndex && animatingPiece?.to.col === colIndex;

              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  onClick={() => handleSquareClick(rowIndex, colIndex)}
                  className={`
                    relative flex items-center justify-center transition-all duration-200 overflow-hidden
                    ${isLight ? 'bg-amber-100' : 'bg-amber-800'}
                    ${isSelected ? 'border-4 border-primary' : ''}
                    ${isValid ? 'shadow-inset shadow-success' : ''}
                    ${disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:brightness-110'}
                  `}
                >
                  {cell && !isFromSquare && (
                    <div
                      className={`
                        w-[70%] h-[70%] rounded-full flex items-center justify-center
                        shadow-lg transition-all duration-200
                        ${cell.player === 'red' ? 'bg-gradient-to-br from-red-500 to-red-700' : 'bg-gradient-to-br from-gray-800 to-black'}
                        ${cell.type === 'king' ? 'ring-4 ring-yellow-400' : ''}
                        ${!disabled && 'hover:scale-110'}
                        animate-[fadeIn_0.3s_ease-in]
                      `}
                    >
                      {cell.type === 'king' && (
                        <span className="text-yellow-400 text-xl md:text-2xl font-bold">♔</span>
                      )}
                    </div>
                  )}
                  {isToSquare && animatingPiece && (
                    <div
                      className={`
                        w-[70%] h-[70%] rounded-full flex items-center justify-center
                        shadow-lg
                        ${board[animatingPiece.from.row][animatingPiece.from.col]?.player === 'red' ? 'bg-gradient-to-br from-red-500 to-red-700' : 'bg-gradient-to-br from-gray-800 to-black'}
                        ${board[animatingPiece.from.row][animatingPiece.from.col]?.type === 'king' ? 'ring-4 ring-yellow-400' : ''}
                        animate-[slideIn_0.4s_cubic-bezier(0.34,1.56,0.64,1)]
                      `}
                    >
                      {board[animatingPiece.from.row][animatingPiece.from.col]?.type === 'king' && (
                        <span className="text-yellow-400 text-xl md:text-2xl font-bold">♔</span>
                      )}
                    </div>
                  )}
                  {isValid && !cell && (
                    <div className="w-3 h-3 md:w-4 md:h-4 rounded-full bg-success opacity-70 animate-pulse"></div>
                  )}
                </div>
              );
            })
          )}
        </div>
        
        {/* Spectator overlay */}
        {disabled && (
          <div className="absolute inset-0 bg-black/10 pointer-events-none flex items-center justify-center">
            <div className="bg-base-200/90 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
              <Eye size={16} /> Spectating
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckersBoard;
