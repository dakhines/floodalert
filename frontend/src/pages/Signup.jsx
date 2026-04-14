import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import AppShell from "../components/AppShell";
import PasswordField from "../components/PasswordField";
import logo from "../img/logo.png";
import { fetchLocations } from "../api/floodApi";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z0-9]+$/;

export default function SignUp() {
    const navigate = useNavigate();
    const { signup, user } = useAuth(); 

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [defaultLocation, setDefaultLocation] = useState("");
    const [locations, setLocations] = useState([]);
    const [locationsLoading, setLocationsLoading] = useState(true);
    const [locationsError, setLocationsError] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        const controller = new AbortController();

        async function loadLocations() {
            try {
                setLocationsLoading(true);
                setLocationsError("");
                const data = await fetchLocations(controller.signal);
                setLocations(data);
            } catch (err) {
                if (err.name !== "AbortError") {
                    setLocations([]);
                    setLocationsError("Unable to load locations.");
                }
            } finally {
                setLocationsLoading(false);
            }
        }

        loadLocations();

        return () => controller.abort();
    }, []);

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
                        value={defaultLocation}
                        onChange={(e) => setDefaultLocation(e.target.value)}
                        disabled={locationsLoading}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
                    >
                        <option value="">
                            {locationsLoading
                                ? "Loading locations..."
                                : "Select Default City"}
                        </option>
                        {locations.map((item) => (
                            <option key={item.location} value={item.location}>
                                {item.location}
                            </option>
                        ))}
                    </select>
                    {locationsError && (
                        <p className="text-xs text-red-500">{locationsError}</p>
                    )}

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
