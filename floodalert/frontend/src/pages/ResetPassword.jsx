import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import AppShell from "../components/AppShell";
import PasswordField from "../components/PasswordField";
import logo from "../img/logo.png";

export default function ResetPassword() {
    const navigate = useNavigate();
    const { resetPassword } = useAuth();
    const [form, setForm] = useState({
        password: "",
        confirmPassword: "",
    });
    const [error, setError] = useState(() =>
        sessionStorage.getItem("reset-token")
            ? ""
            : "Verify your email code first."
    );

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (form.password !== form.confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        if (!sessionStorage.getItem("reset-token")) {
            setError("Verify your email code first.");
            return;
        }

        try {
            await resetPassword({
                email: sessionStorage.getItem("reset-email") || "",
                password: form.password,
                verificationToken: sessionStorage.getItem("reset-token") || "",
            });
            sessionStorage.removeItem("reset-email");
            sessionStorage.removeItem("reset-token");
            navigate("/login");
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <AppShell className="flex flex-col justify-center">
            <div className="mx-auto w-full max-w-sm rounded-[2rem] bg-white p-6 text-center shadow-[0_0_0_1px_rgba(15,23,42,0.08)]">
                <img src={logo} alt="FloodGuard logo" className="mx-auto h-10 w-10 object-contain" />
                <h1 className="mt-5 text-lg font-bold text-slate-950">
                    Reset Password to Access FloodGuard
                </h1>

                {error && (
                    <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </p>
                )}

                <form onSubmit={handleSubmit} className="mt-5 space-y-3 text-left">
                    <PasswordField
                        placeholder="New Password"
                        value={form.password}
                        onChange={(event) => {
                            setForm({ ...form, password: event.target.value });
                            setError("");
                        }}
                        className="rounded-lg focus-within:border-sky-500"
                        inputClassName="rounded-l-lg px-3 py-2"
                    />
                    <PasswordField
                        placeholder="Confirm Password"
                        value={form.confirmPassword}
                        onChange={(event) => {
                            setForm({
                                ...form,
                                confirmPassword: event.target.value,
                            });
                            setError("");
                        }}
                        className="rounded-lg focus-within:border-sky-500"
                        inputClassName="rounded-l-lg px-3 py-2"
                    />

                    <button
                        type="submit"
                        className="w-full rounded-full border border-slate-950 px-4 py-2 text-sm font-bold text-slate-950"
                    >
                        Continue
                    </button>
                    <Link
                        to="/login"
                        className="block w-full rounded-full border border-slate-300 px-4 py-2 text-center text-sm font-bold text-slate-700 hover:text-blue-500"
                    >
                        Cancel
                    </Link>
                </form>
            </div>
        </AppShell>
    );
}
