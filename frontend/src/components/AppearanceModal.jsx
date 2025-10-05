import { useEffect, useState, useRef } from "react";
import { X, Upload, Palette, Image as ImageIcon, Volume2, VolumeX, Keyboard, Play, Phone } from "lucide-react";
import toast from "react-hot-toast";
import { useThemeStore } from "../store/useThemeStore";
import { useChatStore } from "../store/useChatStore";
import { useCallStore } from "../store/useCallStore";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "../store/useAuthStore";
import { LIGHT_THEMES, DARK_THEMES, SPECIAL_THEMES } from "../constants/themes";
import IOSModal from "./IOSModal";

function AppearanceModal() {
    const { isModalOpen, closeModal, currentTheme, setTheme } = useThemeStore();
    const {
        chatBackground,
        setChatBackground,
        isSoundEnabled,
        isKeystrokeSoundEnabled,
        selectedKeystrokeSound,
        toggleSound,
        toggleKeystrokeSound,
        setKeystrokeSound
    } = useChatStore();
    const { selectedRingtone, setRingtone } = useCallStore();
    const { authUser } = useAuthStore();
    const [backgrounds, setBackgrounds] = useState(["/background.png", "/background2.jpg", "/background3.jpg", "/background4.jpg"]);
    const [isUploading, setIsUploading] = useState(false);
    const [activeTab, setActiveTab] = useState("themes");
    const [previewingSound, setPreviewingSound] = useState(null);
    const [previewingRingtone, setPreviewingRingtone] = useState(null);
    const fileInputRef = useRef(null);
    const currentAudioRef = useRef(null); // Track currently playing audio

    const KEYSTROKE_SOUNDS = [
        { id: "keystroke1", name: "Classic", description: "Traditional typewriter sound" },
        { id: "keystroke2", name: "Modern", description: "Soft mechanical keyboard" },
        { id: "keystroke3", name: "Retro", description: "Vintage computer keyboard" },
        { id: "keystroke4", name: "Minimal", description: "Subtle click sound" }
    ];

    const RINGTONES = [
        { id: "Swing_Jazz", name: "Swing Jazz", description: "Smooth jazz melody (Default)" },
        { id: "guitar_2013", name: "Guitar 2013", description: "Acoustic guitar tune" },
        { id: "memories By DjCufool", name: "Memories", description: "Melodic ringtone by DjCufool" },
        { id: "minor2go-guitar-quality-gold-sitting-on-the-moon", name: "Sitting on the Moon", description: "Quality gold guitar melody" }
    ];

    // Load backgrounds when modal opens
    useEffect(() => {
        if (!isModalOpen) return;

        const BASE_BACKGROUNDS = ["/background.png", "/background2.jpg", "/background3.jpg", "/background4.jpg"];
        const setList = new Set(BASE_BACKGROUNDS);
        if (authUser?.customBackground) setList.add(authUser.customBackground);
        // Ensure custom background appears first if present
        const arr = authUser?.customBackground
            ? [authUser.customBackground, ...BASE_BACKGROUNDS.filter(bg => bg !== authUser.customBackground)]
            : BASE_BACKGROUNDS;
        setBackgrounds(arr);
    }, [isModalOpen, authUser?.customBackground]);

    const handleCustomUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file
        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size should be less than 5MB');
            return;
        }

        setIsUploading(true);
        try {
            // Convert to base64
            const reader = new FileReader();
            reader.readAsDataURL(file);
            await new Promise((resolve) => (reader.onloadend = resolve));
            const imageData = reader.result;

            // Upload to server
            const response = await axiosInstance.post('/api/auth/upload-background', {
                background: imageData,
            });

            const customBgUrl = response.data.backgroundUrl;

            // Add to backgrounds list and set as active
            setBackgrounds(prev => [customBgUrl, ...prev.filter(bg => bg !== customBgUrl)]);
            setChatBackground(customBgUrl);

            toast.success('Custom background uploaded successfully!');
        } catch (error) {
            console.error('Upload error:', error);
            toast.error(error.response?.data?.message || 'Failed to upload background');
        } finally {
            setIsUploading(false);
        }
    };

    const handleThemeChange = (themeName) => {
        setTheme(themeName);
        toast.success(`Theme changed to ${themeName}`);
    };

    // Stop all currently playing audio
    const stopAllAudio = () => {
        if (currentAudioRef.current) {
            currentAudioRef.current.pause();
            currentAudioRef.current.currentTime = 0;
            currentAudioRef.current = null;
        }
        setPreviewingSound(null);
        setPreviewingRingtone(null);
    };

    const handlePreviewSound = async (soundId) => {
        stopAllAudio(); // Stop any currently playing audio
        setPreviewingSound(soundId);
        try {
            const audio = new Audio(`/sounds/${soundId}.mp3`);
            currentAudioRef.current = audio;
            await audio.play();

            // Auto-stop after playing
            audio.onended = () => {
                setPreviewingSound(null);
                currentAudioRef.current = null;
            };
        } catch (error) {
            console.warn('Failed to preview sound:', error);
            setPreviewingSound(null);
            currentAudioRef.current = null;
        }
    };

    const handlePreviewNotification = async () => {
        stopAllAudio(); // Stop any currently playing audio
        setPreviewingSound('notification');
        try {
            const audio = new Audio('/sounds/notification.mp3');
            currentAudioRef.current = audio;
            await audio.play();

            // Auto-stop after playing
            audio.onended = () => {
                setPreviewingSound(null);
                currentAudioRef.current = null;
            };
        } catch (error) {
            console.warn('Failed to preview notification sound:', error);
            setPreviewingSound(null);
            currentAudioRef.current = null;
        }
    };

    const handlePreviewRingtone = async (ringtoneId) => {
        stopAllAudio(); // Stop any currently playing audio
        setPreviewingRingtone(ringtoneId);
        try {
            const audio = new Audio(`/rigntone/${ringtoneId}.mp3`);
            audio.volume = 0.5;
            currentAudioRef.current = audio;
            await audio.play();

            // Stop after 5 seconds
            const timeout = setTimeout(() => {
                if (currentAudioRef.current === audio) {
                    audio.pause();
                    audio.currentTime = 0;
                    setPreviewingRingtone(null);
                    currentAudioRef.current = null;
                }
            }, 5000);

            // Also stop if audio ends naturally
            audio.onended = () => {
                clearTimeout(timeout);
                setPreviewingRingtone(null);
                currentAudioRef.current = null;
            };
        } catch (error) {
            console.warn('Failed to preview ringtone:', error);
            setPreviewingRingtone(null);
            currentAudioRef.current = null;
        }
    };

    // Stop audio when modal closes
    useEffect(() => {
        if (!isModalOpen) {
            stopAllAudio();
        }
    }, [isModalOpen]);

    return (
        <IOSModal isOpen={isModalOpen} onClose={closeModal} className="max-w-4xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-base-300">
                <h2 className="text-xl font-semibold text-base-content">Customize Appearance</h2>
                <button
                    onClick={closeModal}
                    className="btn btn-ghost btn-sm btn-circle"
                    aria-label="Close modal"
                >
                    <X className="size-4" />
                </button>
            </div>

            {/* Tabs */}
            <div className="tabs tabs-bordered px-6 pt-4">
                <button
                    className={`tab tab-bordered ${activeTab === 'themes' ? 'tab-active' : ''}`}
                    onClick={() => setActiveTab('themes')}
                >
                    <Palette className="w-4 h-4 mr-2" />
                    Themes
                </button>
                <button
                    className={`tab tab-bordered ${activeTab === 'backgrounds' ? 'tab-active' : ''}`}
                    onClick={() => setActiveTab('backgrounds')}
                >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Chat Backgrounds
                </button>
                <button
                    className={`tab tab-bordered ${activeTab === 'sounds' ? 'tab-active' : ''}`}
                    onClick={() => setActiveTab('sounds')}
                >
                    <Volume2 className="w-4 h-4 mr-2" />
                    Sounds
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="p-6">
                    {activeTab === 'themes' && (
                        <div>
                            <div className="mb-6">
                                <h3 className="text-lg font-medium text-base-content mb-2">Choose Your Theme</h3>
                                <p className="text-sm text-base-content/60">
                                    Select from {LIGHT_THEMES.length + DARK_THEMES.length + SPECIAL_THEMES.length} beautiful themes including light, dark, and special themes.
                                </p>
                            </div>

                            {/* Theme Categories */}
                            <div className="space-y-8">
                                {/* Light Themes */}
                                <div>
                                    <h4 className="text-md font-medium text-base-content mb-4 flex items-center gap-2">
                                        ☀️ Light Themes
                                    </h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                        {LIGHT_THEMES.map((theme) => (
                                            <button
                                                key={theme.name}
                                                onClick={() => handleThemeChange(theme.name)}
                                                className={`btn btn-outline h-auto p-3 flex flex-col gap-2 ${currentTheme === theme.name ? 'btn-primary' : ''}`}
                                                data-theme={theme.name}
                                            >
                                                <div className="flex gap-1">
                                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.colors.primary }}></div>
                                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.colors.secondary }}></div>
                                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.colors.accent }}></div>
                                                </div>
                                                <span className="text-xs">{theme.displayName}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Dark Themes */}
                                <div>
                                    <h4 className="text-md font-medium text-base-content mb-4 flex items-center gap-2">
                                        🌙 Dark Themes
                                    </h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                        {DARK_THEMES.map((theme) => (
                                            <button
                                                key={theme.name}
                                                onClick={() => handleThemeChange(theme.name)}
                                                className={`btn btn-outline h-auto p-3 flex flex-col gap-2 ${currentTheme === theme.name ? 'btn-primary' : ''}`}
                                                data-theme={theme.name}
                                            >
                                                <div className="flex gap-1">
                                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.colors.primary }}></div>
                                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.colors.secondary }}></div>
                                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.colors.accent }}></div>
                                                </div>
                                                <span className="text-xs">{theme.displayName}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Special Themes */}
                                {SPECIAL_THEMES.length > 0 && (
                                    <div>
                                        <h4 className="text-md font-medium text-base-content mb-4 flex items-center gap-2">
                                            ✨ Special Themes
                                        </h4>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                            {SPECIAL_THEMES.map((theme) => (
                                                <button
                                                    key={theme.name}
                                                    onClick={() => handleThemeChange(theme.name)}
                                                    className={`btn btn-outline h-auto p-3 flex flex-col gap-2 ${currentTheme === theme.name ? 'btn-primary' : ''}`}
                                                    data-theme={theme.name}
                                                >
                                                    <div className="flex gap-1">
                                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.colors.primary }}></div>
                                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.colors.secondary }}></div>
                                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.colors.accent }}></div>
                                                    </div>
                                                    <span className="text-xs">{theme.displayName}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'backgrounds' && (
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-lg font-medium text-base-content mb-2">Chat Background</h3>
                                    <p className="text-sm text-base-content/60">
                                        Choose a background for your chat conversations.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                    className="btn btn-primary gap-2"
                                >
                                    {isUploading ? (
                                        <>
                                            <span className="loading loading-spinner loading-xs"></span>
                                            Uploading...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-4 h-4" />
                                            Upload Custom
                                        </>
                                    )}
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleCustomUpload}
                                    className="hidden"
                                />
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {/* None/Default option */}
                                <button
                                    type="button"
                                    onClick={() => setChatBackground(null)}
                                    className={`relative rounded-lg overflow-hidden border-2 ${!chatBackground ? 'border-primary ring-2 ring-primary/40' : 'border-base-300 hover:border-base-400'} h-24 flex items-center justify-center bg-base-200`}
                                    title="No background"
                                >
                                    <span className="text-xs text-base-content/60">None</span>
                                    {!chatBackground && (
                                        <div className="absolute inset-0 ring-2 ring-primary pointer-events-none rounded-lg" />
                                    )}
                                </button>

                                {/* Background options */}
                                {backgrounds.map((bg) => (
                                    <button
                                        key={bg}
                                        type="button"
                                        onClick={() => setChatBackground(bg)}
                                        className={`relative rounded-lg overflow-hidden border-2 ${chatBackground === bg ? 'border-primary ring-2 ring-primary/40' : 'border-base-300 hover:border-base-400'} h-24`}
                                        title={bg.split('/').pop()}
                                    >
                                        <img
                                            src={bg}
                                            alt="background preview"
                                            className="w-full h-full object-cover"
                                            onError={(e) => { if (bg !== "/background.png") e.currentTarget.src = '/background.png'; }}
                                        />
                                        {chatBackground === bg && (
                                            <div className="absolute inset-0 ring-2 ring-primary pointer-events-none rounded-lg" />
                                        )}
                                    </button>
                                ))}
                            </div>

                            <div className="flex justify-between items-center mt-6 pt-4 border-t border-base-300">
                                <p className="text-xs text-base-content/60">
                                    Custom backgrounds are saved to your account
                                </p>
                                <button
                                    type="button"
                                    className="btn btn-ghost btn-xs"
                                    onClick={() => setChatBackground("/background.png")}
                                >
                                    Reset to default
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'sounds' && (
                        <div className="space-y-6">
                            {/* Main Sound Toggle */}
                            <div className="card bg-base-200/50 shadow-sm">
                                <div className="card-body p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            {isSoundEnabled ? (
                                                <Volume2 className="w-5 h-5 text-success" />
                                            ) : (
                                                <VolumeX className="w-5 h-5 text-base-content/50" />
                                            )}
                                            <div>
                                                <h4 className="font-medium text-base-content">Sound Effects</h4>
                                                <p className="text-sm text-base-content/60">Enable notification sounds</p>
                                            </div>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={isSoundEnabled}
                                            onChange={toggleSound}
                                            className="toggle toggle-primary"
                                        />
                                    </div>

                                    {isSoundEnabled && (
                                        <div className="mt-3 pt-3 border-t border-base-300">
                                            <button
                                                onClick={handlePreviewNotification}
                                                className={`btn btn-sm btn-outline gap-2 ${previewingSound === 'notification' ? 'btn-primary' : ''}`}
                                                disabled={previewingSound === 'notification'}
                                            >
                                                <Play className="w-4 h-4" />
                                                {previewingSound === 'notification' ? 'Playing...' : 'Preview Notification'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Call Ringtone Settings */}
                            {isSoundEnabled && (
                                <div className="card bg-base-200/50 shadow-sm">
                                    <div className="card-body p-4">
                                        <div className="flex items-center gap-3 mb-4">
                                            <Phone className="w-5 h-5 text-primary" />
                                            <div>
                                                <h4 className="font-medium text-base-content">Call Ringtone</h4>
                                                <p className="text-sm text-base-content/60">Choose your incoming call ringtone</p>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="text-sm font-medium text-base-content/80 mb-2">Select Ringtone:</div>
                                            {RINGTONES.map((ringtone) => (
                                                <div
                                                    key={ringtone.id}
                                                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${selectedRingtone === ringtone.id
                                                        ? 'border-primary bg-primary/10'
                                                        : 'border-base-300 hover:border-primary/50 hover:bg-base-300/50'
                                                        }`}
                                                    onClick={() => setRingtone(ringtone.id)}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex-1">
                                                            <div className="font-medium text-base-content">{ringtone.name}</div>
                                                            <div className="text-sm text-base-content/60">{ringtone.description}</div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handlePreviewRingtone(ringtone.id);
                                                                }}
                                                                className={`btn btn-sm btn-circle btn-ghost ${previewingRingtone === ringtone.id ? 'btn-primary' : ''
                                                                    }`}
                                                                disabled={previewingRingtone === ringtone.id}
                                                            >
                                                                <Play className="w-3 h-3" />
                                                            </button>
                                                            <input
                                                                type="radio"
                                                                name="ringtone"
                                                                checked={selectedRingtone === ringtone.id}
                                                                onChange={() => setRingtone(ringtone.id)}
                                                                className="radio radio-primary"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Keystroke Sound Settings */}
                            {isSoundEnabled && (
                                <div className="card bg-base-200/50 shadow-sm">
                                    <div className="card-body p-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <Keyboard className="w-5 h-5 text-primary" />
                                                <div>
                                                    <h4 className="font-medium text-base-content">Keystroke Sounds</h4>
                                                    <p className="text-sm text-base-content/60">Play sounds while typing</p>
                                                </div>
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={isKeystrokeSoundEnabled}
                                                onChange={toggleKeystrokeSound}
                                                className="toggle toggle-primary"
                                            />
                                        </div>

                                        {isKeystrokeSoundEnabled && (
                                            <div className="space-y-3">
                                                <div className="text-sm font-medium text-base-content/80 mb-2">Choose Keystroke Sound:</div>
                                                {KEYSTROKE_SOUNDS.map((sound) => (
                                                    <div
                                                        key={sound.id}
                                                        className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${selectedKeystrokeSound === sound.id
                                                            ? 'border-primary bg-primary/10'
                                                            : 'border-base-300 hover:border-primary/50 hover:bg-base-300/50'
                                                            }`}
                                                        onClick={() => setKeystrokeSound(sound.id)}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex-1">
                                                                <div className="font-medium text-base-content">{sound.name}</div>
                                                                <div className="text-sm text-base-content/60">{sound.description}</div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handlePreviewSound(sound.id);
                                                                    }}
                                                                    className={`btn btn-sm btn-circle btn-ghost ${previewingSound === sound.id ? 'btn-primary' : ''
                                                                        }`}
                                                                    disabled={previewingSound === sound.id}
                                                                >
                                                                    <Play className="w-3 h-3" />
                                                                </button>
                                                                <input
                                                                    type="radio"
                                                                    name="keystrokeSound"
                                                                    checked={selectedKeystrokeSound === sound.id}
                                                                    onChange={() => setKeystrokeSound(sound.id)}
                                                                    className="radio radio-primary"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Sound Tips */}
                            <div className="alert alert-info">
                                <div className="flex items-start gap-2">
                                    <Volume2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm">
                                        <div className="font-medium mb-1">Sound Tips:</div>
                                        <ul className="list-disc list-inside space-y-1 text-xs opacity-80">
                                            <li>Ringtones play when you receive an incoming call</li>
                                            <li>Notification sounds play for new messages from other users</li>
                                            <li>Keystroke sounds only play when typing in message input</li>
                                            <li>Sounds respect your browser's audio settings</li>
                                            <li>You can preview sounds before selecting them</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 p-6 border-t border-base-300 bg-base-200/30">
                <div className="flex justify-between items-center">
                    <p className="text-sm text-base-content/60">
                        Current theme: <span className="font-medium capitalize">{currentTheme}</span>
                    </p>
                    <button
                        onClick={closeModal}
                        className="btn btn-primary"
                    >
                        Done
                    </button>
                </div>
            </div>
        </IOSModal>
    );
}

export default AppearanceModal;