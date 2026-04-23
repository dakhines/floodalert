// Simple "Are you sure?" pop up modal.
export default function ConfirmModal({
    title,
    message,
    confirmLabel = "Yes",
    cancelLabel = "No",
    onConfirm,
    onCancel,
}) {
    return (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/55 px-6">
            <div className="w-full max-w-xs rounded-3xl bg-white p-6 text-center shadow-2xl">
                <h2 className="text-lg font-bold text-slate-950">{title}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">{message}</p>
                <div className="mt-6 grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={onConfirm}
                        className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-900"
                    >
                        {confirmLabel}
                    </button>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
                    >
                        {cancelLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
