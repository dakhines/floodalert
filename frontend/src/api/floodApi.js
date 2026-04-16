const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

function unwrapResponse(payload) {
    if (payload && typeof payload === "object" && "data" in payload) {
        return payload.data;
    }

    return payload;
}

function normalizeLocation(item, fallbackLocation = "") {
    if (!item) {
        return null;
    }

    const location = item.location || item.city || item.name || fallbackLocation;
    const latestUpdate =
        item.latestUpdate && typeof item.latestUpdate === "object"
            ? item.latestUpdate
            : {
                  type: item.type || "Update",
                  summary: item.summary || "No update available.",
              };

    return {
        ...item,
        location,
        status: item.status || "Safe",
        action: item.action || "Monitor official updates",
        reason: item.reason || "No detailed reason available.",
        lastUpdate: item.lastUpdate || item.timestamp || "",
        latestUpdate: {
            type: latestUpdate.type || "Update",
            summary: latestUpdate.summary || "No update available.",
        },
    };
}

function normalizeUpdate(item) {
    if (!item) {
        return null;
    }

    return {
        ...item,
        location: item.location || item.city || item.name || "",
        type: item.type || item.latestUpdate?.type || "Update",
        summary:
            item.summary ||
            item.message ||
            item.latestUpdate?.summary ||
            "No update summary available.",
        timestamp: item.timestamp || item.lastUpdate || item.time || "",
    };
}

async function request(path, signal) {
    const response = await fetch(`${API_BASE_URL}${path}`, { signal });

    if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
    }

    const payload = await response.json();
    return unwrapResponse(payload);
}

export async function fetchLocations(signal) {
    const data = await request("/locations", signal);
    const locations = Array.isArray(data) ? data : [];

    return locations.map((item) => normalizeLocation(item)).filter(Boolean);
}

export async function fetchUpdates(signal) {
    const data = await request("/updates", signal);
    const updates = Array.isArray(data) ? data : [];

    return updates.map((item) => normalizeUpdate(item)).filter(Boolean);
}

export async function fetchLocationByName(name, signal) {
    const data = await request(`/locations/${encodeURIComponent(name)}`, signal);
    return normalizeLocation(data, name);
}
