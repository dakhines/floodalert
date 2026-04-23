// Status Guide page: explains what each status means.
import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";
import BottomNav from "../components/BottomNav";
import { getStatusClasses } from "../utils/floodStatus";

const STATUS_GUIDE = [
    {
        status: "Safe",
        meaning: "No immediate flood risk is detected from the latest available data.",
        action: "You can continue normal activities, but keep checking updates during heavy rain.",
    },
    {
        status: "Risk Rising",
        meaning: "Flood risk signs are increasing, such as rising water levels or weather concerns.",
        action: "Monitor updates closely and prepare important items just in case.",
    },
    {
        status: "Warning",
        meaning: "Flood risk is serious enough that you should be more careful.",
        action: "Avoid low-lying areas, move valuables higher, and be ready to act.",
    },
    {
        status: "Flood Confirmed",
        meaning: "Flood conditions are confirmed or water levels have reached a dangerous level.",
        action: "Avoid flooded roads and follow instructions from official authorities.",
    },
    {
        status: "Evacuate",
        meaning: "The situation may be dangerous and leaving the area is recommended.",
        action: "Move to a safe place immediately if it is safe to do so, and follow official guidance.",
    },
];

export default function StatusGuide() {
    return (
        <AppShell className="pb-24">
            <Link to="/settings" className="text-sm font-bold text-slate-600 hover:text-blue-500">
                Back
            </Link>
            <h1 className="mt-3 text-2xl font-bold text-slate-950">
                Flood Status Guide
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
                Learn what each FloodAlert status means and what you should do.
            </p>

            <section className="mt-5 space-y-3">
                {STATUS_GUIDE.map((item) => (
                    <article
                        key={item.status}
                        className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm"
                    >
                        <div className={`rounded-xl border px-4 py-4 text-center ${getStatusClasses(item.status)}`}>
                            <h2 className="text-lg font-bold">{item.status}</h2>
                        </div>
                        <div className="mt-4 rounded-xl bg-slate-50 p-4">
                            <p className="text-sm font-bold text-slate-950">Meaning</p>
                            <p className="mt-1 text-sm leading-6 text-slate-700">
                                {item.meaning}
                            </p>
                        </div>
                        <div className="mt-3 rounded-xl bg-slate-50 p-4">
                            <p className="text-sm font-bold text-slate-950">What to do</p>
                            <p className="mt-1 text-sm leading-6 text-slate-700">
                                {item.action}
                            </p>
                        </div>
                    </article>
                ))}
            </section>

            <BottomNav />
        </AppShell>
    );
}
