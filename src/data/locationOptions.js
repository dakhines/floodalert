import floodData from "./floodData.json";

export const locationOptions = [
    {
        state: "Melaka",
        cities: ["Ayer Keroh"],
    },
    {
        state: "Johor",
        cities: ["Johor Bahru"],
    },
];

export function getStateForCity(city) {
    return (
        locationOptions.find((option) => option.cities.includes(city))?.state ||
        locationOptions[0].state
    );
}

export function getCitiesForState(state) {
    return (
        locationOptions.find((option) => option.state === state)?.cities ||
        locationOptions[0].cities
    );
}

export function getFloodItemByCity(city) {
    return floodData.find((item) => item.location === city) || floodData[0];
}
