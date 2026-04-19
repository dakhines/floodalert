import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import FloodCard from "../components/FloodCard";
import { useViewLocation } from "../context/useViewLocation";
import AppShell from "../components/AppShell";
import BottomNav from "../components/BottomNav";
import { useState, useEffect, useRef } from "react";
import {
    fetchLocationByName,
    getCachedLocationByName,
} from "../api/floodApi";
import { findLocationPath } from "../data/locations";

function HomeSkeleton({ locationName }) {
    const [messageIndex, setMessageIndex] = useState(0);
    const messages = [
        "Connecting to live flood sources...",
        "Checking river water levels...",
        "Preparing AI summary...",
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setMessageIndex((currentIndex) =>
                Math.min(currentIndex + 1, messages.length - 1)
            );
        }, 1800);

        return () => clearInterval(timer);
    }, [messages.length]);

    return (
        <div className="space-y-4">
            <section className="rounded-2xl border border-slate-300 bg-white p-4 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    {messages[messageIndex]}
                </p>
                <h2 className="mt-2 text-xl font-bold text-slate-950">
                    {locationName || "Your location"}
                </h2>
                <div className="mt-6 flex justify-center">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-sky-500" />
                </div>
            </section>
        </div>
    );
}

export default function Home() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { currentViewedLocation, viewingLocation } = useViewLocation();
    const [selectedLocation, setSelectedLocation] = useState(null);
    const selectedLocationRef = useRef(null);
    const requestKeyRef = useRef("");
    const [locationLoading, setLocationLoading] = useState(true);
    const [locationError, setLocationError] = useState("");
    const [hasTriedLoading, setHasTriedLoading] = useState(false);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    useEffect(() => {
        selectedLocationRef.current = selectedLocation;
    }, [selectedLocation]);

    useEffect(() => {
        const controller = new AbortController();

        async function loadSelectedLocation() {
            try {
                setHasTriedLoading(false);
                setLocationLoading(true);
                setLocationError("");

                const locationName = viewingLocation || user?.defaultLocation;
                const state = currentViewedLocation?.state || user?.state;
                const hasResolvableLocation = Boolean(locationName && state);
                const district =
                    currentViewedLocation?.district ||
                    user?.defaultDistrict ||
                    findLocationPath(locationName)?.district ||
                    "";
                const requestKey = [locationName, state, district]
                    .map((value) => value || "")
                    .join("|");

                requestKeyRef.current = requestKey;

                if (!locationName) {
                    setLocationError("Please set your default location in Profile.");
                    return;
                }

                if (!hasResolvableLocation && !selectedLocationRef.current) {
                    await new Promise((resolve) => setTimeout(resolve, 700));
                }

                if (!state) {
                    console.error("Missing state for selected location.");
                    setSelectedLocation(null);
                    setLocationError(
                        "Please update your default state in Edit Profile."
                    );
                    return;
                }

                const cachedLocation =
                    getCachedLocationByName(
                        locationName,
                        state,
                        district,
                        true
                    ) ||
                    getCachedLocationByName(
                        locationName,
                        state,
                        district,
                        false
                    );

                if (cachedLocation) {
                    setSelectedLocation(cachedLocation);
                }

                const baseData = await fetchLocationByName(
                    locationName,
                    state,
                    controller.signal,
                    district,
                    { includeAi: false }
                );

                if (requestKeyRef.current !== requestKey) {
                    return;
                }

                setSelectedLocation(baseData);

                fetchLocationByName(locationName, state, undefined, district, {
                    includeAi: true,
                })
                    .then((enhancedData) => {
                        if (requestKeyRef.current === requestKey) {
                            setSelectedLocation(enhancedData);
                        }
                    })
                    .catch(() => {
                        if (requestKeyRef.current === requestKey) {
                            setLocationError(
                                "AI summary is temporarily unavailable. Showing live monitoring data."
                            );
                        }
                    });
            } catch (error) {
                if (error.name !== "AbortError") {
                    if (!selectedLocationRef.current) {
                        setSelectedLocation(null);
                    }
                    setLocationError("Unable to load flood location data.");
                }
            } finally {
                setHasTriedLoading(true);
                setLocationLoading(false);
            }
        }

        loadSelectedLocation();

        return () => controller.abort();
    }, [
        currentViewedLocation?.district,
        currentViewedLocation?.state,
        user?.defaultDistrict,
        user?.defaultLocation,
        user?.state,
        viewingLocation,
    ]);

    const aiSummary =
        selectedLocation?.userSummary ||
        selectedLocation?.aiSummary ||
        `Based on current flood data, ${selectedLocation?.location || "this area"} is marked "${selectedLocation?.status || "Unknown"}". ${selectedLocation?.latestUpdate?.summary || ""}`;
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setNow(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const dayTime = now.toLocaleString(undefined, {
        weekday: "long",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });

    return (
        <AppShell className="pb-24">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-950">
                        Hey, {user?.name}!
                    </h1>
                    <p className="text-xs text-slate-500">{dayTime}</p>
                </div>
                <button onClick={handleLogout} className="text-xs font-bold text-slate-500 mt-6 mr-3 hover:text-blue-500">
                    Logout
                </button>
            </div>

            <div className="mt-5 flex flex-col gap-4">
                {locationLoading && !selectedLocation && (
                    <HomeSkeleton locationName={viewingLocation || user?.defaultLocation} />
                )}

                {locationError && (
                    <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                        {locationError}
                    </p>
                )}

                {!locationLoading && hasTriedLoading && !locationError && !selectedLocation && (
                    <section className="soft-pop rounded-2xl border border-slate-300 bg-white p-5 text-center shadow-sm">
                        <h2 className="text-base font-bold text-slate-950">
                            No default location found
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                            Choose a default location in your profile so FloodAlert can load your live flood status.
                        </p>
                        <Link
                            to="/settings/edit"
                            className="mt-4 inline-flex rounded-full bg-slate-950 px-5 py-2 text-sm font-bold text-white transition hover:bg-slate-800"
                        >
                            Set default location
                        </Link>
                    </section>
                )}

                {selectedLocation && (
                    <>
                        <FloodCard item={selectedLocation} />

                        <section className="soft-pop rounded-2xl border border-slate-300 bg-white p-4 shadow-sm">
                            <h2 className="text-sm font-bold text-slate-950">AI Summary</h2>
                            <p className="mt-3 text-sm leading-6 text-slate-700">{aiSummary}</p>
                        </section>

                        <section className="soft-pop rounded-2xl border border-slate-300 bg-white p-4 shadow-sm">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h2 className="text-sm font-bold text-slate-950">
                                        Latest Update
                                    </h2>
                                    <p className="mt-2 text-sm leading-6 text-slate-700">
                                        {selectedLocation.latestUpdate?.summary || "No update available."}
                                    </p>
                                </div>
                                <span className="shrink-0 whitespace-nowrap text-right text-xs font-semibold text-slate-500">
                                    {selectedLocation.lastUpdate}
                                </span>
                            </div>
                            <Link
                                to="/updates"
                                className="mt-4 inline-flex rounded-full border bg-slate-800 px-4 py-2 text-xs font-bold text-white
                                            transition duration-200 ease-in-out hover:scale-105 hover:text-white"
                            >
                                View updates
                            </Link>
                        </section>
                    </>
                )}
            </div>

            <BottomNav />
        </AppShell>
    );
}
