import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import BottomNav from "../components/BottomNav";
import OTPInput from "../components/OTPInput";
import { sendEmailCode, verifyEmailCode } from "../api/authApi";
import { useAuth } from "../context/useAuth";
import useResendCooldown from "../hooks/useResendCooldown";

export default function VerifyPasswordCode() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [code, setCode] = useState("");
    const [message, setMessage] = useState(
        "Send a verification code to your email before changing password."
    );
    const [error, setError] = useState("");
    const [isSending, setIsSending] = useState(false);
    const { cooldownSeconds, isCoolingDown, startCooldown } =
        useResendCooldown(30);

    const handleSendCode = async () => {
        if (isSending || isCoolingDown) {
            return;
        }

        try {
            setIsSending(true);
            await sendEmailCode({
                email: user?.email,
                purpose: "change-password",
            });
            setError("");
            setMessage("Verification code sent to your email.");
            startCooldown();
        } catch (err) {
            setMessage("");
            setError(err.message);
        } finally {
            setIsSending(false);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            const result = await verifyEmailCode({
                email: user?.email,
                purpose: "change-password",
                code,
            });
            sessionStorage.setItem(
                "password-change-token",
                result.verificationToken || ""
            );
            sessionStorage.setItem("password-change-verified", "true");
            navigate("/change-password");
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <AppShell className="pb-24">
            <Link replace to="/settings/edit" className="text-sm font-bold text-slate-600 hover:text-blue-500">
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

            <button
                type="button"
                onClick={handleSendCode}
                disabled={isSending || isCoolingDown}
                className="mt-5 w-full rounded-xl border border-slate-950 p-3 text-sm font-bold text-slate-950"
            >
                {isSending
                    ? "Sending..."
                    : isCoolingDown
                      ? `Send again in ${cooldownSeconds}s`
                      : "Send verification code"}
            </button>

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
                onClick={handleSendCode}
                disabled={isSending || isCoolingDown}
                className="mt-3 block w-full text-center text-xs font-semibold text-gray-500"
            >
                {isCoolingDown ? `Send again in ${cooldownSeconds}s` : "Send again"}
            </button>

            <BottomNav />
        </AppShell>
    );
}
