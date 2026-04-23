// Handles profile image preview + upload (UI only).
import { useRef, useState } from "react";
import { User, X } from "lucide-react";

const INITIAL_IMAGE_SIZE = 900;
const MIN_IMAGE_SIZE = 360;
const INITIAL_IMAGE_QUALITY = 0.82;
const MIN_IMAGE_QUALITY = 0.58;
const MAX_DATA_URL_LENGTH = 900 * 1024;

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = src;
    });
}

function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function drawImageToDataUrl(image, maxSize, quality) {
    const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    context.drawImage(image, 0, 0, width, height);

    return canvas.toDataURL("image/jpeg", quality);
}

async function compressImage(file) {
    const dataUrl = await readFileAsDataUrl(file);
    const image = await loadImage(dataUrl);

    for (
        let maxSize = INITIAL_IMAGE_SIZE;
        maxSize >= MIN_IMAGE_SIZE;
        maxSize -= 180
    ) {
        for (
            let quality = INITIAL_IMAGE_QUALITY;
            quality >= MIN_IMAGE_QUALITY;
            quality -= 0.08
        ) {
            const compressed = drawImageToDataUrl(image, maxSize, quality);

            if (compressed.length <= MAX_DATA_URL_LENGTH) {
                return compressed;
            }
        }
    }

    return drawImageToDataUrl(image, MIN_IMAGE_SIZE, MIN_IMAGE_QUALITY);
}

export default function ProfileImageUploader({
    savedProfileImage = "",
    onSave,
}) {
    const inputRef = useRef(null);
    const [pendingProfileImage, setPendingProfileImage] = useState("");
    const [markedForRemoval, setMarkedForRemoval] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState("");
    const previewImage = pendingProfileImage || savedProfileImage;
    const displayedImage = markedForRemoval ? "" : previewImage;
    const hasUnsavedChange = Boolean(pendingProfileImage) || markedForRemoval;

    const handleChange = async (event) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        if (!file.type.startsWith("image/")) {
            setError("Please choose an image file.");
            return;
        }

        try {
            setError("");
            const nextImage = await compressImage(file);
            if (nextImage.length > MAX_DATA_URL_LENGTH) {
                setError("Image is too large. Please choose a smaller photo.");
                return;
            }

            setPendingProfileImage(nextImage);
            setMarkedForRemoval(false);
        } catch {
            setError("Unable to read this image.");
        } finally {
            if (inputRef.current) {
                inputRef.current.value = "";
            }
        }
    };

    const handleSave = async () => {
        if (!hasUnsavedChange) {
            return;
        }

        try {
            setIsSaving(true);
            setError("");
            await onSave?.({
                profileImage: markedForRemoval ? "" : pendingProfileImage,
                removeProfileImage: markedForRemoval,
            });
            setPendingProfileImage("");
            setMarkedForRemoval(false);
            // TODO: Replace base64 profile images with uploaded image URLs from backend storage.
        } catch (saveError) {
            setError(saveError.message || "Unable to save photo.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setPendingProfileImage("");
        setMarkedForRemoval(false);
        setError("");
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
            {error && (
                <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                    {error}
                </p>
            )}
            {hasUnsavedChange && (
                <div className="mt-3 flex justify-center gap-2">
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving}
                        className="rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white"
                    >
                        {isSaving ? "Saving..." : "Save Photo"}
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
