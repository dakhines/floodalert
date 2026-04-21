const rawLocationData = [
  {
    city: "Ayer Keroh",
    state: "Melaka",
    weather: {
      condition: "heavy rain",
      rainfallLevel: "high",
      warning: "orange",
    },
    waterLevel: {
      level: "rising",
      risk: "medium",
    },
    alerts: [
      "Heavy rain warning issued in Melaka",
      "Low-lying roads reported flooded",
    ],
        timestamp: "10:31 AM",
  },
  {
    city: "Johor Bahru",
    state: "Johor",
    weather: {
      condition: "continuous rain",
      rainfallLevel: "medium",
      warning: "yellow",
    },
    waterLevel: {
      level: "rising",
      risk: "medium",
    },
    alerts: [
      "River level increasing near residential areas",
      "Residents advised to monitor official updates",
    ],
      timestamp: "10:31 AM",
  },
  {
    city: "Shah Alam",
    state: "Selangor",
    weather: {
      condition: "light rain",
      rainfallLevel: "low",
      warning: null,
    },
    waterLevel: {
      level: "normal",
      risk: "low",
    },
    alerts: [],
      timestamp: "10:31 AM",
  },
  {
    city: "Kuantan",
    state: "Pahang",
    weather: {
      condition: "thunderstorm",
      rainfallLevel: "high",
      warning: "orange",
    },
    waterLevel: {
      level: "overflowing",
      risk: "high",
    },
    alerts: [
      "Flood confirmed near riverbank communities",
      "Several routes temporarily closed",
    ],
      timestamp: "10:31 AM",
  },
  {
    city: "Kota Bharu",
    state: "Kelantan",
    weather: {
      condition: "severe rain",
      rainfallLevel: "extreme",
      warning: "red",
    },
    waterLevel: {
      level: "critical",
      risk: "very high",
    },
    alerts: [
      "Evacuation notice issued for high-risk zones",
      "Temporary relief centre opened nearby",
    ],
      timestamp: "10:31 AM",
  },
  {
    city: "George Town",
    state: "Penang",
    weather: {
      condition: "cloudy",
      rainfallLevel: "low",
      warning: null,
    },
    waterLevel: null,
    alerts: ["Drainage monitoring ongoing after earlier rainfall"],
      timestamp: "10:31 AM",
  },
];

module.exports = rawLocationData;
