import { useState, useRef } from "react";
import { Camera, User } from "lucide-react";

const ProfilePicUpload = ({ onImageSelect, selectedImage }) => {
    const fileInputRef = useRef(null);
    const [previewUrl, setPreviewUrl] = useState(selectedImage || null);

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Create preview URL
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);

            // Pass the file to parent component
            onImageSelect(file);
        }
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="flex flex-col items-center">
            <div
                className="relative w-24 h-24 cursor-pointer transition-colors group"
                onClick={handleClick}
            >
                {previewUrl ? (
                    <div className="w-24 h-24 rounded-full border-2 border-dashed border-base-300 hover:border-primary overflow-hidden">
                        <img
                            src={previewUrl}
                            alt="Profile preview"
                            className="w-full h-full object-cover"
                        />
                    </div>
                ) : (
                    <div className="w-24 h-24 rounded-full border-2 border-dashed border-base-300 hover:border-primary bg-base-200 text-base-content flex items-center justify-center">
                        <User className="w-10 h-10" />
                    </div>
                )}

                {/* Camera overlay */}
                <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-6 h-6 text-white" />
                </div>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="file-input file-input-bordered hidden"
            />

            <label className="label">
                <span className="label-text-alt text-base-content/70 text-center">
                    Click to upload profile picture
                </span>
            </label>
        </div>
    );
};

export default ProfilePicUpload;