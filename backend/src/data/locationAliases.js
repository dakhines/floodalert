// Location aliases: extra names we accept so one area can match multiple official spellings.
const LOCATION_DATA_ALIASES = {
  "Johor Bahru City": ["Johor Bahru City", "Johor Bahru"],
  "Iskandar Puteri": ["Iskandar Puteri", "Pulai", "Johor Bahru", "Sungai Skudai", "Sg. Skudai"],
  "Pasir Gudang": ["Pasir Gudang", "Plentong", "Johor Bahru", "Sungai Plentong", "Sg. Plentong"],
  "Ulu Tiram": ["Ulu Tiram", "Tebrau", "Johor Bahru", "Sungai Tiram", "Sg. Tiram"],
  "Mount Austin": ["Mount Austin", "Tebrau", "Johor Bahru"],
  "Bukit Indah": ["Bukit Indah", "Pulai", "Johor Bahru"],
};

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function withoutCommonSuffixes(locationName) {
  return String(locationName || "")
    .replace(/\s+(city|town|area)$/i, "")
    .trim();
}

function unique(values) {
  const seen = new Set();

  return values.filter((value) => {
    const key = normalize(value);

    if (!key || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function getLocationAliases(locationName, district = "", state = "") {
  const aliases =
    Object.entries(LOCATION_DATA_ALIASES).find(
      ([name]) => normalize(name) === normalize(locationName)
    )?.[1] || [];

  return unique([
    locationName,
    withoutCommonSuffixes(locationName),
    ...aliases,
  ]);
}

module.exports = {
  getLocationAliases,
};
