import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import AppShell from "../components/AppShell";
import BottomNav from "../components/BottomNav";
import PasswordField from "../components/PasswordField";
import OTPInput from "../components/OTPInput";
import {
    checkAccountEmail,
    sendEmailCode,
    verifyEmailCode,
} from "../api/authApi";
import useResendCooldown from "../hooks/useResendCooldown";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ChangeEmail() {
    const navigate = useNavigate();
    const { user, updateProfile } = useAuth();
    const [newEmail, setNewEmail] = useState("");
    const [password, setPassword] = useState("");
    const [code, setCode] = useState("");
    const [pendingEmail, setPendingEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const { cooldownSeconds, isCoolingDown, startCooldown } =
        useResendCooldown(30);

    const sendChangeEmailCode = async (email) => {
        await sendEmailCode({
            email,
            purpose: "change-email",
            currentEmail: user?.email,
            currentPassword: password.trim(),
        });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const trimmedEmail = newEmail.trim();
        const trimmedPassword = password.trim();

        if (!emailPattern.test(trimmedEmail)) {
            setError("Please enter a valid email.");
            return;
        }

        if (!trimmedPassword) {
            setError("Please enter your password.");
            return;
        }

        if (
            user?.email &&
            trimmedEmail.toLowerCase() === user.email.toLowerCase()
        ) {
            setError("New email cannot be the same as your current email.");
            return;
        }

        try {
            setIsSending(true);
            const result = await checkAccountEmail(trimmedEmail);
            if (result.exists) {
                setError("Email is already registered.");
                return;
            }

            await sendChangeEmailCode(trimmedEmail);
            setPendingEmail(trimmedEmail);
            setCode("");
            setError("");
            setMessage("Enter the 4 digit code sent to your new email.");
            startCooldown();
        } catch (err) {
            setMessage("");
            setError(err.message);
        } finally {
            setIsSending(false);
        }
    };

    const handleSendAgain = async () => {
        if (isSending || isCoolingDown || !pendingEmail) {
            return;
        }

        try {
            setIsSending(true);
            await sendChangeEmailCode(pendingEmail);
            setError("");
            setMessage("Code sent again to your new email.");
            startCooldown();
        } catch (err) {
            setMessage("");
            setError(err.message);
        } finally {
            setIsSending(false);
        }
    };

    const handleVerifyAndUpdate = async (event) => {
        event.preventDefault();

        if (code.length !== 4) {
            setError("Enter the 4 digit code.");
            return;
        }

        try {
            setIsUpdating(true);
            const result = await verifyEmailCode({
                email: pendingEmail,
                purpose: "change-email",
                code,
            });
            await updateProfile({
                name: user?.name,
                email: pendingEmail,
                currentPassword: password.trim(),
                emailVerificationToken: result.verificationToken || "",
            });
            navigate("/settings");
        } catch (err) {
            setError(err.message);
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <AppShell className="pb-24">
            <Link replace to="/settings/edit" className="text-sm font-bold text-slate-600 hover:text-blue-500">
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
            {message && (
                <p className="mt-4 rounded-2xl bg-sky-50 px-4 py-3 text-sm text-sky-700">
                    {message}
                </p>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-3">
                <input
                    type="email"
                    value={newEmail}
                    onChange={(event) => {
                        setNewEmail(event.target.value);
                        setPendingEmail("");
                        setMessage("");
                        setError("");
                    }}
                    placeholder="New Email"
                    disabled={Boolean(pendingEmail)}
                    required
                    className="h-12 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 disabled:bg-slate-100 disabled:text-slate-500"
                />
                <PasswordField
                    value={password}
                    onChange={(event) => {
                        setPassword(event.target.value);
                        setPendingEmail("");
                        setMessage("");
                        setError("");
                    }}
                    placeholder="Password"
                    required
                    disabled={Boolean(pendingEmail)}
                    className={pendingEmail ? "bg-slate-100" : ""}
                    inputClassName={pendingEmail ? "bg-slate-100 text-slate-500" : ""}
                />
                <button
                    type={pendingEmail ? "button" : "submit"}
                    disabled={isSending || isCoolingDown}
                    className="w-full rounded-xl bg-blue-600 p-3 text-sm font-bold text-white"
                    onClick={pendingEmail ? handleSendAgain : undefined}
                >
                    {isSending
                        ? "Sending..."
                        : pendingEmail && isCoolingDown
                          ? `Send again in ${cooldownSeconds}s`
                          : "Send Verification Code"}
                </button>
            </form>

            {pendingEmail && (
                <form
                    onSubmit={handleVerifyAndUpdate}
                    className="mx-auto mt-5 flex max-w-xs flex-col items-center space-y-3"
                >
                    <OTPInput value={code} onChange={(value) => {
                        setCode(value);
                        setError("");
                    }} />
                    <button
                        type="submit"
                        disabled={isUpdating}
                        className="w-full rounded-xl bg-blue-600 p-3 text-sm font-bold text-white"
                    >
                        {isUpdating ? "Updating..." : "Update Email"}
                    </button>
                    <button
                        type="button"
                        onClick={handleSendAgain}
                        disabled={isSending || isCoolingDown}
                        className="text-xs font-bold text-slate-500"
                    >
                        Didn't receive the code? Send again
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setPendingEmail("");
                            setCode("");
                            setMessage("");
                            setError("");
                        }}
                        className="text-xs font-bold text-slate-500"
                    >
                        Change email address
                    </button>
                </form>
            )}

            <BottomNav />
        </AppShell>
    );
}
