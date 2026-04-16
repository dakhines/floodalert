import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { useViewLocation } from "../context/useViewLocation";
import AppShell from "../components/AppShell";
import BottomNav from "../components/BottomNav";
import { fetchLocations } from "../api/floodApi";
import { MALAYSIA_LOCATION_DATA } from "../data/locations";

const statusStyles = {
    "Evacuate": "bg-red-900 border-red-900/25 text-white",
    "Flood Confirmed": "bg-red-500 border-red-900/25 text-white",
    "Warning": "bg-orange-500 border-orange-900/25 text-white",
    "Risk Rising": "bg-amber-500 border-amber-900/25 text-white",
    "Safe": "bg-green-600 border-green-900/25 text-white",
};

function getCityName(item) {
    return item.city || item.location || item.name || "Unknown City";
}

export default function AllLocations() {
    const navigate = useNavigate();
    const {
        currentViewedLocation,
        selectedDistrict,
        selectedState,
        setSelectedDistrict,
        setSelectedState,
        setViewingLocation,
    } = useViewLocation();
    const [locations, setLocations] = useState([]);
    const [locationsLoading, setLocationsLoading] = useState(true);
    const [locationsError, setLocationsError] = useState("");

    useEffect(() => {
        const controller = new AbortController();

        async function loadLocations() {
            try {
                setLocationsLoading(true);
                setLocationsError("");
                const data = await fetchLocations(controller.signal);
                setLocations(data);
            } catch (error) {
                if (error.name !== "AbortError") {
                    setLocations([]);
                    setLocationsError("Unable to load locations.");
                }
            } finally {
                setLocationsLoading(false);
            }
        }

        loadLocations();

        return () => controller.abort();
    }, []);

    const states = useMemo(() => Object.keys(MALAYSIA_LOCATION_DATA), []);
    const statusByCity = useMemo(
        () =>
            new Map(
                locations.map((item) => [getCityName(item), item])
            ),
        [locations]
    );

    const districts = selectedState
        ? Object.keys(MALAYSIA_LOCATION_DATA[selectedState] || {})
        : [];

    const cities =
        selectedState && selectedDistrict
            ? MALAYSIA_LOCATION_DATA[selectedState]?.[selectedDistrict] || []
            : [];

    const handleSelect = (city) => {
        setViewingLocation({
            city,
            location: city,
            state: selectedState,
            district: selectedDistrict,
        });
        navigate("/home");
    };

    return (
        <AppShell className="pb-24">
            <div>
                <h1 className="mt-3 text-2xl font-bold text-slate-950">
                    Location
                </h1>
            </div>

            <label className="mt-5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                State
            </label>
            <select
                value={selectedState}
                onChange={(event) => {
                    setSelectedState(event.target.value);
                    setSelectedDistrict("");
                }}
                disabled={states.length === 0}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 disabled:bg-slate-100 disabled:text-slate-400 hover:border-sky-300"
            >
                <option value="">Select State</option>
                {states.map((state) => (
                    <option key={state} value={state}>
                        {state}
                    </option>
                ))}
            </select>
            <label className="mt-4 block text-xs font-bold uppercase tracking-wide text-slate-500">
                District
            </label>
            <select
                value={selectedDistrict}
                onChange={(event) => setSelectedDistrict(event.target.value)}
                disabled={!selectedState}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 disabled:bg-slate-100 disabled:text-slate-400 hover:border-sky-300"
            >
                <option value="">Select District</option>
                {districts.map((district) => (
                    <option key={district} value={district}>
                        {district}
                    </option>
                ))}
            </select>

            <section className="mt-5 space-y-3">
                {locationsLoading && (
                    <p className="rounded-xl border border-slate-300 bg-white p-4 text-sm text-slate-500">
                        Loading locations...
                    </p>
                )}

                {locationsError && (
                    <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                        {locationsError}
                    </p>
                )}

                {!locationsLoading && !locationsError && cities.length === 0 && (
                    <p className="rounded-xl border border-slate-300 bg-white p-4 text-sm text-slate-500">
                        {selectedDistrict
                            ? "No locations available."
                            : "Select a district to view city and area statuses."}
                    </p>
                )}

                {!locationsLoading &&
                    !locationsError &&
                    cities.map((city) => {
                        const item = statusByCity.get(city);
                        const isViewingNow =
                            (currentViewedLocation?.city === city ||
                                currentViewedLocation?.location === city) &&
                            currentViewedLocation?.state === selectedState &&
                            currentViewedLocation?.district === selectedDistrict;

                        return (
                            <article
                                key={city}
                                className={`w-full rounded-xl border px-4 py-3 text-left shadow-sm transition duration-200 hover:border-sky-300 hover:bg-sky-50/40 ${
                                    isViewingNow
                                        ? "border-sky-400 bg-sky-50"
                                        : "border-slate-300 bg-white"
                                }`}
                            >
                                <div className="flex items-center justify-between gap-4">
                                    <div className="min-w-0 flex-1">
                                        <h2 className="truncate text-sm font-bold text-slate-950">
                                            {city}
                                        </h2>
                                        {isViewingNow && (
                                            <p className="mt-1 text-[11px] font-bold text-sky-700">
                                                Viewing now
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex shrink-0 items-center gap-3">
                                        <span
                                            className={`rounded-full border px-3 py-1 text-[11px] font-bold ${
                                                statusStyles[item?.status] ||
                                                "bg-white text-slate-700 border-slate-300"
                                            }`}
                                        >
                                            {item?.status || "No Alert"}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => handleSelect(city)}
                                            aria-label={`View ${city} on Home`}
                                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-white hover:text-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-400"
                                        >
                                            <ChevronRight
                                                size={20}
                                                className="shrink-0"
                                            />
                                        </button>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
            </section>

            <p className="mt-4 text-center text-xs font-semibold text-slate-500">
                Last updated 5 minutes ago
            </p>
            <BottomNav />
        </AppShell>
    );
}
