const axios = require("axios");
const cheerio = require("cheerio");
const { getLocationAliases } = require("../data/locationAliases");
const { MALAYSIA_LOCATION_DATA } = require("../data/locations");
const { analyzeSatelliteFloodSignal } = require("./satelliteImageryService");

const INFOBANJIR_SOURCES = {
  floodAlert:
    "https://publicinfobanjir.water.gov.my/ramalan/amaran-banjir/?lang=en",
  metAlert: "https://publicinfobanjir.water.gov.my/ramalan/met-alert/?lang=en",
  currentAlert:
    "https://publicinfobanjir.water.gov.my/cerapan/amaran-semasa/?lang=en",
  siren: "https://publicinfobanjir.water.gov.my/cerapan/siren/?lang=en",
};
const NADMA_DISASTER_INFO_URL = "https://www.nadma.gov.my/bm/#informasi-bencana";
const WEATHER_CACHE_TTL_MS = 10 * 60 * 1000;
const WEATHER_RATE_LIMIT_COOLDOWN_MS = 5 * 60 * 1000;

const STATE_CODE_MAP = {
  Selangor: ["SEL", "10"],
  Melaka: ["MLK", "04"],
  Johor: ["JHR", "01"],
  Pahang: ["PHG", "06"],
  Kelantan: ["KTN", "03"],
  Kedah: ["KDH", "02"],
  Perak: ["PRK", "08"],
  Perlis: ["PLS", "09"],
  "Pulau Pinang": ["PNG", "07"],
  Terengganu: ["TRG", "11"],
  Sabah: ["Sabah", "sabah", "SBH", "12"],
  Sarawak: ["Sarawak", "sarawak", "SWK", "13"],
  "Negeri Sembilan": ["NSN", "05"],
  "Kuala Lumpur": ["Wilayah Persekutuan Kuala Lumpur", "Kuala Lumpur", "kuala lumpur", "WKL", "14"],
  "Wilayah Persekutuan Kuala Lumpur": ["Wilayah Persekutuan Kuala Lumpur", "Kuala Lumpur", "kuala lumpur", "WKL", "14"],
  Putrajaya: ["Wilayah Persekutuan Putrajaya", "Putrajaya", "putrajaya", "WPT", "16"],
  "Wilayah Persekutuan Putrajaya": ["Wilayah Persekutuan Putrajaya", "Putrajaya", "putrajaya", "WPT", "16"],
  Labuan: ["Wilayah Persekutuan Labuan", "Labuan", "labuan", "WLB", "15"],
  "Wilayah Persekutuan Labuan": ["Wilayah Persekutuan Labuan", "Labuan", "labuan", "WLB", "15"],
};

const stateCodeCache = new Map();
const weatherCache = new Map();
const weatherPendingRequests = new Map();
let metMalaysiaCooldownUntil = 0;

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function getStateCodes(state) {
  const normalized = normalize(state);

  return Object.entries(STATE_CODE_MAP).find(
    ([stateName]) => normalize(stateName) === normalized
  )?.[1] || [];
}

function getStateCode(state) {
  return getStateCodes(state)[0];
}

function toNumber(value) {
  const numericValue = Number.parseFloat(String(value || "").replace(/,/g, ""));
  return Number.isFinite(numericValue) ? numericValue : null;
}

function compactText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function getLastUpdateFromText(text) {
  return compactText(text).match(/Last Update:\s*([^|]+)/i)?.[1]?.trim() || "";
}

function getRelevantText(text, terms, maxLength = 260) {
  const normalizedText = compactText(text);
  const normalizedTerms = terms.map(normalize).filter(Boolean);
  const lowerText = normalize(normalizedText);
  const matchIndex = normalizedTerms
    .map((term) => lowerText.indexOf(term))
    .filter((index) => index >= 0)
    .sort((a, b) => a - b)[0];
  const start = matchIndex >= 0 ? Math.max(0, matchIndex - 80) : 0;

  return normalizedText.slice(start, start + maxLength).trim();
}

