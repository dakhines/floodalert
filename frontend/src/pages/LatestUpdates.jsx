import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../context/useAuth";
import { useViewLocation } from "../context/useViewLocation";
import AppShell from "../components/AppShell";
import BottomNav from "../components/BottomNav";
import { fetchUpdates } from "../api/floodApi";

const alertTone = {
    Warning: "border-amber-900/25 bg-amber-500 text-white",
    Evacuation: "border-red-900/25 bg-red-500 text-white",
    Rescue: "border-sky-900/25 bg-sky-500 text-white",
};

function buildSummary(item) {
    if (item.latestUpdate) {
        const actionText = item.action
            ? ` Suggested action: ${item.action.toLowerCase()}.`
            : "";

        return `Based on current local data, ${item.location} is marked "${item.status}". ${item.latestUpdate.summary}.${actionText}`;
    }

    return item.summary || item.message || "No update summary available.";
}

export default function LatestUpdates() {
    const { user } = useAuth();
    const { viewingLocation } = useViewLocation();
    const [updates, setUpdates] = useState([]);
    const [updatesLoading, setUpdatesLoading] = useState(true);
    const [updatesError, setUpdatesError] = useState("");

    const currentLocation = viewingLocation || user?.defaultLocation;

    useEffect(() => {
        const controller = new AbortController();

        async function loadUpdates() {
            try {
                setUpdatesLoading(true);
                setUpdatesError("");
                const data = await fetchUpdates(controller.signal);
                setUpdates(data);
            } catch (error) {
                if (error.name !== "AbortError") {
                    setUpdates([]);
                    setUpdatesError("Unable to load updates.");
                }
            } finally {
                setUpdatesLoading(false);
            }
        }

        loadUpdates();

        return () => controller.abort();
    }, []);

    const visibleUpdates = updates
        .map((item) => ({
            ...item,
            summaryText: buildSummary(item),
        }))
        .filter((item) => !currentLocation || !item.location || item.location === currentLocation);

    const focusedUpdate =
        visibleUpdates.find((item) => item.location === currentLocation) ||
        visibleUpdates[0];

    return (
        <AppShell className="pb-24">
            <Link to="/home" className="text-sm font-bold text-slate-600">
                Back
            </Link>
            <h1 className="mt-3 text-2xl font-bold text-slate-950">
                {focusedUpdate?.location}
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
                Updates for the currently viewed location.
            </p>

            <section className="mt-5 space-y-3">
                {updatesLoading && (
                    <p className="rounded-xl border border-slate-300 bg-white p-4 text-sm text-slate-500">
                        Loading updates...
                    </p>
                )}

                {updatesError && (
                    <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                        {updatesError}
                    </p>
                )}

                {!updatesLoading && !updatesError && visibleUpdates.length === 0 && (
                    <p className="rounded-xl border border-slate-300 bg-white p-4 text-sm text-slate-500">
                        No updates available.
                    </p>
                )}

                {!updatesLoading &&
                    !updatesError &&
                    visibleUpdates.map((item, index) => (
                        <article
                            key={item.id || `${item.location}-${item.lastUpdate}-${index}`}
                            className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-xs font-bold text-slate-500">
                                        {item.latestUpdate?.type || item.type || "Update"}
                                    </p>
                                    <h2 className="mt-1 text-sm font-bold text-slate-950">
                                        {item.status || item.title || "Latest update"}
                                    </h2>
                                </div>
                                <span
                                    className={`rounded-full border px-3 py-1 text-[11px] font-bold ${alertTone[item.latestUpdate?.type || item.type] || "border-slate-300 bg-white text-slate-700"}`}
                                >
                                    {item.lastUpdate || item.timestamp || item.time}
                                </span>
                            </div>
                            <p className="mt-3 text-sm leading-6 text-slate-700">
                                {item.summaryText}
                            </p>
                        </article>
                    ))}
            </section>

            <BottomNav />
        </AppShell>
    );
}
