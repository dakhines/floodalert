import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import AppShell from "../components/AppShell";
import PasswordField from "../components/PasswordField";
import { getCitiesForState, locationOptions } from "../data/locationOptions";
import logo from "../img/logo.png";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z0-9]+$/;

export default function SignUp() {
    const navigate = useNavigate();
    const { signup, user } = useAuth(); 

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [selectedState, setSelectedState] = useState(locationOptions[0].state);
    const [defaultLocation, setDefaultLocation] = useState("");
    const [error, setError] = useState("");

    if (user) {
        return <Navigate to="/home" replace />;
    }

    const handleSubmit = (e) => {
        e.preventDefault();

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
            setError("Please choose a default location.");
            return;
        }

        setError("");

        const newUser = {
            name: trimmedName,
            email: trimmedEmail,
            password: trimmedPassword,
            defaultLocation,
        };

        try {
            signup(newUser);
            navigate("/home");
        } catch (err) {
            setError(err.message);
        }
    };

    const handleStateChange = (nextState) => {
        setSelectedState(nextState);
        setDefaultLocation("");
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
                        value={selectedState}
                        onChange={(e) => handleStateChange(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
                    >
                        {locationOptions.map((option) => (
                            <option key={option.state} value={option.state}>
                                {option.state}
                            </option>
                        ))}
                    </select>
                    <select
                        value={defaultLocation}
                        onChange={(e) => setDefaultLocation(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
                    >
                        <option value="">Select Default City</option>
                        {getCitiesForState(selectedState).map((city) => (
                            <option key={city} value={city}>
                                {city}
                            </option>
                        ))}
                    </select>

                    <button
                        type="submit"
                        className="w-full rounded-full border border-slate-950 px-4 py-2 text-sm font-bold text-slate-950
                                   transition duration-200 ease-in-out
                                    hover:bg-slate-800 hover:scale-105 hover:text-white"
                    >
                        Confirm
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
