import { useState, useRef } from 'react';
import { Image as ImageIcon, Palette, Droplets, X, ZoomIn, Move } from 'lucide-react';
import IOSModal from './IOSModal';

export default function CustomBackgroundModal({ isOpen, onClose, onApply, initialType = 'solid', initialColor = '#10b981' }) {
    const [activeTab, setActiveTab] = useState(initialType); // 'solid' | 'gradient' | 'image'
    const [solidColor, setSolidColor] = useState(initialColor);

    // Gradient state
    const [gradientColor1, setGradientColor1] = useState('#667eea');
    const [gradientColor2, setGradientColor2] = useState('#764ba2');
    const [gradientAngle, setGradientAngle] = useState(135);

    // Image state
    const [imagePreview, setImagePreview] = useState(null);
    const [imageScale, setImageScale] = useState(1);
    const [imagePosition, setImagePosition] = useState({ x: 50, y: 50 });
    const [imageOpacity, setImageOpacity] = useState(100);
    const [overlayColor, setOverlayColor] = useState('#000000');
    const [overlayOpacity, setOverlayOpacity] = useState(0);
    const [isCompressing, setIsCompressing] = useState(false);
    const fileInputRef = useRef(null);

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsCompressing(true);
        try {
            // Import compression utility
            const { compressImageToBase64 } = await import('../utils/imageCompression');

            // Compress image before using it (optimized for 1080x1080)
            const compressedBase64 = await compressImageToBase64(file, {
                maxSizeMB: 2,
                maxWidthOrHeight: 2160, // 2x the canvas size for quality
                useWebWorker: true,
                fileType: 'image/webp',
                initialQuality: 0.85,
            });
            setImagePreview(compressedBase64);
        } catch (error) {
            console.error('Failed to compress image:', error);
            // Fallback to uncompressed if compression fails
            const reader = new FileReader();
            reader.onload = (event) => {
                setImagePreview(event.target.result);
            };
            reader.readAsDataURL(file);
        } finally {
            setIsCompressing(false);
        }
    };

    const handleApply = () => {
        let backgroundData = {};

        if (activeTab === 'solid') {
            backgroundData = {
                type: 'solid',
                color: solidColor,
            };
        } else if (activeTab === 'gradient') {
            backgroundData = {
                type: 'gradient',
                colors: [gradientColor1, gradientColor2],
                angle: gradientAngle,
            };
        } else if (activeTab === 'image') {
            backgroundData = {
                type: 'image',
                imageData: imagePreview,
                scale: imageScale,
                position: imagePosition,
                opacity: imageOpacity,
                overlayColor: overlayColor,
                overlayOpacity: overlayOpacity,
            };
        }

        onApply(backgroundData);
        onClose();
    };

    const getPreviewStyle = () => {
        if (activeTab === 'solid') {
            return { backgroundColor: solidColor };
        } else if (activeTab === 'gradient') {
            return {
                background: `linear-gradient(${gradientAngle}deg, ${gradientColor1}, ${gradientColor2})`,
            };
        } else if (activeTab === 'image' && imagePreview) {
            return {
                position: 'relative',
                backgroundImage: `url(${imagePreview})`,
                backgroundSize: `${imageScale * 100}%`,
                backgroundPosition: `${imagePosition.x}% ${imagePosition.y}%`,
                backgroundRepeat: 'no-repeat',
            };
        }
        return { backgroundColor: '#1a1a1a' };
    };

    return (
        <IOSModal isOpen={isOpen} onClose={onClose} className="max-w-lg">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-base-300 bg-base-100 flex-shrink-0">
                <h3 className="font-bold text-lg">Custom Background</h3>
                <button className="btn btn-sm btn-circle btn-ghost" onClick={onClose}>
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-base-100">
                {/* Preview */}
                <div className="w-full aspect-square max-w-xs mx-auto rounded-lg overflow-hidden shadow-lg border border-base-300">
                    <div className="w-full h-full relative" style={getPreviewStyle()}>
                        {activeTab === 'image' && imagePreview && (
                            <>
                                {/* Image opacity layer */}
                                <div
                                    className="absolute inset-0"
                                    style={{
                                        backgroundImage: `url(${imagePreview})`,
                                        backgroundSize: `${imageScale * 100}%`,
                                        backgroundPosition: `${imagePosition.x}% ${imagePosition.y}%`,
                                        backgroundRepeat: 'no-repeat',
                                        opacity: imageOpacity / 100,
                                        willChange: 'transform'
                                    }}
                                />
                                {/* Overlay layer */}
                                {overlayOpacity > 0 && (
                                    <div
                                        className="absolute inset-0"
                                        style={{
                                            backgroundColor: overlayColor,
                                            opacity: overlayOpacity / 100
                                        }}
                                    />
                                )}
                            </>
                        )}
                        {!imagePreview && activeTab === 'image' && (
                            <div className="w-full h-full flex items-center justify-center text-base-content/40">
                                <div className="text-center">
                                    <ImageIcon className="w-12 h-12 mx-auto mb-2" />
                                    <p className="text-xs">Upload an image</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2">
                    <button
                        className={`flex-1 btn btn-sm ${activeTab === 'solid' ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => setActiveTab('solid')}
                    >
                        <Palette className="w-4 h-4 mr-2" />
                        Solid
                    </button>
                    <button
                        className={`flex-1 btn btn-sm ${activeTab === 'gradient' ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => setActiveTab('gradient')}
                    >
                        <Droplets className="w-4 h-4 mr-2" />
                        Gradient
                    </button>
                    <button
                        className={`flex-1 btn btn-sm ${activeTab === 'image' ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => setActiveTab('image')}
                    >
                        <ImageIcon className="w-4 h-4 mr-2" />
                        Image
                    </button>
                </div>

                {/* Controls */}
                <div className="space-y-4">
                    {activeTab === 'solid' && (
                        <div>
                            <label className="label">
                                <span className="label-text font-semibold">Pick a Color</span>
                            </label>
                            <div className="flex gap-2 items-center">
                                <input
                                    type="color"
                                    value={solidColor}
                                    onChange={(e) => setSolidColor(e.target.value)}
                                    className="w-16 h-16 rounded-lg cursor-pointer border border-base-300"
                                />
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        value={solidColor}
                                        onChange={(e) => setSolidColor(e.target.value)}
                                        className="input input-bordered input-sm w-full"
                                        placeholder="#000000"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'gradient' && (
                        <div className="space-y-3">
                            <div>
                                <label className="label py-1">
                                    <span className="label-text text-sm font-semibold">Color 1</span>
                                </label>
                                <div className="flex gap-2 items-center">
                                    <input
                                        type="color"
                                        value={gradientColor1}
                                        onChange={(e) => setGradientColor1(e.target.value)}
                                        className="w-12 h-12 rounded-lg cursor-pointer border border-base-300"
                                    />
                                    <input
                                        type="text"
                                        value={gradientColor1}
                                        onChange={(e) => setGradientColor1(e.target.value)}
                                        className="input input-bordered input-sm flex-1"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="label py-1">
                                    <span className="label-text text-sm font-semibold">Color 2</span>
                                </label>
                                <div className="flex gap-2 items-center">
                                    <input
                                        type="color"
                                        value={gradientColor2}
                                        onChange={(e) => setGradientColor2(e.target.value)}
                                        className="w-12 h-12 rounded-lg cursor-pointer border border-base-300"
                                    />
                                    <input
                                        type="text"
                                        value={gradientColor2}
                                        onChange={(e) => setGradientColor2(e.target.value)}
                                        className="input input-bordered input-sm flex-1"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="label py-1">
                                    <span className="label-text text-sm font-semibold">Angle: {gradientAngle}°</span>
                                </label>
                                <input
                                    type="range"
                                    min="0"
                                    max="360"
                                    value={gradientAngle}
                                    onChange={(e) => setGradientAngle(parseInt(e.target.value))}
                                    className="range range-sm range-primary"
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'image' && (
                        <div className="space-y-3">
                            <div>
                                <label className="label py-1">
                                    <span className="label-text text-sm font-semibold">Upload Image</span>
                                    <span className="label-text-alt text-xs">1080x1080px</span>
                                </label>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="file-input file-input-bordered file-input-sm w-full"
                                    disabled={isCompressing}
                                />
                                {isCompressing && (
                                    <div className="flex items-center gap-2 mt-2 text-sm text-base-content/60">
                                        <span className="loading loading-spinner loading-sm"></span>
                                        <span>Compressing image...</span>
                                    </div>
                                )}
                            </div>

                            {imagePreview && (
                                <>
                                    <div>
                                        <label className="label">
                                            <span className="label-text font-semibold flex items-center gap-2">
                                                <ZoomIn className="w-4 h-4" />
                                                Scale: {imageScale.toFixed(1)}x
                                            </span>
                                        </label>
                                        <input
                                            type="range"
                                            min="0.5"
                                            max="3"
                                            step="0.1"
                                            value={imageScale}
                                            onChange={(e) => setImageScale(parseFloat(e.target.value))}
                                            className="range range-primary"
                                        />
                                    </div>

                                    <div>
                                        <label className="label">
                                            <span className="label-text font-semibold flex items-center gap-2">
                                                <Move className="w-4 h-4" />
                                                Position
                                            </span>
                                        </label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="label label-text-alt">Horizontal: {imagePosition.x}%</label>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="100"
                                                    value={imagePosition.x}
                                                    onChange={(e) => setImagePosition(prev => ({ ...prev, x: parseInt(e.target.value) }))}
                                                    className="range range-sm range-primary"
                                                />
                                            </div>
                                            <div>
                                                <label className="label label-text-alt">Vertical: {imagePosition.y}%</label>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="100"
                                                    value={imagePosition.y}
                                                    onChange={(e) => setImagePosition(prev => ({ ...prev, y: parseInt(e.target.value) }))}
                                                    className="range range-sm range-primary"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="label">
                                            <span className="label-text font-semibold">Image Opacity: {imageOpacity}%</span>
                                        </label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={imageOpacity}
                                            onChange={(e) => setImageOpacity(parseInt(e.target.value))}
                                            className="range range-primary"
                                        />
                                    </div>

                                    <div className="bg-base-200 p-3 rounded-lg space-y-3">
                                        <label className="label py-0">
                                            <span className="label-text font-semibold">Backdrop Overlay</span>
                                        </label>
                                        <div className="flex gap-3 items-center">
                                            <input
                                                type="color"
                                                value={overlayColor}
                                                onChange={(e) => setOverlayColor(e.target.value)}
                                                className="w-12 h-12 rounded-lg cursor-pointer border-2 border-base-300"
                                            />
                                            <div className="flex-1">
                                                <label className="label label-text-alt">Overlay Opacity: {overlayOpacity}%</label>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="100"
                                                    value={overlayOpacity}
                                                    onChange={(e) => setOverlayOpacity(parseInt(e.target.value))}
                                                    className="range range-sm range-primary"
                                                />
                                            </div>
                                        </div>
                                        <p className="text-xs text-base-content/60">
                                            Add a colored overlay to darken or tint your background image
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 px-6 py-4 border-t border-base-300 bg-base-100 flex-shrink-0">
                <button className="btn btn-ghost flex-1" onClick={onClose}>
                    Cancel
                </button>
                <button
                    className="btn btn-primary flex-1"
                    onClick={handleApply}
                    disabled={activeTab === 'image' && !imagePreview}
                >
                    Apply Background
                </button>
            </div>
        </IOSModal>
    );
}
