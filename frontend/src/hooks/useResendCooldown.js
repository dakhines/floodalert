// Hook to block "resend code" spam (cooldown timer).
import { useEffect, useState } from "react";

function getStoredRemainingSeconds(storageKey) {
    if (!storageKey) {
        return 0;
    }

    const expiresAt = Number(sessionStorage.getItem(storageKey) || 0);
    if (!expiresAt) {
        return 0;
    }

    return Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
}

export default function useResendCooldown(
    seconds = 30,
    initialSeconds = 0,
    storageKey = ""
) {
    const [remainingSeconds, setRemainingSeconds] = useState(() =>
        Math.max(initialSeconds, getStoredRemainingSeconds(storageKey))
    );

    useEffect(() => {
        if (remainingSeconds <= 0) {
            if (storageKey) {
                sessionStorage.removeItem(storageKey);
            }
            return undefined;
        }

        const timer = setTimeout(() => {
            setRemainingSeconds((current) => Math.max(0, current - 1));
        }, 1000);

        return () => clearTimeout(timer);
    }, [remainingSeconds, storageKey]);

    return {
        cooldownSeconds: remainingSeconds,
        isCoolingDown: remainingSeconds > 0,
        startCooldown: () => {
            if (storageKey) {
                sessionStorage.setItem(
                    storageKey,
                    String(Date.now() + seconds * 1000)
                );
            }
            setRemainingSeconds(seconds);
        },
        clearCooldown: () => {
            if (storageKey) {
                sessionStorage.removeItem(storageKey);
            }
            setRemainingSeconds(0);
        },
    };
}
