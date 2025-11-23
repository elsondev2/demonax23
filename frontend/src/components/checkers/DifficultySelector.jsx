import { Zap, Brain, Flame, Skull } from 'lucide-react';

const DifficultySelector = ({ onSelect, onBack }) => {
  const difficulties = [
    {
      id: 'easy',
      name: 'Easy',
      description: 'Perfect for beginners',
      icon: Zap,
      points: 5,
      color: 'success'
    },
    {
      id: 'medium',
      name: 'Medium',
      description: 'A fair challenge',
      icon: Brain,
      points: 10,
      color: 'info'
    },
    {
      id: 'hard',
      name: 'Hard',
      description: 'For experienced players',
      icon: Flame,
      points: 20,
      color: 'warning'
    },
    {
      id: 'expert',
      name: 'Expert',
      description: 'Ultimate challenge',
      icon: Skull,
      points: 30,
      color: 'error'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Select Difficulty</h2>
        <p className="text-base-content/70">Choose your AI opponent's skill level</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {difficulties.map((diff) => {
          const Icon = diff.icon;
          return (
            <button
              key={diff.id}
              onClick={() => onSelect(diff.id)}
              className={`card bg-base-200 hover:bg-base-300 transition-all hover:scale-105 cursor-pointer border-2 border-transparent hover:border-${diff.color}`}
            >
              <div className="card-body items-center text-center">
                <div className={`w-16 h-16 rounded-full bg-${diff.color}/10 flex items-center justify-center mb-2`}>
                  <Icon className={`w-8 h-8 text-${diff.color}`} />
                </div>
                <h3 className="card-title text-lg">{diff.name}</h3>
                <p className="text-sm text-base-content/70 mb-2">{diff.description}</p>
                <div className="badge badge-primary">+{diff.points} points on win</div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="text-center">
        <button onClick={onBack} className="btn btn-ghost">
          Back to Mode Selection
        </button>
      </div>
    </div>
  );
};

export default DifficultySelector;
