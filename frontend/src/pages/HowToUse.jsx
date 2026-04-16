import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";
import BottomNav from "../components/BottomNav";

export default function HowToUse() {
    return (
        <AppShell className="pb-24">
            <Link to="/settings" className="text-sm font-bold text-slate-600 hover:text-blue-500">
                Back
            </Link>
            <h1 className="mt-3 text-2xl font-bold text-slate-950">
                How to use?
            </h1>

            <section className="mt-5 rounded-xl border border-slate-300 p-4">
                <p className="text-lg font-bold text-black">
                    Welcome to FloodAlert
                </p>
                <p className="text-sm leading-7 text-slate-700">
                    FloodAlert helps you quickly check flood conditions, understand what to do, and stay updated with the latest information in your area. Everything is designed to be simple and fast, so you can get what you need in seconds. Watch the video below to see how it works.
                </p>
                <br></br>
                <p className="text-sm font-semibold leading-7 text-slate-700">
                    Stay alert. Stay prepared.
                </p>
                <div className="mt-5 flex h-40 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-center text-sm font-semibold text-slate-500">
                    Demo video / instructions placeholder
                </div>
            </section>

            <BottomNav />
        </AppShell>
    );
}
