// Signup page: create account + verify email code.
import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import AppShell from "../components/AppShell";
import PasswordField from "../components/PasswordField";
import logo from "../img/logo.png";
import { MALAYSIA_LOCATION_DATA } from "../data/locations";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z0-9]+$/;

export default function SignUp() {
    const navigate = useNavigate();
    const { signup, user } = useAuth(); 

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [defaultState, setDefaultState] = useState("");
    const [defaultDistrict, setDefaultDistrict] = useState("");
    const [defaultLocation, setDefaultLocation] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const states = useMemo(() => Object.keys(MALAYSIA_LOCATION_DATA), []);
    const districts = defaultState
        ? Object.keys(MALAYSIA_LOCATION_DATA[defaultState] || {})
        : [];
    const cities =
        defaultState && defaultDistrict
            ? MALAYSIA_LOCATION_DATA[defaultState]?.[defaultDistrict] || []
            : [];

    if (user) {
        return <Navigate to="/home" replace />;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) {
            return;
        }

        const trimmedName = name.trim();
        const trimmedEmail = email.trim();
        const trimmedPassword = password.trim();

        if (!trimmedName) {
            setError("Please enter a username.");
            return;
        }

        if (!emailPattern.test(trimmedEmail)) {
            setError("Please enter a valid email address.");
            return;
        }

        if (!trimmedPassword) {
            setError("Please enter a password.");
            return;
        }

        if (!passwordPattern.test(trimmedPassword)) {
            setError("Password must include uppercase, lowercase, and numbers only.");
            return;
        }

        if (!defaultLocation) {
            setError("Please choose a default city or area.");
            return;
        }

        setError("");

        const newUser = {
            name: trimmedName,
            email: trimmedEmail,
            password: trimmedPassword,
            state: defaultState,
            defaultLocation,
            defaultState,
            defaultDistrict,
        };

        try {
            setIsSubmitting(true);
            await signup(newUser);
            sessionStorage.setItem("signup-email", trimmedEmail);
            navigate("/verify-signup-code");
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AppShell className="flex flex-col justify-center">
            <div className="mx-auto w-full max-w-sm rounded-[2rem] bg-white p-6 text-center shadow-[0_0_0_1px_rgba(15,23,42,0.08)]">
                <img src={logo} alt="FloodGuard logo" className="mx-auto h-30 w-30 object-contain" />
                <h1 className="text-xl font-bold text-slate-950">Sign Up</h1>

                {error && (
                    <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </p>
                )}

                <form onSubmit={handleSubmit} className="mt-5 space-y-3 text-left">
                    <input
                        type="text"
                        placeholder="Username"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
                    />
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
                    />
                    <PasswordField
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        className="rounded-lg focus-within:border-sky-500"
                        inputClassName="rounded-l-lg px-3 py-2"
                    />
                    <select
                        value={defaultState}
                        onChange={(e) => {
                            setDefaultState(e.target.value);
                            setDefaultDistrict("");
                            setDefaultLocation("");
                        }}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
                    >
                        <option value="">Select State</option>
                        {states.map((state) => (
                            <option key={state} value={state}>
                                {state}
                            </option>
                        ))}
                    </select>
                    <select
                        value={defaultDistrict}
                        onChange={(e) => {
                            setDefaultDistrict(e.target.value);
                            setDefaultLocation("");
                        }}
                        disabled={!defaultState}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 disabled:bg-slate-100 disabled:text-slate-400"
                    >
                        <option value="">Select District</option>
                        {districts.map((district) => (
                            <option key={district} value={district}>
                                {district}
                            </option>
                        ))}
                    </select>
                    <select
                        value={defaultLocation}
                        onChange={(e) => setDefaultLocation(e.target.value)}
                        disabled={!defaultDistrict}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 disabled:bg-slate-100 disabled:text-slate-400"
                    >
                        <option value="">Select City/Area</option>
                        {cities.map((city) => (
                            <option key={city} value={city}>
                                {city}
                            </option>
                        ))}
                    </select>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full rounded-full border border-slate-950 px-4 py-2 text-sm font-bold text-slate-950
                                   transition duration-200 ease-in-out
                                    hover:bg-slate-800 hover:scale-105 hover:text-white
                                    disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
                    >
                        {isSubmitting ? "Sending..." : "Confirm"}
                    </button>
                </form>

                <p className="mt-4 text-[11px] text-slate-600">
                    Already have an account?{" "}
                    <Link to="/login" className="font-bold text-slate-950 hover:text-blue-500">
                        Login
                    </Link>
                </p>
            </div>
        </AppShell>
    );
}
