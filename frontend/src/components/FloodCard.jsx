export default function FloodCard({ item }) {
    const statusBoxStyle =
    // colour for status at home
        item.status === "Flood Confirmed"
            ? "bg-red-500 border-red-900"
            : "bg-amber-500 border-amber-900";

    return (
        <section className="rounded-2xl border border-slate-300 bg-white p-4 shadow-sm">
            <div className="mt-2 flex items-start justify-between gap-3">
                <h2 className="text-xl font-bold text-slate-950">{item.location}</h2>
            </div>

            <div className={`mt-4 rounded-xl border p-4 text-center ${statusBoxStyle}`}>
                <p className="text-lg font-bold text-white">{item.status}</p>
                <p className="mt-1 text-sm font-bold text-white">{item.action}</p>
            </div>

            <div className="mt-4 rounded-xl bg-slate-100 p-4">
                <p className="text-sm leading-6 text-slate-700">{item.reason}</p>
            </div>
        </section>
    );
}