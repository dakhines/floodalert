const API_BASE_URL = "http://localhost:5001";

async function request(path, signal) {
    const response = await fetch(`${API_BASE_URL}${path}`, { signal });

    if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
    }

    return response.json();
}

export function fetchLocations(signal) {
    return request("/locations", signal);
}

export function fetchUpdates(signal) {
    return request("/updates", signal);
}

export function fetchLocationByName(name, signal) {
    return request(`/locations/${encodeURIComponent(name)}`, signal);
}
