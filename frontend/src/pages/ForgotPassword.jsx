import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import { checkAccountEmail, sendEmailCode } from "../api/authApi";
import logo from "../img/logo.png";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPassword() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (isSubmitting) {
            return;
        }

        const trimmedEmail = email.trim();

        if (!emailPattern.test(trimmedEmail)) {
            setError("Please enter a valid email address.");
            return;
        }

        try {
            setIsSubmitting(true);
            const result = await checkAccountEmail(trimmedEmail);
            if (!result.exists) {
                setError("This email does not match your account.");
                return;
            }
            await sendEmailCode({
                email: trimmedEmail,
                purpose: "reset-password",
            });
        } catch (err) {
            setError(err.message || "Unable to verify this email.");
            return;
        } finally {
            setIsSubmitting(false);
        }

        sessionStorage.setItem("reset-email", trimmedEmail);
        navigate("/verify-code");
    };

    return (
        <AppShell className="flex flex-col justify-center">
            <div className="mx-auto w-full max-w-sm rounded-[2rem] bg-white p-6 text-center shadow-[0_0_0_1px_rgba(15,23,42,0.08)]">
                <img src={logo} alt="FloodGuard logo" className="mx-auto h-10 w-10 object-contain" />
                <h1 className="mt-5 text-lg font-bold text-slate-950">
                    Forgot your password and continue
                </h1>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                    Enter your email and we will send a 4 digit verification code.
                </p>

                {error && (
                    <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </p>
                )}

                <form onSubmit={handleSubmit} className="mt-5 space-y-3 text-left">
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
                    />
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full rounded-full border border-slate-950 px-4 py-2 text-sm font-bold text-slate-950"
                    >
                        {isSubmitting ? "Sending..." : "Submit"}
                    </button>
                </form>

                <Link
                    to="/login"
                    className="mt-3 block text-[11px] font-semibold text-slate-500 hover:text-blue-500"
                >
                    Back to login
                </Link>
            </div>
        </AppShell>
    );
}