function mapStatusFromThresholds(waterLevel, thresholds) {
  if (
    thresholds.danger !== null &&
    waterLevel !== null &&
    waterLevel >= thresholds.danger
  ) {
    return "Flood Confirmed";
  }

  if (
    thresholds.warning !== null &&
    waterLevel !== null &&
    waterLevel >= thresholds.warning
  ) {
    return "Risk Rising";
  }

  if (
    thresholds.alert !== null &&
    waterLevel !== null &&
    waterLevel >= thresholds.alert
  ) {
    return "Warning";
  }

  return "Safe";
}

function mapAction(status) {
  if (status === "Flood Confirmed") return "Evacuate immediately";
  if (status === "Risk Rising") return "Prepare essentials and monitor updates";
  if (status === "Warning") return "Avoid low-lying areas and stay alert";
  return "No immediate action needed";
}

function getRiskLabel(status) {
  if (status === "Flood Confirmed") return "Danger";
  if (status === "Risk Rising") return "Warning";
  if (status === "Warning") return "Alert";
  return "Normal";
}

function buildUserSummary(item) {
  const locationName = item.location || item.district || "this area";

  if (item.status === "Safe") {
    return `${locationName} is currently marked Safe. No immediate action is needed, but keep checking updates if heavy rain continues.`;
  }

  return `${locationName} is currently marked ${item.status}. ${item.action || "Follow official guidance and monitor updates."}`;
}

function buildSourceNote(item, optionalSources = {}) {
  const sources = [];
  const hasInfobanjirContent = Boolean(
    optionalSources.publicInfobanjir?.floodAlert?.summary ||
      optionalSources.publicInfobanjir?.metAlert?.summary ||
      optionalSources.publicInfobanjir?.currentAlert?.summary ||
      optionalSources.publicInfobanjir?.siren?.summary
  );

  if (item.stationName || item.waterLevel !== null) {
    sources.push("live JPS water-level data");
  }

  if (optionalSources.weather?.forecast || optionalSources.weather?.warning) {
    sources.push("METMalaysia or Public Infobanjir weather alerts");
  }

  if (optionalSources.officialNotice?.notice) {
    sources.push("NADMA official notices");
  }

  if (hasInfobanjirContent) {
    sources.push("Public Infobanjir notices");
  }

  if (sources.length === 0) {
    return "Based on the latest available flood monitoring data.";
  }

  return `Based on ${sources.join(", ")}.`;
}

function extractRows(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.aaData)) {
    return payload.aaData;
  }

  if (typeof payload === "string") {
    const $ = cheerio.load(payload);
    const rows = [];

    $("table tr").each((_, tr) => {
      const cells = $(tr)
        .find("td")
        .map((__, td) => $(td).text().replace(/\s+/g, " ").trim())
        .get();

      if (cells.length >= 12) {
        rows.push(cells);
      }
    });

    return rows;
  }

  return [];
}

async function fetchJpsWaterLevelRows(stateCode) {
  const url = `https://publicinfobanjir.water.gov.my/aras-air/aras-air-data/?state=${encodeURIComponent(stateCode)}&district=ALL&station=ALL&lang=en`;
  const response = await axios.get(url, {
    timeout: 15000,
    headers: {
      "User-Agent": "Mozilla/5.0 FloodAlert/1.0",
      Accept: "application/json,text/html;q=0.9,*/*;q=0.8",
    },
  });

  return extractRows(response.data);
}

