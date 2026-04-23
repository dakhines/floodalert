// AppShell is the phone-like container (max width + padding + background).
export default function AppShell({ children, className = "" }) {
    return (
        <main className="min-h-screen bg-slate-200 text-slate-950">
            <div
                className={`page-transition mx-auto min-h-screen w-full max-w-[430px] bg-white px-5 py-6 shadow-2xl shadow-slate-400/40 ${className}`}
            >
                {children}
            </div>
        </main>
    );
}
