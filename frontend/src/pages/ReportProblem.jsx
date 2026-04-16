import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";
import BottomNav from "../components/BottomNav";

export default function ReportProblem() {
    const [problemType, setProblemType] = useState("");
    const [explanation, setExplanation] = useState("");
    const [sent, setSent] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [fileName, setFileName] = useState("");
    const [errors, setErrors] = useState({});
    const fileInputRef = useRef(null);

    const validate = () => {
        const nextErrors = {};

        if (!problemType) {
            nextErrors.problemType = "Please select a problem type.";
        }

        if (!explanation.trim()) {
            nextErrors.explanation = "Please enter an explanation.";
        }

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleFileChange = (event) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        setSelectedFile(file);
        setFileName(file.name);
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
        setFileName("");

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <AppShell className="pb-24">
            <Link to="/settings" className="text-sm font-bold text-slate-600">
                Back
            </Link>
            <h1 className="mt-3 text-2xl font-bold text-slate-950">Report</h1>

            {sent && (
                <p className="mt-4 rounded-2xl bg-sky-50 px-4 py-3 text-sm text-sky-700">
                    Report saved locally for this prototype.
                </p>
            )}

            <form
                onSubmit={(event) => {
                    event.preventDefault();

                    if (!validate()) {
                        setSent(false);
                        return;
                    }

                    // TODO: Submit report payload and image to backend API.
                    setSent(true);
                }}
                className="mt-5 space-y-3"
            >
                <select
                    value={problemType}
                    onChange={(event) => {
                        setProblemType(event.target.value);
                        setErrors((currentErrors) => ({
                            ...currentErrors,
                            problemType: "",
                        }));
                    }}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-sky-500"
                >
                    <option value="">Select the problem</option>
                    <option value="wrong-status">Wrong flood status</option>
                    <option value="login">Login issue</option>
                    <option value="updates">Missing update</option>
                    <option value="other">Other</option>
                </select>
                {problemType === "other" && (
                    <input
                        placeholder="Other"
                        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-sky-500"
                    />
                )}
                {errors.problemType && (
                    <p className="text-sm text-red-500">{errors.problemType}</p>
                )}
                <textarea
                    placeholder="Explanation"
                    rows={5}
                    value={explanation}
                    onChange={(event) => {
                        setExplanation(event.target.value);
                        setErrors((currentErrors) => ({
                            ...currentErrors,
                            explanation: "",
                        }));
                    }}
                    className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-sky-500"
                />
                {errors.explanation && (
                    <p className="text-sm text-red-500">{errors.explanation}</p>
                )}
                <div className="mt-3">
                    <div className="flex items-start gap-4">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="h-10 w-32 shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
                        >
                            Choose File
                        </button>
                        <div className="flex min-w-0 flex-1 items-start gap-2">
                            <span className="max-h-10 min-w-0 overflow-y-auto break-words text-xs text-slate-500">
                                {fileName || "No file chosen"}
                            </span>
                            {selectedFile && (
                                <button
                                    type="button"
                                    onClick={handleRemoveFile}
                                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700"
                                    aria-label="Remove selected image"
                                >
                                    X
                                </button>
                            )}
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                    </div>
                </div>
                <button
                    type="submit"
                    className="rounded-full border border-slate-950 px-5 py-2 text-sm font-bold text-slate-950"
                >
                    Submit
                </button>
            </form>

            <BottomNav />
        </AppShell>
    );
}
