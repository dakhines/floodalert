import { useRef, useState } from "react";
import { User, X } from "lucide-react";

export default function ProfileImageUploader({
    savedProfileImage = "",
    onSave,
}) {
    const inputRef = useRef(null);
    const [pendingProfileImage, setPendingProfileImage] = useState("");
    const [markedForRemoval, setMarkedForRemoval] = useState(false);
    const previewImage = pendingProfileImage || savedProfileImage;
    const displayedImage = markedForRemoval ? "" : previewImage;
    const hasUnsavedChange = Boolean(pendingProfileImage) || markedForRemoval;

    const handleChange = (event) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            setPendingProfileImage(reader.result);
            setMarkedForRemoval(false);
        };
        reader.readAsDataURL(file);
    };

    const handleSave = () => {
        if (!hasUnsavedChange) {
            return;
        }

        onSave?.({
            profileImage: markedForRemoval ? "" : pendingProfileImage,
            removeProfileImage: markedForRemoval,
        });
        setPendingProfileImage("");
        setMarkedForRemoval(false);
        // TODO: Upload profile image URL/asset through backend user profile API.
    };

    const handleCancel = () => {
        setPendingProfileImage("");
        setMarkedForRemoval(false);
        if (inputRef.current) {
            inputRef.current.value = "";
        }
    };

    const handleRemove = () => {
        if (pendingProfileImage) {
            setPendingProfileImage("");
            setMarkedForRemoval(false);
            return;
        }

        setMarkedForRemoval(true);
    };

    return (
        <section className="mt-5 rounded-2xl border border-slate-300 p-4 text-center">
            <div className="relative mx-auto h-24 w-24">
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-slate-100">
                    {displayedImage ? (
                    <img
                        src={displayedImage}
                        alt="Profile"
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <User size={40} className="text-slate-400" />
                )}
                </div>
                {previewImage && (
                    <button
                        type="button"
                        onClick={handleRemove}
                        className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-slate-950 text-white shadow"
                        aria-label="Remove profile image"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>
            <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="mt-4 rounded-full bg-blue-600 px-4 py-2 text-sm font-bold text-white"
            >
                {displayedImage ? "Change Photo" : "Upload Photo"}
            </button>
            {hasUnsavedChange && (
                <div className="mt-3 flex justify-center gap-2">
                    <button
                        type="button"
                        onClick={handleSave}
                        className="rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white"
                    >
                        Save Photo
                    </button>
                    <button
                        type="button"
                        onClick={handleCancel}
                        className="rounded-full border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700"
                    >
                        Cancel
                    </button>
                </div>
            )}
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                onChange={handleChange}
                className="hidden"
            />
        </section>
    );
}
