const mockLocations = [
  {
    location: "Ayer Keroh",
    status: "Flood Confirmed",
    action: "Prepare to evacuate",
    reason: "Heavy rainfall and official warning detected",
    lastUpdate: "2026-04-12T10:30:00Z",
    latestUpdate: {
      type: "Evacuation",
      summary: "Temporary shelter opened nearby"
    }
  },
  {
    location: "Johor Bahru",
    status: "Risk Rising",
    action: "Prepare essentials and monitor updates",
    reason: "Heavy rain warning issued",
    lastUpdate: "2026-04-12T10:30:00Z",
    latestUpdate: {
      type: "Warning",
      summary: "Continuous rain expected for next few hours"
    }
  }
];

module.exports = mockLocations;