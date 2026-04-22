const CITY_COORDINATES = {
  "Negeri Sembilan": {
    Seremban: {
      "Seremban City": { lat: 2.723099, lng: 101.9400601 },
      Nilai: { lat: 2.8029227, lng: 101.8001051 },
      Senawang: { lat: 2.6906659, lng: 101.9716587 },
      Rasah: { lat: 2.7088337, lng: 101.9362148 },
      Ampangan: { lat: 2.7249523, lng: 101.9673364 },
      Labu: { lat: 2.7539826, lng: 101.8265821 },
      Sendayan: { lat: 2.6798011, lng: 101.8600707 },
    },
  },
  Melaka: {
    "Melaka Tengah": {
      "Melaka City": { lat: 2.1942647, lng: 102.2486651 },
      "Ayer Keroh": { lat: 2.255986, lng: 102.2915442 },
      Klebang: { lat: 2.2152648, lng: 102.207103 },
      "Batu Berendam": { lat: 2.2507491, lng: 102.2542092 },
      "Tanjung Kling": { lat: 2.2227609, lng: 102.1619465 },
      "Telok Mas": { lat: 2.1610542, lng: 102.3220858 },
      "Ayer Molek": { lat: 2.2073206, lng: 102.3159868 },
    },
    "Alor Gajah": {
      "Alor Gajah Town": { lat: 2.3861261, lng: 102.2149996 },
      "Masjid Tanah": { lat: 2.3522253, lng: 102.1089793 },
      "Durian Tunggal": { lat: 2.3117752, lng: 102.2821438 },
      "Pulau Sebang": { lat: 2.4494099, lng: 102.2326551 },
      Lendu: { lat: 2.356102, lng: 102.1704023 },
      "Kuala Sungai Baru": { lat: 2.3609669, lng: 102.0389737 },
    },
  },
  Johor: {
    Kulai: {
      "Kulai Town": { lat: 1.656937, lng: 103.605879 },
      Senai: { lat: 1.6012009, lng: 103.6446799 },
      Sedenak: { lat: 1.7126551, lng: 103.5257302 },
    },
  },
  Perlis: {
    Perlis: {
      Kangar: { lat: 6.4389312, lng: 100.1944838 },
      Arau: { lat: 6.4307281, lng: 100.2718795 },
      "Padang Besar": { lat: 6.6626841, lng: 100.3201982 },
    },
  },
};

const STATION_COORDINATES_BY_ID = {
  "0270471WL": {
    lat: 2.7167439,
    lng: 101.9602208,
    label: "Dusun Nyior, Seremban",
  },
  "0270491WL": {
    lat: 2.5974963,
    lng: 101.9635319,
    label: "Kombok, Seremban",
  },
  "0270231WL": {
    lat: 2.436236,
    lng: 102.1844062,
    label: "Simpang Ampat, Alor Gajah",
  },
  "0290301WL": {
    lat: 2.436236,
    lng: 102.1844062,
    label: "Simpang Ampat, Alor Gajah",
  },
  "0290271WL": {
    lat: 2.4443865,
    lng: 102.242049,
    label: "Tanjung Rimau, Alor Gajah",
  },
  "0310341WL": {
    lat: 2.4592703,
    lng: 102.339096,
    label: "Tebong, Alor Gajah",
  },
  "0290421WL": {
    lat: 2.4066869,
    lng: 102.2473406,
    label: "Gadek, Alor Gajah",
  },
  "0290211WL": {
    lat: 2.3597356,
    lng: 102.2301355,
    label: "Melaka Pindah, Alor Gajah",
  },
  "0290161WL": {
    lat: 2.3117752,
    lng: 102.2821438,
    label: "Durian Tunggal, Alor Gajah",
  },
  "0290231WL": {
    lat: 2.3117752,
    lng: 102.2821438,
    label: "Durian Tunggal, Alor Gajah",
  },
  "0290221WL": {
    lat: 2.3117752,
    lng: 102.2821438,
    label: "Durian Tunggal, Alor Gajah",
  },
  "0290241WL": {
    lat: 2.2202014,
    lng: 102.2015047,
    label: "Klebang Besar, Melaka Tengah",
  },
  "0290351WL": {
    lat: 2.2202014,
    lng: 102.2015047,
    label: "Klebang Besar, Melaka Tengah",
  },
  "0290341WL": {
    lat: 2.2701088,
    lng: 102.2170901,
    label: "Cheng, Melaka Tengah",
  },
  "0290331WL": {
    lat: 2.2701088,
    lng: 102.2170901,
    label: "Cheng, Melaka Tengah",
  },
  "0290491WL": {
    lat: 2.2500314,
    lng: 102.2657592,
    label: "Sungai Putat, Melaka Tengah",
  },
};

const CITY_STATION_OVERRIDES = {
  "Negeri Sembilan": {
    Seremban: {
      "Seremban City": {
        preferredStationIds: ["0270471WL", "0270491WL"],
      },
      Nilai: {
        preferredStationIds: ["0270471WL"],
        excludedStationIds: ["0270491WL"],
      },
      Senawang: {
        preferredStationIds: ["0270471WL", "0270491WL"],
      },
      Rasah: {
        preferredStationIds: ["0270471WL", "0270491WL"],
      },
      Ampangan: {
        preferredStationIds: ["0270471WL", "0270491WL"],
      },
      Labu: {
        preferredStationIds: ["0270471WL"],
        excludedStationIds: ["0270491WL"],
      },
      Sendayan: {
        preferredStationIds: ["0270471WL"],
        excludedStationIds: ["0270491WL"],
      },
    },
  },
  Melaka: {
    "Melaka Tengah": {
      "Melaka City": {
        preferredStationIds: ["0290241WL", "0290351WL", "0290341WL", "0290331WL", "0290491WL"],
      },
      "Ayer Keroh": {
        preferredStationIds: ["0290491WL", "0290341WL", "0290331WL"],
      },
    },
    "Alor Gajah": {
      "Alor Gajah Town": {
        preferredStationIds: ["0290211WL", "0290421WL", "0290271WL"],
      },
      "Masjid Tanah": {
        preferredStationIds: ["0270231WL", "0290301WL"],
        excludedStationIds: ["0290421WL", "0310341WL"],
      },
      "Durian Tunggal": {
        preferredStationIds: ["0290161WL", "0290231WL", "0290221WL"],
      },
      "Pulau Sebang": {
        preferredStationIds: ["0290271WL", "0290421WL", "0290211WL"],
      },
      Lendu: {
        preferredStationIds: ["0270231WL", "0290301WL", "0290211WL"],
      },
      "Kuala Sungai Baru": {
        preferredStationIds: ["0270231WL", "0290301WL"],
        excludedStationIds: ["0290421WL", "0310341WL"],
      },
    },
  },
};

const DEFAULT_NEARBY_STATION_RADIUS_KM = 25;
const MAX_NEARBY_STATIONS = 3;
const STRONG_NEARBY_DISTANCE_KM = 5;
const MODERATE_NEARBY_DISTANCE_KM = 15;

module.exports = {
  CITY_COORDINATES,
  STATION_COORDINATES_BY_ID,
  CITY_STATION_OVERRIDES,
  DEFAULT_NEARBY_STATION_RADIUS_KM,
  MAX_NEARBY_STATIONS,
  STRONG_NEARBY_DISTANCE_KM,
  MODERATE_NEARBY_DISTANCE_KM,
};