async function fetchPageText(url) {
  const response = await axios.get(url, {
    timeout: 10000,
    headers: {
      "User-Agent": "Mozilla/5.0 FloodAlert/1.0",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });
  const $ = cheerio.load(response.data);

  $("script, style, noscript").remove();
  return compactText($("body").text());
}

async function fetchInfobanjirSnapshot(sourceName, url, state, location) {
  try {
    const text = await fetchPageText(url);
    const terms = [location, state, "No Data", "Amaran", "Alert", "Flood", "Siren"];

    return {
      source: "Public Infobanjir",
      type: sourceName,
      url,
      summary: getRelevantText(text, terms),
      lastUpdate: getLastUpdateFromText(text),
      hasRelevantText: [location, state].some((term) =>
        normalize(text).includes(normalize(term))
      ),
    };
  } catch (error) {
    console.error(`${sourceName} fetch failed:`, error.message);
    return null;
  }
}

async function fetchPublicInfobanjirContext(state, location) {
  const entries = await Promise.all(
    Object.entries(INFOBANJIR_SOURCES).map(([sourceName, url]) =>
      fetchInfobanjirSnapshot(sourceName, url, state, location)
    )
  );
  const [floodAlert, metAlert, currentAlert, siren] = entries;

  return {
    source: "Public Infobanjir",
    floodAlert,
    metAlert,
    currentAlert,
    siren,
  };
}

function buildMonitoringFallback(state, location = state) {
  return {
    location,
    state,
    stationId: "",
    stationName: "",
    district: location,
    basin: "",
    subBasin: "",
    waterLevel: null,
    thresholds: {
      normal: null,
      alert: null,
      warning: null,
      danger: null,
    },
    status: "Safe",
    action: "Monitoring",
    reason:
      "No JPS river station reading is available for this area, so FloodAlert is monitoring weather and official updates.",
    lastUpdate: new Date().toISOString(),
    latestUpdate: {
      type: "Monitoring",
      summary:
        "No recent JPS water-level reading is available for this area. Check weather warnings and official announcements for local flash flood risk.",
    },
    userSummary:
      "No recent JPS water-level reading is available for this area. FloodAlert is monitoring weather and official updates for possible flash flood risk.",
    sourceNote: "Based on weather and official flood monitoring sources when available.",
    weather: null,
    officialNotice: null,
  };
}

async function fetchFirstAvailableJpsRows(state) {
  const stateCodes = getStateCodes(state);

  if (stateCodes.length === 0) {
    throw new Error(`Unsupported state: ${state}`);
  }

  const cacheKey = normalize(state);
  const cachedCode = stateCodeCache.get(cacheKey);

  if (cachedCode) {
    const cachedRows = await fetchJpsWaterLevelRows(cachedCode);

    if (cachedRows.length > 0) {
      return cachedRows;
    }

    stateCodeCache.delete(cacheKey);
  }

  const results = await Promise.allSettled(
    stateCodes.map(async (stateCode) => ({
      stateCode,
      rows: await fetchJpsWaterLevelRows(stateCode),
    }))
  );

  const match = results
    .filter((result) => result.status === "fulfilled")
    .map((result) => result.value)
    .find((result) => result.rows.length > 0);

  if (match) {
    stateCodeCache.set(cacheKey, match.stateCode);
    return match.rows;
  }

  const failedResult = results.find((result) => result.status === "rejected");

  if (failedResult) {
    throw failedResult.reason;
  }

  return [];
}

function normalizeJpsRow(row, state) {
  const stationId = row[1] || "";
  const stationName = row[2] || "";
  const district = row[3] || "";
  const basin = row[4] || "";
  const subBasin = row[5] || "";
  const lastUpdate = row[6] || "";
  const waterLevel = toNumber(row[7]);
  const thresholds = {
    normal: toNumber(row[8]),
    alert: toNumber(row[9]),
    warning: toNumber(row[10]),
    danger: toNumber(row[11]),
  };
  const status = mapStatusFromThresholds(waterLevel, thresholds);
  const action = mapAction(status);
  const riskLabel = getRiskLabel(status);
  const reason =
    status === "Safe"
      ? "No significant flood risk detected at the moment"
      : `JPS water level is ${waterLevel ?? "-"}m at ${stationName || "unknown station"}, compared with ${riskLabel.toLowerCase()} threshold conditions.`;
  const baseItem = {
    location: district || stationName || "Unknown location",
    state,
    stationId,
    stationName,
    district,
    basin,
    subBasin,
    waterLevel,
    thresholds,
    status,
    action,
    reason,
    lastUpdate,
    latestUpdate: {
      type: "JPS Water Level",
      summary: `Station ${stationName || "-"} in ${district || "-"} recorded ${waterLevel ?? "-"}m. Status: ${status}.`,
    },
    weather: null,
    officialNotice: null,
  };

  return {
    ...baseItem,
    userSummary: buildUserSummary(baseItem),
    sourceNote: buildSourceNote(baseItem),
  };
}

function matchesLocation(item, location, district = "", state = "") {
  const targets = getLocationAliases(location, district, state).map(normalize);

  return targets.some(
    (target) =>
      normalize(item.location) === target ||
      normalize(item.district) === target ||
      normalize(item.stationName).includes(target)
  );
}

function asArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
}

