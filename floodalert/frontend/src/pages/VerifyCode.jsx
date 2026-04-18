import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import logo from "../img/logo.png";
import OTPInput from "../components/OTPInput";
import { sendEmailCode, verifyEmailCode } from "../api/authApi";
import useResendCooldown from "../hooks/useResendCooldown";

export default function VerifyCode() {
    const navigate = useNavigate();
    const [code, setCode] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [isSending, setIsSending] = useState(false);
    const { cooldownSeconds, isCoolingDown, startCooldown } =
        useResendCooldown(30, 30, "reset-password-resend-cooldown");

    const handleSubmit = async (event) => {
        event.preventDefault();
        const email = sessionStorage.getItem("reset-email") || "";

        try {
            const result = await verifyEmailCode({
                email,
                purpose: "reset-password",
                code,
            });
            sessionStorage.setItem(
                "reset-token",
                result.verificationToken || ""
            );
            navigate("/reset-password");
        } catch (err) {
            setError(err.message);
        }
    };

    const handleSendAgain = async () => {
        if (isSending || isCoolingDown) {
            return;
        }

        const email = sessionStorage.getItem("reset-email") || "";

        try {
            setIsSending(true);
            await sendEmailCode({
                email,
                purpose: "reset-password",
            });
            setError("");
            setMessage("Code sent again.");
            startCooldown();
        } catch (err) {
            setMessage("");
            setError(err.message);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <AppShell className="flex flex-col justify-center">
            <div className="mx-auto w-full max-w-sm rounded-[2rem] bg-white p-6 text-center shadow-[0_0_0_1px_rgba(15,23,42,0.08)]">
                <img src={logo} alt="FloodGuard logo" className="mx-auto h-10 w-10 object-contain" />
                <h1 className="mt-5 text-lg font-bold text-slate-950">
                    Verify your email to Change your password
                </h1>

                {error && (
                    <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </p>
                )}
                {message && (
                    <p className="mt-4 rounded-2xl bg-sky-50 px-4 py-3 text-sm text-sky-700">
                        {message}
                    </p>
                )}

                <form
                    onSubmit={handleSubmit}
                    className="mx-auto mt-5 flex max-w-xs flex-col items-center space-y-4"
                >
                    <OTPInput value={code} onChange={setCode} />

                    <button
                        type="submit"
                        className="w-full rounded-full border border-slate-950 px-4 py-2 text-sm font-bold text-slate-950"
                    >
                        Confirm
                    </button>
                </form>

                <button
                    type="button"
                    onClick={handleSendAgain}
                    disabled={isSending || isCoolingDown}
                    className="mt-3 block w-full text-center text-[11px] font-semibold text-slate-500 hover:text-blue-500 disabled:hover:text-slate-500"
                >
                    {isSending
                        ? "Sending..."
                        : isCoolingDown
                          ? `Send again in ${cooldownSeconds}s`
                          : "Don't receive the code? Send again"}
                </button>
                <Link
                    to="/login"
                    className="mt-2 block text-center text-[11px] font-semibold text-slate-500 hover:text-blue-500"
                >
                    Cancel
                </Link>
            </div>
        </AppShell>
    );
}
