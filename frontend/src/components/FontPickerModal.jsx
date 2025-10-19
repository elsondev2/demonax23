import { useState } from 'react';
import { X, Search } from 'lucide-react';
import IOSModal from './IOSModal';
import { ALL_FONTS, FONT_CATEGORIES } from '../constants/captionStyles';

export default function FontPickerModal({ isOpen, onClose, onSelect, currentFontId }) {
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredFonts = ALL_FONTS.filter(font => {
        const matchesCategory = selectedCategory === 'all' || font.category === selectedCategory;
        const matchesSearch = font.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const handleSelect = (fontId) => {
        onSelect(fontId);
        onClose();
    };

    return (
        <IOSModal isOpen={isOpen} onClose={onClose} title="Choose Font">
            <div className="flex flex-col h-full">
                {/* Search Bar */}
                <div className="p-4 border-b border-base-300">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
                        <input
                            type="text"
                            placeholder="Search fonts..."
                            className="input input-bordered w-full pl-10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Category Tabs */}
                <div className="flex gap-2 p-3 overflow-x-auto border-b border-base-300">
                    {FONT_CATEGORIES.map(category => (
                        <button
                            key={category.id}
                            className={`btn btn-sm whitespace-nowrap ${selectedCategory === category.id ? 'btn-primary' : 'btn-ghost'
                                }`}
                            onClick={() => setSelectedCategory(category.id)}
                        >
                            <span className="mr-1">{category.icon}</span>
                            {category.name}
                        </button>
                    ))}
                </div>

                {/* Font List */}
                <div className="flex-1 overflow-y-auto p-4">
                    <div className="space-y-2">
                        {filteredFonts.map(font => (
                            <button
                                key={font.id}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${currentFontId === font.id
                                    ? 'border-primary bg-primary/10'
                                    : 'border-base-300 hover:border-base-content/30'
                                    }`}
                                style={{ fontFamily: font.family }}
                                onClick={() => handleSelect(font.id)}
                            >
                                <div className="text-lg font-medium">{font.name}</div>
                                <div className="text-sm text-base-content/60 mt-1">
                                    The quick brown fox jumps
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </IOSModal>
    );
}
