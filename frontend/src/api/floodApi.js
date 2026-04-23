// Flood/location API calls to the backend (with caching so the UI feels fast).
import { formatDisplayTime } from "../utils/floodStatus";

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// Simple in-memory caches so we don't spam the backend when users click around.
// This makes the app feel faster on mobile.
const locationCache = new Map();
const locationsCache = new Map();
const inFlightRequests = new Map();

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

    const rawLastUpdate = item.lastUpdate || item.timestamp || "";

    return {
        ...item,
        location,
        status: item.status || "Safe",
        action: item.action || "Monitoring",
        reason:
            item.reason || "No significant flood risk detected at the moment",
        rawLastUpdate,
        lastUpdate: formatDisplayTime(rawLastUpdate),
        latestUpdate: {
            type: latestUpdate.type || "Update",
            summary: latestUpdate.summary || "No recent official update.",
        },
        stations: item.stations || [],
        dataBasis: item.dataBasis || "unknown",
        confidence: item.confidence || "low",
        sourceNote: item.sourceNote || "",
    };
}

async function request(path, signal) {
    const inFlightKey = signal ? "" : path;

    if (inFlightKey && inFlightRequests.has(inFlightKey)) {
        return inFlightRequests.get(inFlightKey);
    }

    const requestPromise = fetch(`${API_BASE_URL}${path}`, { signal })
        .then(async (response) => {
            if (!response.ok) {
                throw new Error(`Request failed: ${response.status}`);
            }

            const payload = await response.json();
            return unwrapResponse(payload);
        })
        .finally(() => {
            if (inFlightKey) {
                inFlightRequests.delete(inFlightKey);
            }
        });

    if (inFlightKey) {
        inFlightRequests.set(inFlightKey, requestPromise);
    }

    return requestPromise;
}

export async function fetchLocations(state, signal) {
    if (!state) {
        return [];
    }

    const cacheKey = state.toLowerCase();

    if (!signal && locationsCache.has(cacheKey)) {
        return locationsCache.get(cacheKey);
    }

    const data = await request(
        `/locations?state=${encodeURIComponent(state)}`,
        signal
    );
    const locations = Array.isArray(data) ? data : [];

    const normalizedLocations = locations
        .map((item) => normalizeLocation(item))
        .filter(Boolean);

    locationsCache.set(cacheKey, normalizedLocations);
    return normalizedLocations;
}

function getLocationCacheKey(name, state, district = "", includeAi = true) {
    return [name, state, district, includeAi ? "ai" : "base"]
        .map((value) => String(value || "").trim().toLowerCase())
        .join("|");
}

export function getCachedLocationByName(
    name,
    state,
    district = "",
    includeAi = true
) {
    return locationCache.get(
        getLocationCacheKey(name, state, district, includeAi)
    );
}

export async function fetchLocationByName(
    name,
    state,
    signal,
    district = "",
    options = {}
) {
    if (!state) {
        throw new Error("State is required to fetch location data.");
    }

    const includeAi = options.includeAi !== false;
    const cacheKey = getLocationCacheKey(name, state, district, includeAi);

    if (!options.force && locationCache.has(cacheKey)) {
        return locationCache.get(cacheKey);
    }

    const districtQuery = district
        ? `&district=${encodeURIComponent(district)}`
        : "";
    const aiQuery = includeAi ? "" : "&ai=false";

    const data = await request(
        `/locations/${encodeURIComponent(name)}?state=${encodeURIComponent(state)}${districtQuery}${aiQuery}`,
        signal
    );

    const normalizedLocation = normalizeLocation(data, name);
    locationCache.set(cacheKey, normalizedLocation);
    return normalizedLocation;
}
