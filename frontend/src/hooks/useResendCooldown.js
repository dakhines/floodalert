import { useEffect, useState } from "react";

export default function useResendCooldown(seconds = 30, initialSeconds = 0) {
    const [remainingSeconds, setRemainingSeconds] = useState(initialSeconds);

    useEffect(() => {
        if (remainingSeconds <= 0) {
            return undefined;
        }

        const timer = setTimeout(() => {
            setRemainingSeconds((current) => Math.max(0, current - 1));
        }, 1000);

        return () => clearTimeout(timer);
    }, [remainingSeconds]);

    return {
        cooldownSeconds: remainingSeconds,
        isCoolingDown: remainingSeconds > 0,
        startCooldown: () => setRemainingSeconds(seconds),
    };
}
