import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/useAuth";
import AppShell from "../components/AppShell";
import BottomNav from "../components/BottomNav";
import ConfirmModal from "../components/ConfirmModal";
import { User } from "lucide-react";

export default function Settings() {
    const navigate = useNavigate();
    const { user, logout, deleteAccount } = useAuth();
    const [modal, setModal] = useState(null);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const handleDelete = async () => {
        await deleteAccount();
        navigate("/");
    };

    return (
        <AppShell className="pb-24">
            <h1 className="text-2xl font-bold text-slate-950">Settings</h1>

            <section className="mt-5 rounded-xl border border-slate-300 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-slate-950 bg-slate-100 text-3xl font-bold">
                        {user?.profileImage ? (
                            <img
                                src={user.profileImage}
                                alt="Profile"
                                className="h-full w-full object-cover"
                            />
                        ) : user?.name ? (
                            user.name.slice(0, 1).toUpperCase()
                        ) : (
                            <User size={32} className="text-slate-400" />
                        )}
                    </div>
                    <div className="text-sm leading-6 text-slate-700">
                        <p className="font-bold text-slate-950">{user?.name}</p>
                        <p>{user?.email || "No email saved"}</p>
                        <p>{user?.defaultLocation}</p>
                    </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                    <Link
                        to="/settings/edit"
                        className="rounded-lg border border-slate-300 px-2 py-2 text-center text-[11px] font-bold text-slate-950 hover:scale-102"
                    >
                        Edit Profile
                    </Link>
                    <button
                        type="button"
                        onClick={() => setModal("logout")}
                        className="rounded-lg border border-slate-300 px-2 py-2 text-[11px] font-bold text-slate-950 hover:scale-102"
                    >
                        Log out
                    </button>
                    <button
                        type="button"
                        onClick={() => setModal("delete")}
                        className="rounded-lg border border-red-900/25 bg-red-500 px-2 py-2 text-[11px] font-bold text-white hover:scale-102"
                    >
                        Delete
                    </button>
                </div>
            </section>

            <div className="mt-4 space-y-3">
                <Link
                    to="/how-to-use"
                    className="flex items-center justify-between rounded-xl border border-slate-300 px-4 py-4 text-sm font-bold text-slate-950
                               hover:border-sky-300"
                >
                    How to use?
                    <span>&gt;</span>
                </Link>
                <Link
                    to="/report"
                    className="flex items-center justify-between rounded-xl border border-slate-300 px-4 py-4 text-sm font-bold text-slate-950
                                hover:border-sky-300"
                >
                    Report
                    <span>&gt;</span>
                </Link>
            </div>

            {modal === "logout" && (
                <ConfirmModal
                    title="Are you sure you want to Log out?"
                    onConfirm={handleLogout}
                    onCancel={() => setModal(null)}
                />
            )}
            {modal === "delete" && (
                <ConfirmModal
                    title="Are you sure you want to delete this account?"
                    onConfirm={handleDelete}
                    onCancel={() => setModal(null)}
                />
            )}

            <BottomNav />
        </AppShell>
    );
}
