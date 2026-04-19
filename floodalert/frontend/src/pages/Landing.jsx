import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import AppShell from "../components/AppShell";
import logo from "../img/logo.png";

export default function Landing() {
    const { user } = useAuth();

    if (user) {
        return <Navigate to="/home" replace />;
    }

    return (
        <AppShell className="flex flex-col items-center justify-center text-center">
            <img src={logo} alt="FloodGuard logo" className="h-40 w-40 object-contain" />
            <h1 className="text-2xl font-bold text-slate-950">
                Welcome to FloodGuard
            </h1>
            <p className="mt-2 max-w-xs text-sm leading-6 text-slate-600">
                We Detect, You Act.
            </p>

            <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
                <Link
                    to="/login"
                    className="rounded-full bg-slate-950 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-slate-300
                                transition duration-200 ease-in-out 
                                hover:bg-slate-800 hover:scale-105"
                >
                    Login
                </Link>
                <Link
                    to="/signup"
                    className="rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-950
                                transition duration-200 ease-in-out
                                hover:bg-slate-100 hover:scale-105"
                >
                    Signup
                </Link>
            </div>
        </AppShell>
    );
}
