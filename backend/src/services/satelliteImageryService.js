const axios = require("axios");
const fs = require("fs");

let earthEngine = null;
let initializationPromise = null;

function isSatelliteEnabled() {
  return String(process.env.SATELLITE_IMAGERY_ENABLED || "").toLowerCase() === "true";
}

function getPrivateKey() {
  if (process.env.EE_PRIVATE_KEY_JSON) {
    return JSON.parse(process.env.EE_PRIVATE_KEY_JSON);
  }

  if (process.env.EE_PRIVATE_KEY_PATH) {
    return JSON.parse(fs.readFileSync(process.env.EE_PRIVATE_KEY_PATH, "utf8"));
  }

  if (process.env.EE_SERVICE_ACCOUNT && process.env.EE_PRIVATE_KEY) {
    return {
      client_email: process.env.EE_SERVICE_ACCOUNT,
      private_key: process.env.EE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    };
  }

  return null;
}

function loadEarthEngine() {
  if (earthEngine) {
    return earthEngine;
  }

  try {
    // Optional dependency. The app still works when Earth Engine is not configured.
    earthEngine = require("@google/earthengine");
    return earthEngine;
  } catch (error) {
    console.error("Earth Engine package is not installed:", error.message);
    return null;
  }
}

async function initializeEarthEngine() {
  if (!isSatelliteEnabled()) {
    return null;
  }

  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = new Promise((resolve, reject) => {
    const ee = loadEarthEngine();
    const privateKey = getPrivateKey();

    if (!ee || !privateKey) {
      resolve(null);
      return;
    }

    ee.data.authenticateViaPrivateKey(
      privateKey,
      () => {
        ee.initialize(
          null,
          null,
          () => resolve(ee),
          (error) => reject(error)
        );
      },
      (error) => reject(error)
    );
  }).catch((error) => {
    console.error("Earth Engine initialization failed:", error.message || error);
    initializationPromise = null;
    return null;
  });

  return initializationPromise;
}

async function geocodeLocation(location, district, state) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return null;
  }

  try {
    const address = [location, district, state, "Malaysia"].filter(Boolean).join(", ");
    const response = await axios.get("https://maps.googleapis.com/maps/api/geocode/json", {
      timeout: 8000,
      params: {
        address,
        key: apiKey,
      },
    });
    const result = response.data?.results?.[0];
    const point = result?.geometry?.location;

    if (!point) {
      return null;
    }

    return {
      lat: point.lat,
      lng: point.lng,
      formattedAddress: result.formatted_address || address,
    };
  } catch (error) {
    console.error("Google geocoding failed:", error.message);
    return null;
  }
}

function evaluateEeObject(eeObject) {
  return new Promise((resolve, reject) => {
    eeObject.evaluate((value, error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(value);
    });
  });
}

async function analyzeSatelliteFloodSignal({ location, district, state }) {
  if (!isSatelliteEnabled()) {
    return {
      status: "disabled",
      note: "Satellite imagery is currently disabled in backend configuration. Requires Google Earth Engine and SATELLITE_IMAGERY_ENABLED=true.",
    };
  }

  const ee = await initializeEarthEngine();

  if (!ee) {
    return {
      status: "disabled",
      note: "Satellite imagery failed to initialize. Please check Google Earth Engine credentials.",
    };
  }

  const point = await geocodeLocation(location, district, state);

  if (!point) {
    return {
      status: "disabled",
      note: "Could not geocode location to check satellite imagery.",
    };
  }

  try {
    const lookbackDays = Number(process.env.SATELLITE_LOOKBACK_DAYS || 7);
    const bufferMeters = Number(process.env.SATELLITE_BUFFER_METERS || 5000);
    const waterThreshold = Number(process.env.SATELLITE_WATER_THRESHOLD || -17);
    const area = ee.Geometry.Point([point.lng, point.lat]).buffer(bufferMeters);
    const end = ee.Date(new Date().toISOString());
    const start = end.advance(-lookbackDays, "day");
    const collection = ee
      .ImageCollection("COPERNICUS/S1_GRD")
      .filterBounds(area)
      .filterDate(start, end)
      .filter(ee.Filter.eq("instrumentMode", "IW"))
      .filter(ee.Filter.listContains("transmitterReceiverPolarisation", "VV"))
      .select("VV");
    const image = collection.median();
    const waterMask = image.lt(waterThreshold);
    const stats = ee.Dictionary({
      imageCount: collection.size(),
      waterFraction: waterMask.reduceRegion({
        reducer: ee.Reducer.mean(),
        geometry: area,
        scale: 30,
        maxPixels: 1e8,
      }).get("VV"),
    });
    const result = await evaluateEeObject(stats);
    const imageCount = Number(result?.imageCount || 0);
    const waterFraction = Number(result?.waterFraction || 0);

    if (imageCount === 0 || !Number.isFinite(waterFraction)) {
      return null;
    }

    return {
      source: "Google Earth Engine Sentinel-1",
      location: point.formattedAddress,
      imageCount,
      waterFraction,
      hasFloodSignal: waterFraction >= Number(process.env.SATELLITE_FLOOD_WATER_FRACTION || 0.18),
      lastUpdate: new Date().toISOString(),
      note:
        "Satellite signal is used only when no direct JPS area match is available. JPS water-level data remains the primary flood signal.",
    };
  } catch (error) {
    console.error("Satellite imagery analysis failed:", error.message || error);
    return null;
  }
}

module.exports = {
  analyzeSatelliteFloodSignal,
};
