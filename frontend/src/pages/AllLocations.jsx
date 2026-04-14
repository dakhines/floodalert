import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import floodData from "../data/floodData.json";
import { useAuth } from "../context/useAuth";
import { useViewLocation } from "../context/useViewLocation";
import AppShell from "../components/AppShell";
import BottomNav from "../components/BottomNav";
import {
    getCitiesForState,
    getStateForCity,
    locationOptions,
} from "../data/locationOptions";

const statusStyles = {
    "Flood Confirmed": "bg-red-500 border-red-900/25 text-white",
    "Risk Rising": "bg-amber-500 border-amber-900/25 text-white",
};

export default function AllLocations() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { viewingLocation, setViewingLocation } = useViewLocation();
    const activeViewingLocation = viewingLocation || user?.defaultLocation;
    const [selectedState, setSelectedState] = useState(
        getStateForCity(activeViewingLocation)
    );

    const handleSelect = (location) => {
        setViewingLocation(location);
        navigate("/home");
    };

    return (
        <AppShell className="pb-24">
            <div>
                <Link to="/home" className="text-sm font-bold text-slate-600">
                    Back
                </Link>
                <h1 className="mt-3 text-2xl font-bold text-slate-950">
                    Location
                </h1>
            </div>

            <select
                value={selectedState}
                onChange={(event) => setSelectedState(event.target.value)}
                className="mt-5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold outline-none focus:border-slate-400"
            >
                {locationOptions.map((option) => (
                    <option key={option.state} value={option.state}>
                        {option.state}
                    </option>
                ))}
            </select>

            <section className="mt-5 space-y-3">
                {floodData
                    .filter((item) =>
                        getCitiesForState(selectedState).includes(item.location)
                    )
                    .map((item) => {
                        const isViewing = item.location === activeViewingLocation;
                        const isDefault = item.location === user?.defaultLocation;

                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => handleSelect(item.location)}
                                className={`w-full cursor-pointer rounded-xl border px-4 py-3 text-left transition duration-200 ${
                                    isViewing
                                        ? "border-sky-400 bg-sky-50 shadow-sm"
                                        : "border-slate-300 bg-white hover:border-sky-300 hover:bg-sky-50/40 hover:shadow-sm active:scale-[0.99]"
                                }`}
                            >
                                <div className="flex items-center justify-between gap-4">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h2 className="text-sm font-bold text-slate-950">
                                                {item.location}
                                            </h2>
                                            {isDefault && (
                                                <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600">
                                                    Default
                                                </span>
                                            )}
                                            {isViewing && (
                                                <span className="rounded-full bg-sky-100 px-2 py-1 text-[10px] font-bold text-sky-700">
                                                    Viewing now
                                                </span>
                                            )}
                                        </div>
                                        <p className="mt-1 text-xs text-slate-500">
                                            {item.reason}
                                        </p>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-3">
                                        <span
                                            className={`rounded-full border px-3 py-1 text-[11px] font-bold ${
                                                statusStyles[item.status] ||
                                                "bg-white text-slate-700 border-slate-300"
                                            }`}
                                        >
                                            {item.status}
                                        </span>
                                        <ChevronRight
                                            size={20}
                                            className="shrink-0 text-slate-400"
                                        />
                                    </div>
                                </div>
                            </button>
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
