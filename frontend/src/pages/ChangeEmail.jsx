import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import AppShell from "../components/AppShell";
import BottomNav from "../components/BottomNav";
import PasswordField from "../components/PasswordField";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ChangeEmail() {
    const navigate = useNavigate();
    const { user, updateProfile } = useAuth();
    const [newEmail, setNewEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = (event) => {
        event.preventDefault();
        const trimmedEmail = newEmail.trim();

        if (!emailPattern.test(trimmedEmail)) {
            setError("Please enter a valid email.");
            return;
        }

        if (
            user?.email &&
            trimmedEmail.toLowerCase() === user.email.toLowerCase()
        ) {
            setError("New email cannot be the same as your current email.");
            return;
        }

        // TODO: Backend must also validate email ownership and prevent reusing the current email.

        try {
            updateProfile({
                name: user?.name,
                email: trimmedEmail,
                currentPassword: password,
            });
            navigate("/settings");
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <AppShell className="pb-24">
            <Link to="/settings/edit" className="text-sm font-bold text-slate-600">
                Back
            </Link>
            <h1 className="mt-3 text-2xl font-bold text-slate-950">
                Change Email
            </h1>

            {error && (
                <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </p>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-3">
                <input
                    value={newEmail}
                    onChange={(event) => setNewEmail(event.target.value)}
                    placeholder="New Email"
                    className="h-12 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600"
                />
                <PasswordField
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Password"
                />
                <button
                    type="submit"
                    className="w-full rounded-xl bg-blue-600 p-3 text-sm font-bold text-white"
                >
                    Update Email
                </button>
            </form>

            <BottomNav />
        </AppShell>
    );
}
