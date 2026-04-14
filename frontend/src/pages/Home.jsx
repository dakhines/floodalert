import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import FloodCard from "../components/FloodCard";
import { useViewLocation } from "../context/useViewLocation";
import AppShell from "../components/AppShell";
import BottomNav from "../components/BottomNav";
import { useState, useEffect } from "react";
import { fetchLocationByName, fetchLocations } from "../api/floodApi";
import "./Home.css";

export default function Home() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { viewingLocation } = useViewLocation();
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [locationLoading, setLocationLoading] = useState(true);
    const [locationError, setLocationError] = useState("");

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    useEffect(() => {
        const controller = new AbortController();

        async function loadSelectedLocation() {
            try {
                setLocationLoading(true);
                setLocationError("");

                const locationName = viewingLocation || user?.defaultLocation;

                if (locationName) {
                    const data = await fetchLocationByName(
                        locationName,
                        controller.signal
                    );
                    setSelectedLocation(data);
                    return;
                }

                const locations = await fetchLocations(controller.signal);
                setSelectedLocation(locations[0] || null);
            } catch (error) {
                if (error.name !== "AbortError") {
                    setSelectedLocation(null);
                    setLocationError("Unable to load flood location data.");
                }
            } finally {
                setLocationLoading(false);
            }
        }

        loadSelectedLocation();

        return () => controller.abort();
    }, [user?.defaultLocation, viewingLocation]);

    const aiSummary =
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
                {locationLoading && (
                    <p className="rounded-2xl border border-slate-300 bg-white p-4 text-sm text-slate-500">
                        Loading flood data...
                    </p>
                )}

                {locationError && (
                    <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                        {locationError}
                    </p>
                )}

                {!locationLoading && !locationError && !selectedLocation && (
                    <p className="rounded-2xl border border-slate-300 bg-white p-4 text-sm text-slate-500">
                        No location data available.
                    </p>
                )}

                {!locationLoading && !locationError && selectedLocation && (
                    <>
                        <FloodCard item={selectedLocation} />

                        <section className="rounded-2xl border border-slate-300 bg-white p-4 shadow-sm">
                            <h2 className="text-sm font-bold text-slate-950">AI Summary</h2>
                            <p className="mt-3 text-sm leading-6 text-slate-700">{aiSummary}</p>
                        </section>

                        <section className="rounded-2xl border border-slate-300 bg-white p-4 shadow-sm">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h2 className="text-sm font-bold text-slate-950">
                                        Latest Update
                                    </h2>
                                    <p className="mt-2 text-sm leading-6 text-slate-700">
                                        {selectedLocation.latestUpdate?.summary || "No update available."}
                                    </p>
                                </div>
                                <span className="text-xs font-semibold text-slate-500">
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
