const axios = require("axios");
const cheerio = require("cheerio");
const { getLocationAliases } = require("../data/locationAliases");

const INFOBANJIR_SOURCES = {
  floodAlert:
    "https://publicinfobanjir.water.gov.my/ramalan/amaran-banjir/?lang=en",
  metAlert: "https://publicinfobanjir.water.gov.my/ramalan/met-alert/?lang=en",
  currentAlert:
    "https://publicinfobanjir.water.gov.my/cerapan/amaran-semasa/?lang=en",
  siren: "https://publicinfobanjir.water.gov.my/cerapan/siren/?lang=en",
};
const NADMA_DISASTER_INFO_URL = "https://www.nadma.gov.my/bm/#informasi-bencana";

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
      normalize(item.stationName).includes(target) ||
      normalize(item.state) === target
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

async function fetchMetMalaysiaWeather(state, location) {
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
      console.error("METMalaysia fetch failed:", error.message);
    }
  }

  return null;
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

async function getRawDataByCity(city, state, district = "", options = {}) {
  const items = await getAllRawData(state);
  const matches = items.filter((item) => matchesLocation(item, city, district, state));

  if (matches.length === 0) {
    const fallback = buildMonitoringFallback(state, city);

    if (options.enrich === false) {
      return [fallback];
    }

    return [await enrichWithOptionalSources(fallback, state, city)];
  }

  if (options.enrich === false) {
    return [matches[0]];
  }

  return [await enrichWithOptionalSources(matches[0], state, city)];
}

async function getRawDataByCityAndState(city, state) {
  return getRawDataByCity(city, state);
}

async function getRawDataByState(state) {
  return getAllRawData(state);
}

module.exports = {
  getAllRawData,
  getRawDataByState,
  getRawDataByCity,
  getRawDataByCityAndState,
  getStateCode,
  normalize,
};
