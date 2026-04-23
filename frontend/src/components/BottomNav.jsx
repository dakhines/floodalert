// Bottom navigation bar (fixed at the bottom like a mobile app).
import { NavLink } from "react-router-dom";
import { Bell, Home, MapPin, User } from "lucide-react";

const items = [
    { to: "/home", label: "Home", Icon: Home },
    { to: "/locations", label: "Locations", Icon: MapPin },
    { to: "/updates", label: "Updates", Icon: Bell },
    { to: "/settings", label: "Profile", Icon: User },
];

export default function BottomNav() {
    return (
        <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-[430px] border-t border-slate-200 bg-white/95 px-4 py-2 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="grid grid-cols-4 gap-1">
                {items.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                            `flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-semibold transition ${isActive
                                ? "bg-sky-100 text-sky-700"
                                : "text-slate-500 hover:bg-slate-100"
                            }`
                        }
                    >
                        <item.Icon size={24} strokeWidth={2.2} />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </div>
        </nav>
    );
}
