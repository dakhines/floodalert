import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";
import BottomNav from "../components/BottomNav";

export default function HowToUse() {
    return (
        <AppShell className="pb-24">
            <Link to="/settings" className="text-sm font-bold text-slate-600">
                Back
            </Link>
            <h1 className="mt-3 text-2xl font-bold text-slate-950">
                How to use?
            </h1>

            <section className="mt-5 rounded-xl border border-slate-300 p-4">
                <p className="text-sm leading-7 text-slate-700">
                    Use Home to check your current flood status and action summary.
                    Use Locations to temporarily view another city without changing your
                    saved default. Use Updates to read the latest alerts for the city you
                    are currently viewing.
                </p>
                <div className="mt-5 flex h-40 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-center text-sm font-semibold text-slate-500">
                    Demo video / instructions placeholder
                </div>
            </section>

            <BottomNav />
        </AppShell>
    );
}
