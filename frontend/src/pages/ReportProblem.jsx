// Report Problem page: user submits bug/issue report.
import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";
import BottomNav from "../components/BottomNav";
import { submitReport } from "../api/reportApi";
import { useAuth } from "../context/useAuth";

const problemOptions = [
    { value: "wrong-flood-status", label: "Wrong flood status" },
    { value: "missing-location", label: "Location not found" },
    { value: "outdated-update", label: "Missing or outdated update" },
    { value: "slow-loading", label: "App loading too slowly" },
    { value: "login-signup", label: "Login or sign up issue" },
    { value: "password-reset", label: "Password reset issue" },
    { value: "profile-settings", label: "Profile or settings issue" },
    { value: "location-selection", label: "Location selection issue" },
    { value: "display-layout", label: "Display or layout issue" },
    { value: "notification", label: "Updates or notification issue" },
    { value: "other", label: "Other" },
];

export default function ReportProblem() {
    const { user } = useAuth();
    const [problemType, setProblemType] = useState("");
    const [otherProblem, setOtherProblem] = useState("");
    const [explanation, setExplanation] = useState("");
    const [sent, setSent] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [fileName, setFileName] = useState("");
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef(null);

    const validate = () => {
        const nextErrors = {};

        if (!problemType) {
            nextErrors.problemType = "Please select a problem type.";
        }

        if (!explanation.trim()) {
            nextErrors.explanation = "Please enter an explanation.";
        }

        if (problemType === "other" && !otherProblem.trim()) {
            nextErrors.otherProblem = "Please describe the problem.";
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
            <Link to="/settings" className="text-sm font-bold text-slate-600 hover:text-blue-500">
                Back
            </Link>
            <h1 className="mt-3 text-2xl font-bold text-slate-950">Report</h1>

            {sent && (
                <p className="mt-4 rounded-2xl bg-sky-50 px-4 py-3 text-sm text-sky-700">
                    Report submitted. Thank you for helping improve FloodAlert.
                </p>
            )}

            <form
                onSubmit={async (event) => {
                    event.preventDefault();

                    if (!validate()) {
                        setSent(false);
                        return;
                    }

                    try {
                        setIsSubmitting(true);
                        await submitReport({
                            problemType,
                            otherProblem,
                            explanation,
                            imageName: selectedFile?.name || "",
                            reporterEmail: user?.email || "",
                            reporterName: user?.name || "",
                        });
                        setSent(true);
                        setProblemType("");
                        setOtherProblem("");
                        setExplanation("");
                        handleRemoveFile();
                    } catch (error) {
                        setSent(false);
                        setErrors({
                            submit:
                                error.message ||
                                "Unable to submit report.",
                        });
                    } finally {
                        setIsSubmitting(false);
                    }
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
                    {problemOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                {problemType === "other" && (
                    <input
                        placeholder="Other"
                        value={otherProblem}
                        onChange={(event) => {
                            setOtherProblem(event.target.value);
                            setErrors((currentErrors) => ({
                                ...currentErrors,
                                otherProblem: "",
                            }));
                        }}
                        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-sky-500"
                    />
                )}
                {errors.otherProblem && (
                    <p className="text-sm text-red-500">{errors.otherProblem}</p>
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
                {errors.submit && (
                    <p className="text-sm text-red-500">{errors.submit}</p>
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
                    disabled={isSubmitting}
                    className="rounded-full border border-slate-950 px-5 py-2 text-sm font-bold text-slate-950"
                >
                    {isSubmitting ? "Submitting..." : "Submit"}
                </button>
            </form>

            <BottomNav />
        </AppShell>
    );
}