function findMatchingWeatherItem(items, state, location) {
  const normalizedState = normalize(state);
  const normalizedLocation = normalize(location);

  return items.find((item) => {
    const searchable = normalize(JSON.stringify(item));
    return (
      (normalizedLocation && searchable.includes(normalizedLocation)) ||
      (normalizedState && searchable.includes(normalizedState))
    );
  });
}

function normalizeWeatherItem(item) {
  if (!item) return null;

  const forecast =
    item.forecast ||
    item.summary ||
    item.weather ||
    item.wx_desc ||
    item.value ||
    "";
  const warning =
    item.warning ||
    item.warning_desc ||
    item.alert ||
    item.title ||
    "";
  const combined = normalize(`${forecast} ${warning}`);

  return {
    source: "METMalaysia",
    forecast: forecast || "",
    warning: warning || "",
    hasRainRisk: /rain|shower|thunder|storm|hujan|ribut/.test(combined),
    hasSevereWeather: /warning|severe|heavy|continuous|amaran|lebat|berterusan/.test(combined),
    lastUpdate:
      item.timestamp ||
      item.datetime ||
      item.date ||
      item.updated_at ||
      item.created_at ||
      "",
  };
}

async function fetchMetMalaysiaWeatherFresh(state, location) {
  const endpoints = [
    `https://api.data.gov.my/weather/forecast?contains=${encodeURIComponent(location)}@location__location_name`,
    `https://api.data.gov.my/weather/forecast?contains=${encodeURIComponent(state)}@location__location_name`,
    "https://api.data.gov.my/weather/warning",
  ];

  for (const url of endpoints) {
    try {
      const response = await axios.get(url, {
        timeout: 8000,
        headers: {
          Accept: "application/json",
          "User-Agent": "Mozilla/5.0 FloodAlert/1.0",
        },
      });
      const items = asArray(response.data);
      const matchedItem = findMatchingWeatherItem(items, state, location) || items[0];
      const weather = normalizeWeatherItem(matchedItem);

      if (weather) {
        return weather;
      }
    } catch (error) {
      if (error.response?.status === 429) {
        metMalaysiaCooldownUntil = Date.now() + WEATHER_RATE_LIMIT_COOLDOWN_MS;
        console.error("METMalaysia rate limited. Using cached or fallback weather data.");
        break;
      }

      console.error("METMalaysia fetch failed:", error.message);
    }
  }

  return null;
}

async function fetchMetMalaysiaWeather(state, location) {
  const cacheKey = normalize(`${state}:${location}`);
  const cached = weatherCache.get(cacheKey);
  const now = Date.now();

  if (cached && now - cached.timestamp < WEATHER_CACHE_TTL_MS) {
    return cached.data;
  }

  if (now < metMalaysiaCooldownUntil) {
    return cached?.data || null;
  }

  if (weatherPendingRequests.has(cacheKey)) {
    return weatherPendingRequests.get(cacheKey);
  }

  const request = fetchMetMalaysiaWeatherFresh(state, location)
    .then((weather) => {
      weatherCache.set(cacheKey, {
        data: weather,
        timestamp: Date.now(),
      });

      return weather;
    })
    .finally(() => {
      weatherPendingRequests.delete(cacheKey);
    });

  weatherPendingRequests.set(cacheKey, request);
  return request;
}

