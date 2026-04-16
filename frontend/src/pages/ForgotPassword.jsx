import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import logo from "../img/logo.png";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getKnownAccountEmails() {
    const emails = [];

    try {
        const users = JSON.parse(localStorage.getItem("users")) || [];
        emails.push(
            ...users
                .map((user) => user?.email)
                .filter(Boolean)
        );
    } catch {
        // Ignore invalid mock storage and let backend validation handle it later.
    }

    try {
        const currentUser = JSON.parse(localStorage.getItem("user"));
        if (currentUser?.email) {
            emails.push(currentUser.email);
        }
    } catch {
        // Ignore invalid mock storage and let backend validation handle it later.
    }

    return [...new Set(emails.map((item) => item.toLowerCase()))];
}

export default function ForgotPassword() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = (event) => {
        event.preventDefault();
        const trimmedEmail = email.trim();

        if (!emailPattern.test(trimmedEmail)) {
            setError("Please enter a valid email address.");
            return;
        }

        const knownAccountEmails = getKnownAccountEmails();

        // TODO: Backend must validate account ownership before sending reset code.
        if (
            knownAccountEmails.length > 0 &&
            !knownAccountEmails.includes(trimmedEmail.toLowerCase())
        ) {
            setError("This email does not match your account.");
            return;
        }

        sessionStorage.setItem("reset-email", trimmedEmail);
        sessionStorage.setItem("reset-code", "1234");
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
                        className="w-full rounded-full border border-slate-950 px-4 py-2 text-sm font-bold text-slate-950"
                    >
                        Submit
                    </button>
                </form>

                <Link
                    to="/login"
                    className="mt-3 block text-[11px] font-semibold text-slate-500"
                >
                    Back to login
                </Link>
            </div>
        </AppShell>
    );
}
