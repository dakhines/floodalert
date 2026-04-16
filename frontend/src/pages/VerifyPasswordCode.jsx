import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import BottomNav from "../components/BottomNav";
import OTPInput from "../components/OTPInput";

export default function VerifyPasswordCode() {
    const navigate = useNavigate();
    const [code, setCode] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = (event) => {
        event.preventDefault();

        // TODO: Verify code with backend before allowing password reset.
        if (code !== "1234") {
            setError("Invalid verification code.");
            return;
        }

        sessionStorage.setItem("password-change-verified", "true");
        navigate("/change-password");
    };

    return (
        <AppShell className="pb-24">
            <Link to="/settings/edit" className="text-sm font-bold text-slate-600 hover:text-blue-500">
                Back
            </Link>
            <h1 className="mt-3 text-2xl font-bold text-slate-950">
                Verify Code
            </h1>

            {message && (
                <p className="mt-4 rounded-2xl bg-blue-50 px-4 py-3 text-sm text-blue-700">
                    {message}
                </p>
            )}
            {error && (
                <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </p>
            )}

            <form
                onSubmit={handleSubmit}
                className="mx-auto mt-5 flex max-w-xs flex-col items-center space-y-3"
            >
                <OTPInput value={code} onChange={setCode} />
                <button
                    type="submit"
                    className="w-full rounded-xl bg-blue-600 p-3 text-sm font-bold text-white"
                >
                    Verify
                </button>
            </form>
            <button
                type="button"
                onClick={() => {
                    // TODO: Send verification code through backend email service.
                    setError("");
                    setMessage("Verification code sent again: 1234");
                }}
                className="mt-3 block w-full text-center text-xs font-semibold text-gray-500"
            >
                Send again
            </button>

            <BottomNav />
        </AppShell>
    );
}
