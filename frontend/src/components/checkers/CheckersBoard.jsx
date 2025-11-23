import { useState, useEffect } from 'react';

const CheckersBoard = ({ board, onMove, currentPlayer, isMyTurn, gameType }) => {
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [validMoves, setValidMoves] = useState([]);

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
        makeMove(move);
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
      <div className="aspect-square w-full bg-base-300 rounded-lg overflow-hidden shadow-2xl">
        <div className="grid grid-cols-8 h-full">
          {board.map((row, rowIndex) =>
            row.map((cell, colIndex) => {
              const isLight = (rowIndex + colIndex) % 2 === 0;
              const isSelected = selectedPiece?.row === rowIndex && selectedPiece?.col === colIndex;
              const isValid = isValidMove(rowIndex, colIndex);

              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  onClick={() => handleSquareClick(rowIndex, colIndex)}
                  className={`
                    relative flex items-center justify-center cursor-pointer transition-all
                    ${isLight ? 'bg-amber-100' : 'bg-amber-800'}
                    ${isSelected ? 'ring-4 ring-primary ring-inset' : ''}
                    ${isValid ? 'ring-4 ring-success ring-inset animate-pulse' : ''}
                    hover:brightness-110
                  `}
                >
                  {cell && (
                    <div
                      className={`
                        w-[70%] h-[70%] rounded-full flex items-center justify-center
                        shadow-lg transition-transform hover:scale-110
                        ${cell.player === 'red' ? 'bg-gradient-to-br from-red-500 to-red-700' : 'bg-gradient-to-br from-gray-800 to-black'}
                        ${cell.type === 'king' ? 'ring-4 ring-yellow-400' : ''}
                      `}
                    >
                      {cell.type === 'king' && (
                        <span className="text-yellow-400 text-2xl font-bold">♔</span>
                      )}
                    </div>
                  )}
                  {isValid && !cell && (
                    <div className="w-4 h-4 rounded-full bg-success opacity-50"></div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckersBoard;
