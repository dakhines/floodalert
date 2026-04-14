import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import homeData from "../data/floodData.json";
import FloodCard from "../components/FloodCard";
import { useViewLocation } from "../context/useViewLocation";
import AppShell from "../components/AppShell";
import BottomNav from "../components/BottomNav";
import { useState, useEffect } from "react";
import "./Home.css";

export default function Home() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { viewingLocation } = useViewLocation();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const selectedLocation =
        homeData.find((item) => item.location === viewingLocation) ||
        homeData.find((item) => item.location === user?.defaultLocation) ||
        homeData[0];

    const aiSummary = selectedLocation.aiSummary;
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
                                {selectedLocation.latestUpdate.summary}
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
            </div>

            <BottomNav />
        </AppShell>
    );
}
