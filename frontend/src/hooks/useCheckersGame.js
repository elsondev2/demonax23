import { useState, useEffect, useCallback } from 'react';

const BOARD_SIZE = 8;

const INITIAL_BOARD = Array(BOARD_SIZE).fill(null).map((_, row) =>
    Array(BOARD_SIZE).fill(null).map((_, col) => {
        if ((row + col) % 2 === 1) {
            if (row < 3) return { player: 'black', type: 'regular' };
            if (row > 4) return { player: 'red', type: 'regular' };
        }
        return null;
    })
);

export const useCheckersGame = () => {
    const [board, setBoard] = useState(INITIAL_BOARD);
    const [turn, setTurn] = useState('red');
    const [selectedPos, setSelectedPos] = useState(null);
    const [validMoves, setValidMoves] = useState([]);
    const [winner, setWinner] = useState(null);
    const [mustJumpPos, setMustJumpPos] = useState(null); // Position that MUST jump (for double jumps)
    const [lastMove, setLastMove] = useState(null);

    // Helper to check if a position is on board
    const isValidPos = (row, col) => row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;

    // Calculate all valid moves for a player (or a specific piece if mustJumpPos is set)
    const calculateValidMoves = useCallback((currentBoard, currentPlayer, specificPiecePos = null) => {
        const moves = [];
        let canJump = false;

        const checkPieceMoves = (r, c) => {
            const piece = currentBoard[r][c];
            if (!piece || piece.player !== currentPlayer) return;

            const directions = piece.type === 'king' ? [[-1, -1], [-1, 1], [1, -1], [1, 1]] :
                currentPlayer === 'red' ? [[-1, -1], [-1, 1]] : [[1, -1], [1, 1]];

            directions.forEach(([dr, dc]) => {
                // Check jumps
                const jumpR = r + dr * 2;
                const jumpC = c + dc * 2;
                const midR = r + dr;
                const midC = c + dc;

                if (isValidPos(jumpR, jumpC)) {
                    const midPiece = currentBoard[midR][midC];
                    if (midPiece && midPiece.player !== currentPlayer && !currentBoard[jumpR][jumpC]) {
                        moves.push({
                            from: { row: r, col: c },
                            to: { row: jumpR, col: jumpC },
                            type: 'jump',
                            jumped: { row: midR, col: midC }
                        });
                        canJump = true;
                    }
                }

                // Check regular moves (only if no jumps found globally yet, but we filter later)
                if (!canJump) {
                    const moveR = r + dr;
                    const moveC = c + dc;
                    if (isValidPos(moveR, moveC) && !currentBoard[moveR][moveC]) {
                        moves.push({
                            from: { row: r, col: c },
                            to: { row: moveR, col: moveC },
                            type: 'move'
                        });
                    }
                }
            });
        };

        if (specificPiecePos) {
            checkPieceMoves(specificPiecePos.row, specificPiecePos.col);
        } else {
            for (let r = 0; r < BOARD_SIZE; r++) {
                for (let c = 0; c < BOARD_SIZE; c++) {
                    checkPieceMoves(r, c);
                }
            }
        }

        // If any jump is possible, filter out non-jumps (Forced Jump Rule)
        const jumpMoves = moves.filter(m => m.type === 'jump');
        if (jumpMoves.length > 0) {
            return jumpMoves;
        }
        return moves;
    }, []);

    // Update valid moves whenever board or turn changes
    useEffect(() => {
        if (winner) return;

        // If we are in a double-jump sequence, only calculate moves for that piece
        if (mustJumpPos) {
            const moves = calculateValidMoves(board, turn, mustJumpPos);
            if (moves.length === 0) {
                // No more jumps possible, end turn
                setMustJumpPos(null);
                setTurn(prev => prev === 'red' ? 'black' : 'red');
            } else {
                setValidMoves(moves);
                // Auto-select the piece
                setSelectedPos(mustJumpPos);
            }
        } else {
            const moves = calculateValidMoves(board, turn);
            setValidMoves(moves);

            // Check for no moves -> loss
            if (moves.length === 0) {
                setWinner(turn === 'red' ? 'black' : 'red');
            }
        }
    }, [board, turn, mustJumpPos, calculateValidMoves, winner]);

    const executeMove = (move) => {
        const newBoard = board.map(row => [...row]);
        const piece = newBoard[move.from.row][move.from.col];

        // Move piece
        newBoard[move.to.row][move.to.col] = piece;
        newBoard[move.from.row][move.from.col] = null;

        // Handle capture
        if (move.type === 'jump') {
            newBoard[move.jumped.row][move.jumped.col] = null;
        }

        // Handle King Promotion
        let promoted = false;
        if (piece.type === 'regular') {
            if ((piece.player === 'red' && move.to.row === 0) ||
                (piece.player === 'black' && move.to.row === 7)) {
                piece.type = 'king';
                promoted = true;
            }
        }

        setBoard(newBoard);
        setLastMove(move);
        setSelectedPos(null);

        // Handle Turn Switching / Double Jumps
        if (move.type === 'jump' && !promoted) {
            // Check if another jump is available for the SAME piece
            const subsequentMoves = calculateValidMoves(newBoard, turn, move.to);
            const hasMoreJumps = subsequentMoves.some(m => m.type === 'jump');

            if (hasMoreJumps) {
                setMustJumpPos(move.to);
                // Turn stays same
                return;
            }
        }

        // End turn
        setMustJumpPos(null);
        setTurn(prev => prev === 'red' ? 'black' : 'red');
    };

    const handleSquareClick = (row, col) => {
        if (winner) return;

        const clickedPiece = board[row][col];
        const isCurrentPlayerPiece = clickedPiece?.player === turn;

        // If clicking own piece (and not locked into a double jump)
        if (isCurrentPlayerPiece && !mustJumpPos) {
            setSelectedPos({ row, col });
            return;
        }

        // If clicking a valid move destination
        if (selectedPos) {
            const move = validMoves.find(m =>
                m.from.row === selectedPos.row && m.from.col === selectedPos.col &&
                m.to.row === row && m.to.col === col
            );

            if (move) {
                executeMove(move);
            } else if (!mustJumpPos) {
                // Deselect if clicking invalid empty square
                setSelectedPos(null);
            }
        }
    };

    // For external control (e.g. from socket)
    const applyRemoteMove = (newBoard, nextPlayer) => {
        setBoard(newBoard);
        setTurn(nextPlayer);
        setMustJumpPos(null);
        setSelectedPos(null);
        // Recalculate winner based on new board? 
        // Usually backend handles win, but we can double check locally if needed.
    };

    return {
        board,
        turn,
        selectedPos,
        validMoves,
        winner,
        lastMove,
        handleSquareClick,
        applyRemoteMove
    };
};
