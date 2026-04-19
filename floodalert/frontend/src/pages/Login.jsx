import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import AppShell from "../components/AppShell";
import PasswordField from "../components/PasswordField";
import logo from "../img/logo.png";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
    const { login, user } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        identifier: "",
        password: "",
    });

    const [error, setError] = useState("");

    if (user) {
        return <Navigate to="/home" replace />;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        const identifier = form.identifier.trim();
        const password = form.password.trim();

        if (!identifier) {
            setError("Please enter your username/email.");
            return;
        }

        if (!password) {
            setError("Please enter your password.");
            return;
        }

        if (identifier.includes("@") && !emailPattern.test(identifier)) {
            setError("Invalid email format.");
            return;
        }

        try {
            await login(form);
            navigate("/home");
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <AppShell className="flex flex-col justify-center">
            <div className="mx-auto w-full max-w-sm rounded-[2rem] bg-white p-6 text-center shadow-[0_0_0_1px_rgba(15,23,42,0.08)]">
                <img src={logo} alt="FloodGuard logo" className="mx-auto h-30 w-30 object-contain" />
                <h1 className="text-xl font-bold text-slate-950">Login</h1>

                {error && (
                    <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </p>
                )}

                <form onSubmit={handleSubmit} className="mt-5 space-y-3 text-left">
                    <input
                        type="text"
                        placeholder="Username/Email"
                        value={form.identifier}
                        onChange={(e) =>
                            setForm({ ...form, identifier: e.target.value })
                        }
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
                    />

                    <div>
                        <PasswordField
                            value={form.password}
                            onChange={(e) =>
                                setForm({ ...form, password: e.target.value })
                            }
                            placeholder="Password"
                            className="rounded-lg focus-within:border-sky-500"
                            inputClassName="rounded-l-lg px-3 py-2"
                        />
                        <Link
                            to="/forgot-password"
                            className="mt-1 block text-right text-[11px] font-semibold text-slate-500 hover:text-blue-500"
                        >
                            Forgot password?
                        </Link>
                    </div>

                    <button
                        type="submit"
                        className="w-full rounded-full border border-slate-950 px-4 py-2 text-sm font-bold text-slate-950
                                transition duration-200 ease-in-out
                                hover:bg-slate-800 hover:scale-105 hover:text-white"
                    >
                        Confirm
                    </button>
                </form>

                <p className="mt-4 text-[11px] text-slate-600">
                    Don&apos;t have an account?{" "}
                    <Link to="/signup" className="font-bold text-slate-950 hover:text-blue-500">
                        Sign Up
                    </Link>
                </p>
            </div>
        </AppShell>
    );
}
