// Location controller: returns live location status (rule-based), and optionally adds AI summary.
const {
    getRawDataByState,
    getRawDataByCity,
} = require("../services/rawDataService");
const { analyzeLocation } = require("../services/aiService");

function isAiAuthIssue(error) {
    const message = String(error?.message || "");

    return (
        message.includes("Gemini API key is invalid or missing") ||
        message.includes("401") ||
        message.includes("Unauthorized") ||
        message.includes("invalid authentication credentials")
    );
}

function buildAiInput(location) {
    return {
        weatherAlert:
            location.weather?.warning || location.weather?.forecast || "",
        officialNotice: location.officialNotice?.notice || "",
        publicInfobanjir: {
            floodAlert: location.publicInfobanjir?.floodAlert?.summary || "",
            metAlert: location.publicInfobanjir?.metAlert?.summary || "",
            currentAlert: location.publicInfobanjir?.currentAlert?.summary || "",
            siren: location.publicInfobanjir?.siren?.summary || "",
        },
        waterLevelContext: location.latestUpdate?.summary || "",
        satellite:
            location.satellite?.hasFloodSignal !== undefined
                ? {
                      source: location.satellite.source,
                      hasFloodSignal: location.satellite.hasFloodSignal,
                      waterFraction: location.satellite.waterFraction,
                      note: location.satellite.note,
                  }
                : location.satellite?.status === "disabled"
                ? location.satellite
                : null,
        reason: location.reason || "",
    };
}

function mergeDefined(base, overrides) {
    const merged = { ...base };

    Object.entries(overrides || {}).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
            merged[key] = value;
        }
    });

    return merged;
}

function buildShortFallbackSummary(location) {
    const areaName = location?.location || "This area";
    const status = location?.status || "Safe";

    if (status === "Evacuate") {
        return `${areaName}: Official evacuation signal is active. Evacuate immediately and follow authorities.`;
    }

    if (status === "Flood Confirmed") {
        return `${areaName}: Flood confirmed nearby. Follow official instructions immediately.`;
    }

    if (status === "Warning") {
        return `${areaName}: Warning level reached. Avoid low-lying areas and stay alert.`;
    }

    if (status === "Risk Rising") {
        return `${areaName}: Risk is rising. Prepare essentials and monitor official updates.`;
    }

    return `${areaName}: No immediate flood risk now. Keep monitoring updates.`;
}

async function safelyAnalyzeLocation(location) {
    try {
        const aiResult = await analyzeLocation({
            ...location,
            aiContext: buildAiInput(location),
        });

        const mergedLocation = mergeDefined(location, aiResult);
        const baseStatus = location.status || "Safe";
        const mergedStatus = mergedLocation.status || baseStatus;

        // "Evacuate" is strictly rule-based (official-only). Never allow AI to set it,
        // and never allow AI to downgrade it when it is already present.
        const finalStatus =
            baseStatus === "Evacuate"
                ? "Evacuate"
                : mergedStatus === "Evacuate"
                ? baseStatus
                : mergedStatus;

        return {
            ...mergedLocation,
            location: location.location,
            state: location.state,
            status: finalStatus || "Safe",
            action:
                finalStatus === "Evacuate"
                    ? "Evacuate immediately"
                    : mergedLocation.action || "No immediate action needed",
            reason:
                mergedLocation.reason ||
                "No significant flood risk detected at the moment",
            latestUpdate: {
                type:
                    mergedLocation.latestUpdate?.type ||
                    location.latestUpdate?.type ||
                    "Update",
                summary:
                    mergedLocation.latestUpdate?.summary ||
                    location.latestUpdate?.summary ||
                    "No significant flood risk detected at the moment",
            },
            lastUpdate: mergedLocation.lastUpdate || location.lastUpdate,
            userSummary:
                mergedLocation.userSummary ||
                location.userSummary ||
                mergedLocation.latestUpdate?.summary ||
                location.latestUpdate?.summary ||
                "No significant flood risk detected at the moment.",
            sourceNote:
                mergedLocation.sourceNote ||
                location.sourceNote ||
                "Based on the latest available flood monitoring data.",
            stationId: location.stationId,
            stationName: location.stationName,
            district: location.district,
            basin: location.basin,
            subBasin: location.subBasin,
            waterLevel: location.waterLevel,
            thresholds: location.thresholds,
            weather: location.weather,
            officialNotice: location.officialNotice,
            publicInfobanjir: location.publicInfobanjir,
            satellite: location.satellite,
        };
    } catch (error) {
        if (isAiAuthIssue(error)) {
            console.warn(
                "AI analysis unavailable. Using rule-based flood summary instead."
            );
        } else {
            console.warn(
                `AI analysis unavailable. Using rule-based flood summary instead. (${error.message})`
            );
        }
        return {
            ...location,
            status: location.status || "Safe",
            action: location.action || "No immediate action needed",
            reason:
                location.reason ||
                "No significant flood risk detected at the moment",
            aiSummary: buildShortFallbackSummary(location),
            userSummary: buildShortFallbackSummary(location),
            sourceNote:
                location.sourceNote ||
                "Based on the latest available flood monitoring data.",
        };
    }
}

async function fetchAllLocations(req, res) {
    try {
        const state = req.query.state;

        if (!state) {
            return res.status(400).json({ error: "State is required" });
        }

        const locations = await getRawDataByState(state);
        return res.json(locations);
    } catch (error) {
        console.error("fetchAllLocations error:", error.message);
        return res.status(500).json({ error: "Failed to fetch live locations" });
    }
}

async function fetchLocationByName(req, res) {
    try {
        const state = req.query.state;
        const district = req.query.district || "";
        const shouldAnalyze = req.query.ai !== "false";
        const locationName = req.params.name;

        if (!state) {
            return res.status(400).json({ error: "State is required" });
        }

        const results = await getRawDataByCity(locationName, state, district, {
            enrich: shouldAnalyze,
        });
        const location = results[0];

        if (!location) {
            return res.status(404).json({ error: "Location not found" });
        }

        const analyzedLocation = shouldAnalyze
            ? await safelyAnalyzeLocation(location)
            : location;

        const finalLocation = {
            ...analyzedLocation,
            location: locationName,
        };

        return res.json(finalLocation);
    } catch (error) {
        console.error("fetchLocationByName error:", error.message);
        return res.status(500).json({ error: "Failed to fetch live location" });
    }
}

module.exports = {
    fetchAllLocations,
    fetchLocationByName,
};
