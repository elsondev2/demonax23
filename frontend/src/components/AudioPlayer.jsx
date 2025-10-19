import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

function AudioPlayer({ src, isOwnMessage = false }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [volume, setVolume] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(false);
    const audioRef = useRef(null);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleLoadedMetadata = () => {
            setDuration(audio.duration);
            setIsLoading(false);
        };

        const handleTimeUpdate = () => {
            setCurrentTime(audio.currentTime);
        };

        const handleEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0);
        };

        const handleError = () => {
            setError(true);
            setIsLoading(false);
        };

        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('error', handleError);

        return () => {
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('error', handleError);
        };
    }, []);

    const togglePlay = () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            audio.pause();
        } else {
            audio.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleSeek = (e) => {
        const audio = audioRef.current;
        if (!audio) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = x / rect.width;
        const newTime = percentage * duration;

        audio.currentTime = newTime;
        setCurrentTime(newTime);
    };

    const toggleMute = () => {
        const audio = audioRef.current;
        if (!audio) return;

        audio.muted = !isMuted;
        setIsMuted(!isMuted);
    };

    const handleVolumeChange = (e) => {
        const audio = audioRef.current;
        if (!audio) return;

        const newVolume = parseFloat(e.target.value);
        audio.volume = newVolume;
        setVolume(newVolume);

        if (newVolume === 0) {
            setIsMuted(true);
        } else if (isMuted) {
            setIsMuted(false);
        }
    };

    const formatTime = (time) => {
        if (isNaN(time)) return '0:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    if (error) {
        return (
            <div className={`p-3 rounded-lg ${isOwnMessage ? 'bg-error/20 text-primary-content' : 'bg-error/10 text-error'}`}>
                <p className="text-xs">Failed to load audio</p>
            </div>
        );
    }

    return (
        <div className={`flex items-center gap-3 p-3 rounded-lg min-w-[280px] border ${isOwnMessage
            ? 'bg-primary-content/20 border-primary-content/30'
            : 'bg-base-300/30 border-base-300'
            }`}>
            <audio ref={audioRef} src={src} preload="metadata" />

            {/* Play/Pause Button */}
            <button
                onClick={togglePlay}
                disabled={isLoading}
                className={`btn btn-circle btn-sm ${isOwnMessage
                    ? 'bg-primary-content/30 hover:bg-primary-content/40 text-primary-content border-primary-content/40'
                    : 'bg-primary/20 hover:bg-primary/30 text-primary border-none'
                    }`}
            >
                {isLoading ? (
                    <span className="loading loading-spinner loading-xs"></span>
                ) : isPlaying ? (
                    <Pause className="w-4 h-4" />
                ) : (
                    <Play className="w-4 h-4 ml-0.5" />
                )}
            </button>

            {/* Progress Bar and Time */}
            <div className="flex-1 min-w-0">
                {/* Time Display */}
                <div className={`flex justify-between text-xs mb-1 ${isOwnMessage ? 'text-primary-content/70' : 'text-base-content/60'
                    }`}>
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                </div>

                {/* Progress Bar */}
                <div
                    className={`h-1.5 rounded-full cursor-pointer relative ${isOwnMessage ? 'bg-primary-content/20' : 'bg-base-content/20'
                        }`}
                    onClick={handleSeek}
                >
                    <div
                        className={`h-full rounded-full transition-all ${isOwnMessage ? 'bg-primary-content' : 'bg-primary'
                            }`}
                        style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                    />

                    {/* Playhead */}
                    <div
                        className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full shadow-md ${isOwnMessage ? 'bg-primary-content' : 'bg-primary'
                            }`}
                        style={{ left: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`, marginLeft: '-6px' }}
                    />
                </div>
            </div>

            {/* Volume Control */}
            <div className="flex items-center gap-2">
                <button
                    onClick={toggleMute}
                    className={`btn btn-ghost btn-xs btn-circle ${isOwnMessage ? 'text-primary-content/70 hover:text-primary-content' : 'text-base-content/60 hover:text-base-content'
                        }`}
                >
                    {isMuted || volume === 0 ? (
                        <VolumeX className="w-4 h-4" />
                    ) : (
                        <Volume2 className="w-4 h-4" />
                    )}
                </button>

                {/* Volume Slider - Hidden on mobile */}
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={handleVolumeChange}
                    className={`range range-xs w-16 hidden md:block ${isOwnMessage ? 'range-primary-content' : 'range-primary'
                        }`}
                />
            </div>
        </div>
    );
}

export default AudioPlayer;
