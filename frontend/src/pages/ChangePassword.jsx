// Change Password page.
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import AppShell from "../components/AppShell";
import BottomNav from "../components/BottomNav";
import PasswordField from "../components/PasswordField";

export default function ChangePassword() {
    const navigate = useNavigate();
    const { user, updateProfile } = useAuth();
    const [form, setForm] = useState({
        password: "",
        confirmPassword: "",
    });
    const [error, setError] = useState("");

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (sessionStorage.getItem("password-change-verified") !== "true") {
            navigate("/verify-password-code");
            return;
        }

        if (!sessionStorage.getItem("password-change-token")) {
            setError("Verify your email code first.");
            return;
        }

        if (form.password !== form.confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        try {
            await updateProfile({
                name: user?.name,
                email: user?.email,
                password: form.password,
                verificationToken:
                    sessionStorage.getItem("password-change-token") || "",
            });
            sessionStorage.removeItem("password-change-verified");
            sessionStorage.removeItem("password-change-token");
            navigate("/settings");
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <AppShell className="pb-24">
            <Link
                replace
                to="/verify-password-code"
                className="text-sm font-bold text-slate-600 hover:text-blue-500"
            >
                Back
            </Link>
            <h1 className="mt-3 text-2xl font-bold text-slate-950">
                Change Password
            </h1>

            {error && (
                <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </p>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-3">
                <PasswordField
                    value={form.password}
                    onChange={(event) => {
                        setForm({ ...form, password: event.target.value });
                        setError("");
                    }}
                    placeholder="New Password"
                />
                <PasswordField
                    value={form.confirmPassword}
                    onChange={(event) => {
                        setForm({ ...form, confirmPassword: event.target.value });
                        setError("");
                    }}
                    placeholder="Confirm New Password"
                />
                <button
                    type="submit"
                    className="w-full rounded-xl bg-blue-600 p-3 text-sm font-bold text-white"
                >
                    Update Password
                </button>
            </form>

            <BottomNav />
        </AppShell>
    );
}
