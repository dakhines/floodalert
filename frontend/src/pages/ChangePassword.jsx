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

    const handleSubmit = (event) => {
        event.preventDefault();

        if (sessionStorage.getItem("password-change-verified") !== "true") {
            navigate("/verify-password-code");
            return;
        }

        if (form.password !== form.confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        if (user?.password && form.password === user.password) {
            setError("New password must be different from your current password.");
            return;
        }

        try {
            // TODO: Backend must verify current password and prevent password reuse.
            updateProfile({
                name: user?.name,
                email: user?.email,
                password: form.password,
                currentPassword: user?.password,
                code: "1234",
            });
            sessionStorage.removeItem("password-change-verified");
            navigate("/settings");
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <AppShell className="pb-24">
            <Link
                to="/verify-password-code"
                className="text-sm font-bold text-slate-600"
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
                    onChange={(event) =>
                        setForm({ ...form, password: event.target.value })
                    }
                    placeholder="New Password"
                />
                <PasswordField
                    value={form.confirmPassword}
                    onChange={(event) =>
                        setForm({ ...form, confirmPassword: event.target.value })
                    }
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
