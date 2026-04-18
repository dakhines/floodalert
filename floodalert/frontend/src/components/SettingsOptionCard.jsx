import { Link } from "react-router-dom";

export default function SettingsOptionCard({ to, children }) {
    return (
        <Link
            to={to}
            className="block cursor-pointer rounded-2xl border border-slate-300 p-4 text-sm font-bold text-slate-950 hover:bg-gray-100"
        >
            {children}
        </Link>
    );
}
