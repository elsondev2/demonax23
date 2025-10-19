import { useState, useEffect, useRef } from 'react';
import { Type, Palette, AlignLeft, AlignCenter, AlignRight, Shapes, Sparkles, MoreHorizontal, Bold, Italic, Underline, AlignVerticalJustifyStart, AlignVerticalJustifyCenter, AlignVerticalJustifyEnd, Circle, Square, Minus, X } from 'lucide-react';
import { BACKGROUND_PRESETS, FONTS, ALL_FONTS, TEXT_COLORS, SHAPE_TYPES, TEXT_ALIGNMENTS, VERTICAL_ALIGNMENTS, TEXT_SIZES, DEFAULT_SETTINGS } from '../constants/captionStyles';
import { generatePreviewImage } from '../utils/captionImageGenerator';
import CustomBackgroundModal from './CustomBackgroundModal';
import FontPickerModal from './FontPickerModal';

export default function CaptionImageEditor({ initialText = '', onGenerate, onCancel }) {
    const [text, setText] = useState(initialText);
    const [backgroundId, setBackgroundId] = useState(DEFAULT_SETTINGS.background);
    const [fontId, setFontId] = useState(DEFAULT_SETTINGS.font);
    const [textColorId, setTextColorId] = useState(DEFAULT_SETTINGS.textColor);
    const [alignment, setAlignment] = useState(DEFAULT_SETTINGS.alignment);
    const [shapesId, setShapesId] = useState(DEFAULT_SETTINGS.shapes);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [activeSection, setActiveSection] = useState('text'); // 'text' | 'style'
    const [customTextColor, setCustomTextColor] = useState('#10b981');
    const [customBgColor] = useState('#10b981');
    const [customBgData, setCustomBgData] = useState(null); // Stores full custom background data
    const [showCustomBgModal, setShowCustomBgModal] = useState(false);
    const [showFontPicker, setShowFontPicker] = useState(false);
    const [fontPickerForLine, setFontPickerForLine] = useState(null); // null = global, number = line index
    const [lineStyles, setLineStyles] = useState([]); // Per-line styling
    const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);

    // Advanced text styling
    const [textSize, setTextSize] = useState(DEFAULT_SETTINGS.textSize);
    const [bold, setBold] = useState(DEFAULT_SETTINGS.bold);
    const [italic, setItalic] = useState(DEFAULT_SETTINGS.italic);
    const [underline, setUnderline] = useState(DEFAULT_SETTINGS.underline);
    const [stroke, setStroke] = useState(DEFAULT_SETTINGS.stroke);
    const [strokeWidth, setStrokeWidth] = useState(DEFAULT_SETTINGS.strokeWidth);
    const [strokeColor, setStrokeColor] = useState(DEFAULT_SETTINGS.strokeColor);
    const [letterSpacing, setLetterSpacing] = useState(DEFAULT_SETTINGS.letterSpacing);
    const [lineSpacing, setLineSpacing] = useState(DEFAULT_SETTINGS.lineSpacing);
    const [verticalAlignment, setVerticalAlignment] = useState(DEFAULT_SETTINGS.verticalAlignment);

    const previewTimeoutRef = useRef(null);

    // Generate preview when settings change
    useEffect(() => {
        if (!text.trim()) {
            setPreviewUrl(null);
            return;
        }

        // Debounce preview generation
        if (previewTimeoutRef.current) {
            clearTimeout(previewTimeoutRef.current);
        }

        previewTimeoutRef.current = setTimeout(async () => {
            setIsGeneratingPreview(true);
            try {
                const blob = await generatePreviewImage({
                    text,
                    backgroundId,
                    fontId,
                    textColorId,
                    alignment,
                    shapesId,
                    customTextColor,
                    customBgColor,
                    customBgData,
                    lineStyles,
                    textSize,
                    bold,
                    italic,
                    underline,
                    stroke,
                    strokeWidth,
                    strokeColor,
                    letterSpacing,
                    lineSpacing,
                    verticalAlignment,
                });
                const url = URL.createObjectURL(blob);
                setPreviewUrl(url);
                setIsGeneratingPreview(false);
            } catch (error) {
                console.error('Failed to generate preview:', error);
                setIsGeneratingPreview(false);
            }
        }, 100);

        return () => {
            if (previewTimeoutRef.current) {
                clearTimeout(previewTimeoutRef.current);
            }
        };
    }, [text, backgroundId, fontId, textColorId, alignment, shapesId, customTextColor, customBgColor, customBgData, lineStyles, textSize, bold, italic, underline, stroke, strokeWidth, strokeColor, letterSpacing, lineSpacing, verticalAlignment]);

    const handleGenerate = async () => {
        if (!text.trim()) return;
        setIsGenerating(true);
        try {
            await onGenerate({
                text,
                backgroundId,
                fontId,
                textColorId,
                alignment,
                shapesId,
                customTextColor,
                customBgColor,
                customBgData,
                lineStyles,
                textSize,
                bold,
                italic,
                underline,
                stroke,
                strokeWidth,
                strokeColor,
                letterSpacing,
                lineSpacing,
                verticalAlignment,
            });
        } catch (error) {
            console.error('Failed to generate image:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const getAlignmentIcon = (alignId) => {
        if (alignId === 'left') return <AlignLeft className="w-4 h-4" />;
        if (alignId === 'right') return <AlignRight className="w-4 h-4" />;
        return <AlignCenter className="w-4 h-4" />;
    };

    const getVerticalAlignmentIcon = (alignId) => {
        if (alignId === 'top') return <AlignVerticalJustifyStart className="w-4 h-4" />;
        if (alignId === 'bottom') return <AlignVerticalJustifyEnd className="w-4 h-4" />;
        return <AlignVerticalJustifyCenter className="w-4 h-4" />;
    };

    const getShapeIcon = (shapeId) => {
        if (shapeId === 'circles') return <Circle className="w-4 h-4" />;
        if (shapeId === 'squares') return <Square className="w-4 h-4" />;
        if (shapeId === 'lines') return <Minus className="w-4 h-4" />;
        return <X className="w-4 h-4" />;
    };

    return (
        <>
            <div className="flex flex-col md:flex-row h-full max-h-[75vh] md:max-h-[70vh]">
                {/* Left Side - Preview */}
                <div className="flex-shrink-0 bg-base-200 p-3 md:p-4 flex flex-col md:flex-1 md:justify-center">
                    <div className="flex items-center justify-center">
                        <div className="w-full max-w-[240px] md:max-w-[320px] aspect-square bg-base-300 rounded-xl overflow-hidden shadow-lg relative">
                            {isGeneratingPreview && (
                                <div className="absolute inset-0 bg-base-300/50 backdrop-blur-sm flex items-center justify-center z-10">
                                    <span className="loading loading-spinner loading-md text-primary"></span>
                                </div>
                            )}
                            {previewUrl ? (
                                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-base-content/40 p-4">
                                    <Sparkles className="w-10 h-10 md:w-12 md:h-12 mb-2" />
                                    {!text.trim() ? (
                                        <p className="text-center text-xs">Type your caption to see the magic :-)</p>
                                    ) : !fontId ? (
                                        <p className="text-center text-xs">Please select a font style</p>
                                    ) : (
                                        <p className="text-center text-xs">Generating preview...</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="mt-2 flex items-center justify-center gap-2 text-xs text-base-content/60">
                        <span>{text.length}/200</span>
                        <span>•</span>
                        <span className="hidden sm:inline">1080x1080px</span>
                    </div>
                </div>

                {/* Right Side - Controls */}
                <div className="w-full md:w-72 bg-base-100 flex flex-col min-h-0" style={{ contain: 'layout style paint' }}>
                    {/* Tab Switcher */}
                    <div className="flex border-b border-base-300">
                        <button
                            className={`flex-1 py-3 px-4 font-medium transition-colors ${activeSection === 'text'
                                ? 'text-primary border-b-2 border-primary'
                                : 'text-base-content/60 hover:text-base-content'
                                }`}
                            onClick={() => setActiveSection('text')}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <Type className="w-4 h-4" />
                                <span>Text</span>
                            </div>
                        </button>
                        <button
                            className={`flex-1 py-3 px-4 font-medium transition-colors ${activeSection === 'style'
                                ? 'text-primary border-b-2 border-primary'
                                : 'text-base-content/60 hover:text-base-content'
                                }`}
                            onClick={() => setActiveSection('style')}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <Palette className="w-4 h-4" />
                                <span>Style</span>
                            </div>
                        </button>
                    </div>

                    {/* Content Area */}
                    <div 
                        className="flex-1 overflow-y-auto overscroll-contain p-3 space-y-3" 
                        style={{ 
                            WebkitOverflowScrolling: 'touch',
                            scrollBehavior: 'smooth',
                            willChange: 'scroll-position'
                        }}
                    >
                        {activeSection === 'text' ? (
                            <>
                                {/* Text Input */}
                                <div>
                                    <label className="label">
                                        <span className="label-text font-semibold">Your Message</span>
                                        <span className="label-text-alt text-base-content/60">{text.length}/200</span>
                                    </label>
                                    <textarea
                                        className="textarea textarea-bordered w-full h-24 resize-none focus:outline-none focus:ring-2 focus:ring-primary text-sm placeholder:text-base placeholder:text-base-content/40"
                                        placeholder="Add a caption..."
                                        value={text}
                                        onChange={(e) => setText(e.target.value.slice(0, 200))}
                                        maxLength={200}
                                        autoFocus
                                    />
                                    <p className="text-xs text-base-content/60 mt-1">
                                        💡 Press Enter for multiple lines
                                    </p>
                                </div>

                                {/* Font Selection */}
                                <div>
                                    <label className="label">
                                        <span className="label-text font-semibold flex items-center gap-2">
                                            <Type className="w-4 h-4" />
                                            Font Style
                                        </span>
                                    </label>
                                    <div className="grid grid-cols-1 gap-2">
                                        {FONTS.map((font) => (
                                            <button
                                                key={font.id}
                                                className={`btn btn-sm justify-start ${fontId === font.id ? 'btn-primary' : 'btn-ghost'
                                                    }`}
                                                style={{ fontFamily: font.family }}
                                                onClick={() => setFontId(font.id)}
                                            >
                                                {font.name}
                                            </button>
                                        ))}
                                        <button
                                            className="btn btn-sm btn-outline gap-2"
                                            onClick={() => {
                                                setFontPickerForLine(null);
                                                setShowFontPicker(true);
                                            }}
                                        >
                                            <MoreHorizontal className="w-4 h-4" />
                                            More Fonts (30)
                                        </button>
                                    </div>
                                </div>

                                {/* Text Alignment */}
                                <div>
                                    <label className="label">
                                        <span className="label-text font-semibold">Horizontal Align</span>
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {TEXT_ALIGNMENTS.map((align) => (
                                            <button
                                                key={align.id}
                                                className={`btn btn-sm ${alignment === align.id ? 'btn-primary' : 'btn-ghost'}`}
                                                onClick={() => setAlignment(align.id)}
                                                title={align.name}
                                            >
                                                {getAlignmentIcon(align.id)}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Vertical Alignment */}
                                <div>
                                    <label className="label">
                                        <span className="label-text font-semibold">Vertical Position</span>
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {VERTICAL_ALIGNMENTS.map((align) => (
                                            <button
                                                key={align.id}
                                                className={`btn btn-sm ${verticalAlignment === align.id ? 'btn-primary' : 'btn-ghost'}`}
                                                onClick={() => setVerticalAlignment(align.id)}
                                                title={align.name}
                                            >
                                                {getVerticalAlignmentIcon(align.id)}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Text Formatting Card */}
                                <div className="bg-base-200/50 p-3 rounded-lg space-y-3">
                                    {/* Text Size */}
                                    <div>
                                        <label className="label py-1">
                                            <span className="label-text text-xs font-semibold">Size</span>
                                        </label>
                                        <div className="grid grid-cols-5 gap-1">
                                            {TEXT_SIZES.map((size) => (
                                                <button
                                                    key={size.id}
                                                    className={`btn btn-xs ${textSize === size.id ? 'btn-primary' : 'btn-ghost'}`}
                                                    onClick={() => setTextSize(size.id)}
                                                    title={size.name}
                                                >
                                                    {size.id.toUpperCase()}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Text Style Toggles */}
                                    <div>
                                        <label className="label py-1">
                                            <span className="label-text text-xs font-semibold">Style</span>
                                        </label>
                                        <div className="grid grid-cols-4 gap-2">
                                            <button
                                                className={`btn btn-sm ${bold ? 'btn-primary' : 'btn-ghost'}`}
                                                onClick={() => setBold(!bold)}
                                                title="Bold"
                                            >
                                                <Bold className="w-4 h-4" />
                                            </button>
                                            <button
                                                className={`btn btn-sm ${italic ? 'btn-primary' : 'btn-ghost'}`}
                                                onClick={() => setItalic(!italic)}
                                                title="Italic"
                                            >
                                                <Italic className="w-4 h-4" />
                                            </button>
                                            <button
                                                className={`btn btn-sm ${underline ? 'btn-primary' : 'btn-ghost'}`}
                                                onClick={() => setUnderline(!underline)}
                                                title="Underline"
                                            >
                                                <Underline className="w-4 h-4" />
                                            </button>
                                            <button
                                                className={`btn btn-sm ${stroke ? 'btn-primary' : 'btn-ghost'}`}
                                                onClick={() => setStroke(!stroke)}
                                                title="Text Stroke"
                                            >
                                                <Type className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Stroke Settings */}
                                {stroke && (
                                    <div className="bg-base-200 p-3 rounded-lg space-y-2">
                                        <div>
                                            <label className="label py-1">
                                                <span className="label-text text-xs">Stroke Width: {strokeWidth}px</span>
                                            </label>
                                            <input
                                                type="range"
                                                min="1"
                                                max="10"
                                                value={strokeWidth}
                                                onChange={(e) => setStrokeWidth(Number(e.target.value))}
                                                className="range range-xs range-primary"
                                            />
                                        </div>
                                        <div>
                                            <label className="label py-1">
                                                <span className="label-text text-xs">Stroke Color</span>
                                            </label>
                                            <input
                                                type="color"
                                                value={strokeColor}
                                                onChange={(e) => setStrokeColor(e.target.value)}
                                                className="w-full h-8 rounded cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Spacing Controls Card */}
                                <div className="bg-base-200/50 p-3 rounded-lg space-y-3">
                                    <label className="label py-0">
                                        <span className="label-text text-xs font-semibold">Spacing</span>
                                    </label>
                                    <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs text-base-content/70">Letter</span>
                                            <span className="text-xs font-semibold">{letterSpacing}px</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="-5"
                                            max="20"
                                            value={letterSpacing}
                                            onChange={(e) => setLetterSpacing(Number(e.target.value))}
                                            className="range range-xs range-primary w-full"
                                        />
                                    </div>
                                    <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs text-base-content/70">Line</span>
                                            <span className="text-xs font-semibold">{lineSpacing.toFixed(1)}x</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0.8"
                                            max="2.5"
                                            step="0.1"
                                            value={lineSpacing}
                                            onChange={(e) => setLineSpacing(Number(e.target.value))}
                                            className="range range-xs range-primary w-full"
                                        />
                                    </div>
                                </div>

                                {/* Per-Line Styling */}
                                {text.split('\n').length > 1 && (
                                    <div>
                                        <label className="label">
                                            <span className="label-text font-semibold">Style Each Line</span>
                                            <span className="label-text-alt text-base-content/60">Optional</span>
                                        </label>
                                        <div 
                                            className="space-y-3 max-h-64 overflow-y-auto" 
                                            style={{ 
                                                WebkitOverflowScrolling: 'touch',
                                                scrollBehavior: 'smooth'
                                            }}
                                        >
                                            {text.split('\n').map((line, index) => {
                                                const currentTextColor = TEXT_COLORS.find(c => c.id === textColorId);
                                                const defaultColor = textColorId === 'custom' ? customTextColor : (currentTextColor?.color || '#ffffff');
                                                const lineStyle = lineStyles[index] || {};

                                                return (
                                                    <div key={index} className="p-3 bg-base-200 rounded-lg space-y-2">
                                                        <div className="text-xs font-semibold text-base-content/80 mb-2">
                                                            Line {index + 1}: {line.slice(0, 25)}{line.length > 25 ? '...' : ''}
                                                        </div>

                                                        {/* Font and Color */}
                                                        <div className="flex gap-2">
                                                            <button
                                                                className="btn btn-xs flex-1"
                                                                onClick={() => {
                                                                    setFontPickerForLine(index);
                                                                    setShowFontPicker(true);
                                                                }}
                                                            >
                                                                {lineStyle.fontId ? ALL_FONTS.find(f => f.id === lineStyle.fontId)?.name : 'Default Font'}
                                                            </button>
                                                            <input
                                                                type="color"
                                                                className="w-10 h-6 rounded cursor-pointer"
                                                                value={lineStyle.color || defaultColor}
                                                                onChange={(e) => {
                                                                    const newStyles = [...lineStyles];
                                                                    newStyles[index] = { ...newStyles[index], color: e.target.value };
                                                                    setLineStyles(newStyles);
                                                                }}
                                                                title="Line color"
                                                            />
                                                        </div>

                                                        {/* Size */}
                                                        <div className="flex gap-1">
                                                            {TEXT_SIZES.map((size) => (
                                                                <button
                                                                    key={size.id}
                                                                    className={`btn btn-xs flex-1 ${(lineStyle.textSize || textSize) === size.id ? 'btn-primary' : 'btn-ghost'}`}
                                                                    onClick={() => {
                                                                        const newStyles = [...lineStyles];
                                                                        newStyles[index] = { ...newStyles[index], textSize: size.id };
                                                                        setLineStyles(newStyles);
                                                                    }}
                                                                >
                                                                    {size.id.toUpperCase()}
                                                                </button>
                                                            ))}
                                                        </div>

                                                        {/* Style Toggles */}
                                                        <div className="flex gap-1">
                                                            <button
                                                                className={`btn btn-xs flex-1 ${lineStyle.bold !== undefined ? (lineStyle.bold ? 'btn-primary' : 'btn-ghost') : (bold ? 'btn-primary' : 'btn-ghost')}`}
                                                                onClick={() => {
                                                                    const newStyles = [...lineStyles];
                                                                    newStyles[index] = { ...newStyles[index], bold: !(lineStyle.bold !== undefined ? lineStyle.bold : bold) };
                                                                    setLineStyles(newStyles);
                                                                }}
                                                            >
                                                                <Bold className="w-3 h-3" />
                                                            </button>
                                                            <button
                                                                className={`btn btn-xs flex-1 ${lineStyle.italic !== undefined ? (lineStyle.italic ? 'btn-primary' : 'btn-ghost') : (italic ? 'btn-primary' : 'btn-ghost')}`}
                                                                onClick={() => {
                                                                    const newStyles = [...lineStyles];
                                                                    newStyles[index] = { ...newStyles[index], italic: !(lineStyle.italic !== undefined ? lineStyle.italic : italic) };
                                                                    setLineStyles(newStyles);
                                                                }}
                                                            >
                                                                <Italic className="w-3 h-3" />
                                                            </button>
                                                            <button
                                                                className={`btn btn-xs flex-1 ${lineStyle.underline !== undefined ? (lineStyle.underline ? 'btn-primary' : 'btn-ghost') : (underline ? 'btn-primary' : 'btn-ghost')}`}
                                                                onClick={() => {
                                                                    const newStyles = [...lineStyles];
                                                                    newStyles[index] = { ...newStyles[index], underline: !(lineStyle.underline !== undefined ? lineStyle.underline : underline) };
                                                                    setLineStyles(newStyles);
                                                                }}
                                                            >
                                                                <Underline className="w-3 h-3" />
                                                            </button>
                                                            <button
                                                                className={`btn btn-xs flex-1 ${lineStyle.stroke !== undefined ? (lineStyle.stroke ? 'btn-primary' : 'btn-ghost') : (stroke ? 'btn-primary' : 'btn-ghost')}`}
                                                                onClick={() => {
                                                                    const newStyles = [...lineStyles];
                                                                    newStyles[index] = { ...newStyles[index], stroke: !(lineStyle.stroke !== undefined ? lineStyle.stroke : stroke) };
                                                                    setLineStyles(newStyles);
                                                                }}
                                                            >
                                                                <Type className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <button
                                            className="btn btn-xs btn-ghost w-full mt-2"
                                            onClick={() => setLineStyles([])}
                                        >
                                            Reset All Line Styles
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                {/* Background Selection */}
                                <div>
                                    <label className="label">
                                        <span className="label-text font-semibold flex items-center gap-2">
                                            <Palette className="w-4 h-4" />
                                            Background
                                        </span>
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {BACKGROUND_PRESETS.map((bg) => (
                                            bg.id === 'custom' ? (
                                                <button
                                                    key={bg.id}
                                                    className={`h-14 rounded-lg border-2 transition-colors cursor-pointer flex items-center justify-center relative overflow-hidden ${backgroundId === bg.id
                                                        ? 'border-primary ring-2 ring-primary ring-offset-1 ring-offset-base-100'
                                                        : 'border-base-300 hover:border-base-content/30'
                                                        }`}
                                                    style={customBgData ? (
                                                        customBgData.type === 'solid' ? { background: customBgData.color } :
                                                            customBgData.type === 'gradient' ? { background: `linear-gradient(${customBgData.angle}deg, ${customBgData.colors.join(', ')})` } :
                                                                customBgData.type === 'image' ? { backgroundImage: `url(${customBgData.imageData})`, backgroundSize: 'cover', backgroundPosition: 'center' } :
                                                                    { background: customBgColor }
                                                    ) : { background: customBgColor }}
                                                    onClick={() => setShowCustomBgModal(true)}
                                                    title="Custom Background"
                                                >
                                                    <Palette className="w-6 h-6 text-white drop-shadow-lg" />
                                                </button>
                                            ) : (
                                                <button
                                                    key={bg.id}
                                                    className={`h-14 rounded-lg border-2 transition-colors ${backgroundId === bg.id
                                                        ? 'border-primary ring-2 ring-primary ring-offset-1 ring-offset-base-100'
                                                        : 'border-base-300 hover:border-base-content/30'
                                                        }`}
                                                    style={{
                                                        background: bg.type === 'solid'
                                                            ? bg.color
                                                            : `linear-gradient(${bg.angle}deg, ${bg.colors.join(', ')})`,
                                                    }}
                                                    onClick={() => setBackgroundId(bg.id)}
                                                    title={bg.name}
                                                />
                                            )
                                        ))}
                                    </div>
                                </div>

                                {/* Text Color */}
                                <div>
                                    <label className="label">
                                        <span className="label-text font-semibold">Text Color</span>
                                    </label>
                                    <div className="grid grid-cols-6 gap-2">
                                        {TEXT_COLORS.map((color) => (
                                            color.id === 'custom' ? (
                                                <label
                                                    key={color.id}
                                                    className={`w-full aspect-square rounded-full border-3 transition-all hover:scale-110 cursor-pointer flex items-center justify-center relative overflow-hidden ${textColorId === color.id
                                                        ? 'border-primary ring-2 ring-primary ring-offset-2 ring-offset-base-100'
                                                        : 'border-base-300'
                                                        }`}
                                                    style={{ backgroundColor: customTextColor }}
                                                    title="Custom Color"
                                                >
                                                    <input
                                                        type="color"
                                                        value={customTextColor}
                                                        onChange={(e) => {
                                                            setCustomTextColor(e.target.value);
                                                            setTextColorId('custom');
                                                        }}
                                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                                    />
                                                    <Palette className="w-4 h-4 text-white drop-shadow-lg" />
                                                </label>
                                            ) : (
                                                <button
                                                    key={color.id}
                                                    className={`w-full aspect-square rounded-full border-3 transition-all hover:scale-110 ${textColorId === color.id
                                                        ? 'border-primary ring-2 ring-primary ring-offset-2 ring-offset-base-100'
                                                        : 'border-base-300'
                                                        }`}
                                                    style={{ backgroundColor: color.color }}
                                                    onClick={() => setTextColorId(color.id)}
                                                    title={color.name}
                                                />
                                            )
                                        ))}
                                    </div>
                                </div>

                                {/* Decorative Shapes */}
                                <div>
                                    <label className="label">
                                        <span className="label-text font-semibold flex items-center gap-2">
                                            <Shapes className="w-4 h-4" />
                                            Decorations
                                        </span>
                                    </label>
                                    <div className="grid grid-cols-4 gap-1.5">
                                        {SHAPE_TYPES.map((shape) => (
                                            <button
                                                key={shape.id}
                                                className={`btn btn-sm ${shapesId === shape.id ? 'btn-primary' : 'btn-ghost'}`}
                                                onClick={() => setShapesId(shape.id)}
                                                title={shape.name}
                                            >
                                                {getShapeIcon(shape.id)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex-shrink-0 p-3 md:p-4 border-t border-base-300 flex gap-2 md:gap-3 bg-base-100">
                        <button className="btn btn-sm md:btn-md btn-ghost flex-1" onClick={onCancel}>
                            Cancel
                        </button>
                        <button
                            className="btn btn-sm md:btn-md btn-primary flex-1 gap-2"
                            onClick={handleGenerate}
                            disabled={!text.trim() || isGenerating}
                        >
                            {isGenerating ? (
                                <>
                                    <span className="loading loading-spinner loading-sm"></span>
                                    <span className="hidden sm:inline">Generating...</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4" />
                                    <span className="hidden sm:inline">Generate.</span>
                                    <span className="sm:hidden">Generate.</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Custom Background Modal */}
            {showCustomBgModal && (
                <CustomBackgroundModal
                    isOpen={showCustomBgModal}
                    onClose={() => setShowCustomBgModal(false)}
                    onApply={(bgData) => {
                        setCustomBgData(bgData);
                        setBackgroundId('custom');
                    }}
                    initialType={customBgData?.type || 'solid'}
                    initialColor={customBgColor}
                />
            )}

            {/* Font Picker Modal */}
            {showFontPicker && (
                <FontPickerModal
                    isOpen={showFontPicker}
                    onClose={() => {
                        setShowFontPicker(false);
                        setFontPickerForLine(null);
                    }}
                    onSelect={(selectedFontId) => {
                        if (fontPickerForLine !== null) {
                            // Update specific line font
                            const newStyles = [...lineStyles];
                            newStyles[fontPickerForLine] = {
                                ...newStyles[fontPickerForLine],
                                fontId: selectedFontId
                            };
                            setLineStyles(newStyles);
                        } else {
                            // Update global font
                            setFontId(selectedFontId);
                        }
                        setShowFontPicker(false);
                        setFontPickerForLine(null);
                    }}
                    currentFontId={fontPickerForLine !== null
                        ? (lineStyles[fontPickerForLine]?.fontId || fontId)
                        : fontId
                    }
                />
            )}
        </>
    );
}
