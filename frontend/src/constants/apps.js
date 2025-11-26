import { Music, Youtube, MessageSquare, Gamepad2, Piano } from 'lucide-react';

// Template apps - ready for integration
export const TEMPLATE_APPS = [
    {
        id: 'checkers',
        name: 'Checkers Game',
        icon: Gamepad2,
        description: 'Play multiplayer checkers',
        status: 'active',
        url: '/games/checkers',
        category: 'Games'
    },
    {
        id: 'piano',
        name: 'Piano Room',
        icon: Piano,
        description: 'Play piano & stream live',
        status: 'active',
        url: '/piano',
        category: 'Music'
    },
    {
        id: 'spotify',
        name: 'Spotify',
        icon: Music,
        description: 'Listen to music together',
        status: 'coming-soon',
        url: null,
        category: 'Entertainment'
    },
    {
        id: 'youtube',
        name: 'YouTube',
        icon: Youtube,
        description: 'Watch videos together',
        status: 'coming-soon',
        url: null,
        category: 'Entertainment'
    },
    {
        id: 'discord',
        name: 'Discord',
        icon: MessageSquare,
        description: 'Voice chat integration',
        status: 'coming-soon',
        url: null,
        category: 'Communication'
    }
];