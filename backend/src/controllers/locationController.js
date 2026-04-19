const {
    getRawDataByState,
    getRawDataByCity,
} = require("../services/rawDataService");
const { analyzeLocation } = require("../services/aiService");

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

async function safelyAnalyzeLocation(location) {
    try {
        const aiResult = await analyzeLocation({
            ...location,
            aiContext: buildAiInput(location),
        });

        const mergedLocation = mergeDefined(location, aiResult);

        return {
            ...mergedLocation,
            location: location.location,
            state: location.state,
            status: mergedLocation.status || "Safe",
            action: mergedLocation.action || "No immediate action needed",
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
            updates: location.updates || [],
        };
    } catch (error) {
        if (error.message === "Gemini API key is invalid or missing.") {
            console.error("AI analysis failed:", error.message);
        } else {
            console.error("AI analysis failed:", error.message);
        }
        return {
            ...location,
            status: location.status || "Safe",
            action: location.action || "No immediate action needed",
            reason:
                location.reason ||
                "No significant flood risk detected at the moment",
            aiSummary: location.latestUpdate?.summary || location.reason,
            userSummary:
                location.userSummary ||
                location.latestUpdate?.summary ||
                location.reason ||
                "No significant flood risk detected at the moment.",
            sourceNote:
                location.sourceNote ||
                "Based on the latest available flood monitoring data.",
            updates: location.updates || [],
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