async function fetchNadmaNotice(state, location) {
  try {
    const text = await fetchPageText(NADMA_DISASTER_INFO_URL);
    const summary = getRelevantText(text, [
      location,
      state,
      "INFORMASI BENCANA",
      "Ribut Petir",
      "Hujan Lebat Berterusan",
      "Banjir",
    ]);

    return {
      source: "NADMA",
      notice: summary || "NADMA disaster information page is available.",
      category: "Informasi Bencana",
      lastUpdate: "",
      url: NADMA_DISASTER_INFO_URL,
    };
  } catch (error) {
    console.error("NADMA fetch failed:", error.message);
    return null;
  }
}

async function enrichWithOptionalSources(item, state, location) {
  const [weather, officialNotice, publicInfobanjir] = await Promise.all([
    fetchMetMalaysiaWeather(state, location),
    fetchNadmaNotice(state, location),
    fetchPublicInfobanjirContext(state, location),
  ]);
  const metAlertSummary = publicInfobanjir?.metAlert?.summary || "";
  const floodAlertSummary = publicInfobanjir?.floodAlert?.summary || "";
  const currentAlertSummary = publicInfobanjir?.currentAlert?.summary || "";

  const enrichedItem = {
    ...item,
    weather: {
      source: "METMalaysia / Public Infobanjir",
      forecast: weather?.forecast || metAlertSummary || "",
      warning: weather?.warning || floodAlertSummary || currentAlertSummary || "",
      hasRainRisk:
        weather?.hasRainRisk ||
        /rain|hujan|ribut|thunder|storm|lebat/i.test(
          `${metAlertSummary} ${floodAlertSummary} ${currentAlertSummary}`
        ),
      hasSevereWeather:
        weather?.hasSevereWeather ||
        /warning|amaran|bahaya|danger|lebat|berterusan/i.test(
          `${metAlertSummary} ${floodAlertSummary} ${currentAlertSummary}`
        ),
      lastUpdate:
        weather?.lastUpdate ||
        publicInfobanjir?.metAlert?.lastUpdate ||
        publicInfobanjir?.floodAlert?.lastUpdate ||
        "",
    },
    officialNotice,
    publicInfobanjir,
  };

  return {
    ...enrichedItem,
    userSummary: item.userSummary || buildUserSummary(enrichedItem),
    sourceNote: buildSourceNote(enrichedItem, {
      weather: enrichedItem.weather,
      officialNotice,
      publicInfobanjir,
    }),
  };
}

async function getAllRawData(state) {
  const rows = await fetchFirstAvailableJpsRows(state);
  const normalizedRows = rows.map((row) => normalizeJpsRow(row, state)).filter(Boolean);

  if (normalizedRows.length > 0) {
    return normalizedRows;
  }

  return [buildMonitoringFallback(state)];
}

function withoutCommonSuffixes(locationName) {
  return String(locationName || "").replace(/\s+(city|town|area)$/i, "").trim();
}

