import { Users, Bot, Trophy, UserPlus } from 'lucide-react';

const GameModeSelector = ({ onSelectMode }) => {
  const modes = [
    {
      id: 'local',
      name: 'Local Game',
      description: 'Play with a friend on the same device',
      icon: Users,
      color: 'primary'
    },
    {
      id: 'ai',
      name: 'vs AI',
      description: 'Challenge the computer',
      icon: Bot,
      color: 'secondary'
    },
    {
      id: 'arena',
      name: 'Arena',
      description: 'Compete for points',
      icon: Trophy,
      color: 'accent'
    },
    {
      id: 'friendly',
      name: 'Friendly Match',
      description: 'Play with online friends',
      icon: UserPlus,
      color: 'info'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
      {modes.map((mode) => {
        const Icon = mode.icon;
        return (
          <button
            key={mode.id}
            onClick={() => onSelectMode(mode.id)}
            className={`card bg-base-200 hover:bg-base-300 transition-all hover:scale-105 cursor-pointer border-2 border-transparent hover:border-${mode.color}`}
          >
            <div className="card-body items-center text-center">
              <div className={`w-16 h-16 rounded-full bg-${mode.color}/10 flex items-center justify-center mb-2`}>
                <Icon className={`w-8 h-8 text-${mode.color}`} />
              </div>
              <h3 className="card-title text-lg">{mode.name}</h3>
              <p className="text-sm text-base-content/70">{mode.description}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default GameModeSelector;
