import { Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CheckersBoard = ({
  board,
  validMoves = [],
  selectedPos,
  lastMove,
  onSquareClick,
  isMyTurn,
  disabled = false,
  playerColor // 'red' or 'black' (the user's color)
}) => {

  const getSquareStatus = (row, col) => {
    const isSelected = selectedPos?.row === row && selectedPos?.col === col;
    const isValid = validMoves.some(m => m.to.row === row && m.to.col === col);
    const isLastMoveFrom = lastMove?.from.row === row && lastMove?.from.col === col;
    const isLastMoveTo = lastMove?.to.row === row && lastMove?.to.col === col;
    return { isSelected, isValid, isLastMoveFrom, isLastMoveTo };
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <div className="relative aspect-square w-full bg-[#2e2e2e] rounded-lg shadow-2xl border-8 border-[#3e3e3e] overflow-hidden">
        <div className="grid grid-cols-8 h-full w-full">
          {board.map((row, rowIndex) =>
            row.map((cell, colIndex) => {
              const isDark = (rowIndex + colIndex) % 2 === 1;
              const { isSelected, isValid, isLastMoveFrom, isLastMoveTo } = getSquareStatus(rowIndex, colIndex);

              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  onClick={() => onSquareClick(rowIndex, colIndex)}
                  className={`
                    relative flex items-center justify-center
                    ${isDark ? 'bg-[#769656]' : 'bg-[#eeeed2]'}
                    ${isSelected ? 'ring-inset ring-4 ring-yellow-400' : ''}
                    ${isLastMoveFrom || isLastMoveTo ? 'bg-opacity-80 bg-yellow-200/50' : ''}
                    ${isValid ? 'cursor-pointer' : ''}
                    ${!isDark ? 'pointer-events-none' : ''} 
                  `}
                >
                  {/* Valid Move Indicator */}
                  {isValid && (
                    <div className="absolute w-4 h-4 rounded-full bg-green-500/50 z-10 animate-pulse" />
                  )}

                  {/* Piece */}
                  <AnimatePresence mode='popLayout'>
                    {cell && (
                      <motion.div
                        layoutId={`piece-${rowIndex}-${colIndex}`} // This might need a stable ID if pieces move, but for now simple layout animation
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className={`
                          w-[80%] h-[80%] rounded-full shadow-[0_4px_6px_rgba(0,0,0,0.4),inset_0_-4px_4px_rgba(0,0,0,0.2),inset_0_4px_4px_rgba(255,255,255,0.3)]
                          flex items-center justify-center relative z-20
                          ${cell.player === 'red'
                            ? 'bg-gradient-to-br from-red-500 to-red-700 border-2 border-red-800'
                            : 'bg-gradient-to-br from-slate-700 to-black border-2 border-black'}
                          ${cell.type === 'king' ? 'ring-2 ring-yellow-400' : ''}
                          ${!disabled && isMyTurn && cell.player === playerColor ? 'hover:scale-105 cursor-pointer' : ''}
                        `}
                      >
                        {/* Inner detail for 3D effect */}
                        <div className="w-[70%] h-[70%] rounded-full border-2 border-white/10" />

                        {cell.type === 'king' && (
                          <motion.span
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            className="absolute text-yellow-400 text-2xl font-bold drop-shadow-md"
                          >
                            ♔
                          </motion.span>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Coordinate labels (optional, for aesthetics) */}
                  {colIndex === 0 && isDark && (
                    <span className="absolute left-0.5 top-0.5 text-[10px] font-bold opacity-50 text-white mix-blend-difference">
                      {8 - rowIndex}
                    </span>
                  )}
                  {rowIndex === 7 && isDark && (
                    <span className="absolute right-0.5 bottom-0 text-[10px] font-bold opacity-50 text-white mix-blend-difference">
                      {String.fromCharCode(97 + colIndex)}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Spectator Overlay */}
        {disabled && (
          <div className="absolute inset-0 bg-black/20 pointer-events-none flex items-center justify-center z-30">
            <div className="bg-black/60 backdrop-blur-sm px-6 py-3 rounded-full text-white font-semibold flex items-center gap-3 shadow-xl border border-white/10">
              <Eye size={20} /> Spectating Mode
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckersBoard;