function unique(values) {
  const seen = new Set();
  return values.filter((value) => {
    const key = normalize(value);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getRiskScore(status) {
  const scores = { Evacuate: 4, "Flood Confirmed": 3, "Risk Rising": 2, Warning: 1, Safe: 0 };
  return scores[status] ?? 0;
}

function cleanAlertText(value) {
  const text = compactText(value).toLowerCase();

  if (!text || /\b(no data|tiada data|no alert|no warning)\b/i.test(text)) {
    return "";
  }

  return text;
}

function estimateRiskFromAlerts(alerts) {
  const { weather, officialNotice, publicInfobanjir } = alerts;
  const relevantInfobanjirText = [
    publicInfobanjir?.floodAlert?.hasRelevantText
      ? publicInfobanjir.floodAlert.summary
      : "",
    publicInfobanjir?.metAlert?.hasRelevantText
      ? publicInfobanjir.metAlert.summary
      : "",
    publicInfobanjir?.currentAlert?.hasRelevantText
      ? publicInfobanjir.currentAlert.summary
      : "",
    publicInfobanjir?.siren?.hasRelevantText
      ? publicInfobanjir.siren.summary
      : "",
  ]
    .map(cleanAlertText)
    .join(" ");
  const weatherText = cleanAlertText(`${weather?.warning || ""} ${weather?.forecast || ""}`);
  const officialText = cleanAlertText(officialNotice?.notice);
  const combinedText = `${weatherText} ${officialText} ${relevantInfobanjirText}`;

  if (/evacuat|pemindahan|pindah|siren\s+(aktif|active|dibunyikan)|danger level|paras bahaya|bahaya/i.test(combinedText)) {
    return { status: "Flood Confirmed", action: "Evacuate immediately", reason: "A severe official flood, siren, or evacuation signal is active." };
  }
  if (/amaran banjir|flood warning|warning|amaran|severe|heavy|lebat|berterusan/i.test(combinedText)) {
    return { status: "Warning", action: "Avoid low-lying areas and stay alert", reason: "Severe weather or heavy rain warning active." };
  }
  if (/thunderstorm|ribut|rain|hujan/i.test(combinedText)) {
    return { status: "Risk Rising", action: "Prepare essentials and monitor updates", reason: "Thunderstorm or rain risk detected." };
  }
  return { status: "Safe", action: "No immediate action needed", reason: "No active flood or severe weather alerts." };
}

function computeCityRisk(city, district, state, rawStations, alerts) {
  const cityTargets = unique([
    city,
    withoutCommonSuffixes(city),
    ...getLocationAliases(city, district, state),
  ]).map(normalize);
  const directMatches = rawStations.filter(item => 
    cityTargets.some(t => normalize(item.location) === t || normalize(item.stationName).includes(t))
  );

  if (directMatches.length > 0) {
    directMatches.sort((a, b) => getRiskScore(b.status) - getRiskScore(a.status));
    const highestRisk = directMatches[0];
    const stations = directMatches.map(s => ({
      stationId: s.stationId, stationName: s.stationName, district: s.district,
      waterLevel: s.waterLevel, thresholds: s.thresholds, status: s.status,
      action: s.action, reason: s.reason, lastUpdate: s.lastUpdate
    }));
    
    const baseItem = {
      ...highestRisk,
      location: city,
      state,
      district,
      dataBasis: "jps-direct",
      confidence: "high",
      sourceNote: "Based on direct JPS water-level station.",
      stations
    };
    if (stations.length > 1) {
      baseItem.reason = `${stations.length} nearby stations monitored. Highest risk is ${highestRisk.status}.`;
      baseItem.latestUpdate = {
        type: "Aggregated JPS Data",
        summary: `${stations.length} stations found in this area. ${highestRisk.stationName} reports ${highestRisk.status}.`
      };
    }
    return baseItem;
  }

  const districtTargets = unique([district, withoutCommonSuffixes(district)]).map(normalize).filter(Boolean);
  const nearbyMatches = rawStations.filter(item => 
    districtTargets.some(t => normalize(item.district) === t || normalize(item.stationName).includes(t))
  );

  const stations = nearbyMatches.map(s => ({
    stationId: s.stationId, stationName: s.stationName, district: s.district,
    waterLevel: s.waterLevel, thresholds: s.thresholds, status: s.status,
    action: s.action, reason: s.reason, lastUpdate: s.lastUpdate
  }));
  const highestNearby = nearbyMatches
    .slice()
    .sort((a, b) => getRiskScore(b.status) - getRiskScore(a.status))[0];
  const hasNearbyJpsData = Boolean(highestNearby);
  const hasStateJpsData = rawStations.length > 0;
  const estimate = hasStateJpsData
    ? {
        status: "Safe",
        action: "No immediate action needed",
        reason:
          "JPS water-level data is available for this state, but no matching nearby station is linked to this area. Weather and official alerts are monitored as supporting context.",
      }
    : estimateRiskFromAlerts(alerts);
  const finalStatus = hasNearbyJpsData ? highestNearby.status : estimate.status;
  const finalAction = hasNearbyJpsData ? highestNearby.action : estimate.action;
  const finalReason = hasNearbyJpsData
    ? highestNearby.status === "Safe"
      ? "Nearby JPS water-level stations are currently below alert thresholds. Weather and official alerts are monitored as supporting context."
      : highestNearby.reason
    : estimate.reason;

  const dataBasis = hasNearbyJpsData
    ? "jps-nearby"
    : hasStateJpsData
      ? "jps-state-monitoring"
      : "weather-estimated";
  const sourceNote = nearbyMatches.length > 0 
    ? "JPS water-level readings are the main flood signal. Weather and official alerts are supporting context."
    : hasStateJpsData
      ? "JPS water-level data exists for this state. This area has no linked station, so weather and official alerts are supporting context only."
      : "Estimated from weather and official alerts because no JPS water-level data is available.";

  return {
    location: city,
    state,
    district,
    status: finalStatus,
    action: finalAction,
    reason: finalReason,
    latestUpdate: { type: hasNearbyJpsData ? "JPS Nearby Station" : "Estimated Risk", summary: finalReason },
    lastUpdate: new Date().toISOString(),
    stations,
    dataBasis,
    confidence: "medium",
    sourceNote
  };
}

async function getRawDataByCity(city, state, district = "", options = {}) {
    let jpsData = null;
  const rawItems = await getAllRawData(state);
  const weather = await fetchMetMalaysiaWeather(state, city);
  const officialNotice = await fetchNadmaNotice(state, city);
  const publicInfobanjir = await fetchPublicInfobanjirContext(state, city);
  const alerts = { weather, officialNotice, publicInfobanjir };
  
  const computed = computeCityRisk(city, district, state, rawItems, alerts);
  const satellite =
    computed.dataBasis === "jps-state-monitoring" ||
    computed.dataBasis === "weather-estimated"
      ? await analyzeSatelliteFloodSignal({ location: city, district, state })
      : null;
  const satelliteAdjusted =
    satellite?.hasFloodSignal && computed.status === "Safe"
      ? {
          status: "Warning",
          action: "Avoid low-lying areas and stay alert",
          reason:
            "Satellite imagery suggests possible surface water near this area. JPS water-level data remains the main flood signal, so treat this as an early warning and check official updates.",
          latestUpdate: {
            type: "Satellite Imagery",
            summary:
              "Possible surface water detected by Sentinel-1 imagery. Use this as supporting context, not as a confirmed flood alert.",
          },
          dataBasis: "satellite-supporting",
          confidence: "medium",
        }
      : {};
  
  const finalItem = {
    location: city,
    district: district || "Not specified",
    state: state || "Not specified",
    jps: jpsData || null,
    weather: alerts.weather || null,
    officialNotice: alerts.officialNotice || null,
    publicInfobanjir: alerts.publicInfobanjir || null,
    satellite: satellite || null, 
    rawComputedStatus: jpsData ? jpsData.status : (satellite?.hasFloodSignal ? "Satellite Detected" : "Safe")
  };
  
  return [finalItem];
}

async function getRawDataByCityAndState(city, state) {
  return getRawDataByCity(city, state);
}

async function getRawDataByState(state) {
  const rawItems = await getAllRawData(state);
  
  // State-wide alerts for efficient fallback logic
  const weather = await fetchMetMalaysiaWeather(state, state);
  const officialNotice = await fetchNadmaNotice(state, state);
  const publicInfobanjir = await fetchPublicInfobanjirContext(state, state);
  const alerts = { weather, officialNotice, publicInfobanjir };

  const districtsObj = MALAYSIA_LOCATION_DATA[state];
  if (!districtsObj) {
    return rawItems;
  }

  const computedCities = [];
  for (const [districtName, cities] of Object.entries(districtsObj)) {
    for (const cityName of cities) {
      computedCities.push(computeCityRisk(cityName, districtName, state, rawItems, alerts));
    }
  }

  return computedCities;
}

module.exports = {
  getAllRawData,
  getRawDataByState,
  getRawDataByCity,
  getRawDataByCityAndState,
  getStateCode,
  normalize,
};
