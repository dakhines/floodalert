// Status styling helpers (maps backend status text to badge colors).
export const STATUS_STYLES = {
    Safe: "bg-green-600 border-green-900/25 text-white",
    "Risk Rising": "bg-yellow-400 border-yellow-700/25 text-slate-950",
    Warning: "bg-orange-500 border-orange-900/25 text-white",
    "Flood Confirmed": "bg-red-600 border-red-900/25 text-white",
    Evacuate: "bg-red-900 border-red-900/25 text-white",
};

export function getStatusClasses(status) {
    return STATUS_STYLES[status] || STATUS_STYLES.Safe;
}

export function formatDisplayTime(value) {
    if (!value) {
        return "";
    }

    const isoDate = new Date(value);

    if (!Number.isNaN(isoDate.getTime())) {
        return isoDate.toLocaleString(undefined, {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        });
    }

    const match = String(value).match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})/);

    if (!match) {
        return value;
    }

    const [, day, month, year, hour, minute] = match;
    const parsedDate = new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hour),
        Number(minute)
    );

    return parsedDate.toLocaleString(undefined, {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });
}
