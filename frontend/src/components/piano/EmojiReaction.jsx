import { useEffect, useState } from 'react';

const EmojiReaction = ({ emoji }) => {
  const [style, setStyle] = useState({});

  useEffect(() => {
    // Random horizontal position
    const left = Math.random() * 80 + 10; // 10% to 90%
    const duration = 2.5 + Math.random() * 0.5; // 2.5s to 3s

    setStyle({
      left: `${left}%`,
      animation: `float-up ${duration}s ease-out forwards`,
    });
  }, []);

  return (
    <div
      className="absolute bottom-0 text-4xl pointer-events-none"
      style={style}
    >
      {emoji}
      <style jsx>{`
        @keyframes float-up {
          0% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(-400px) scale(1.5);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default EmojiReaction;
