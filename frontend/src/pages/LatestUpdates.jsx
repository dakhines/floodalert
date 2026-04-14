import { Link } from "react-router-dom";
import floodData from "../data/floodData.json";
import { useAuth } from "../context/useAuth";
import { useViewLocation } from "../context/useViewLocation";
import AppShell from "../components/AppShell";
import BottomNav from "../components/BottomNav";

const alertTone = {
    Warning: "border-amber-900/25 bg-amber-500 text-white",
    Evacuation: "border-red-900/25 bg-red-500 text-white",
    Rescue: "border-sky-900/25 bg-sky-500 text-white",
};

function buildSummary(item) {
    return `Based on current local data, ${item.location} is marked "${item.status}". ${item.latestUpdate.summary}. Suggested action: ${item.action.toLowerCase()}.`;
}

export default function LatestUpdates() {
    const { user } = useAuth();
    const { viewingLocation } = useViewLocation();

    const currentLocation =
        viewingLocation || user?.defaultLocation || floodData[0]?.location;

    const updates = [...floodData]
        .map((item) => ({
            ...item,
            summaryText: buildSummary(item),
        }))
        .sort((a, b) => {
            if (a.location === currentLocation && b.location !== currentLocation) {
                return -1;
            }

            if (b.location === currentLocation && a.location !== currentLocation) {
                return 1;
            }

            return b.id - a.id;
        });

    const focusedUpdate =
        updates.find((item) => item.location === currentLocation) || updates[0];

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
                {updates
                    .filter((item) => item.location === currentLocation)
                    .map((item) => (
                        <article
                            key={item.id}
                            className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-xs font-bold text-slate-500">
                                        {item.latestUpdate.type}
                                    </p>
                                    <h2 className="mt-1 text-sm font-bold text-slate-950">
                                        {item.status}
                                    </h2>
                                </div>
                                <span
                                    className={`rounded-full border px-3 py-1 text-[11px] font-bold ${alertTone[item.latestUpdate.type] || "border-slate-300 bg-white text-slate-700"}`}
                                >
                                    {item.lastUpdate}
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
