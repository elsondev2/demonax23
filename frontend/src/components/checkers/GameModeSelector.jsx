import { Users, Bot, Trophy, UserPlus } from 'lucide-react';

const GameModeSelector = ({ onSelectMode }) => {
  const modes = [
    {
      id: 'local',
      name: 'Local Game',
      description: 'Play with a friend on the same device',
      icon: Users,
      gradient: 'from-primary to-primary/70',
      iconBg: 'bg-primary/20',
      iconColor: 'text-primary'
    },
    {
      id: 'ai',
      name: 'vs AI',
      description: 'Challenge the computer',
      icon: Bot,
      gradient: 'from-secondary to-secondary/70',
      iconBg: 'bg-secondary/20',
      iconColor: 'text-secondary'
    },
    {
      id: 'arena',
      name: 'Arena',
      description: 'Compete for points',
      icon: Trophy,
      gradient: 'from-accent to-accent/70',
      iconBg: 'bg-accent/20',
      iconColor: 'text-accent'
    },
    {
      id: 'friendly',
      name: 'Friendly Match',
      description: 'Play with online friends',
      icon: UserPlus,
      gradient: 'from-info to-info/70',
      iconBg: 'bg-info/20',
      iconColor: 'text-info'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 max-w-4xl mx-auto">
      {modes.map((mode) => {
        const Icon = mode.icon;
        return (
          <button
            key={mode.id}
            onClick={() => onSelectMode(mode.id)}
            className="group card bg-gradient-to-br from-base-200 to-base-300 hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 border-base-300 hover:border-primary/50 overflow-hidden"
          >
            <div className="card-body items-center text-center p-6 md:p-8">
              <div className={`w-20 h-20 rounded-2xl ${mode.iconBg} flex items-center justify-center mb-4 transition-colors duration-300`}>
                <Icon className={`w-10 h-10 ${mode.iconColor}`} />
              </div>
              <h3 className="card-title text-xl mb-2">{mode.name}</h3>
              <p className="text-sm text-base-content/70">{mode.description}</p>
              <div className="mt-4">
                <div className={`badge badge-lg bg-gradient-to-r ${mode.gradient} text-white border-none`}>
                  Play Now
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default GameModeSelector;
