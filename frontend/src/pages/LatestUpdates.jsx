// Updates page: shows latest updates and sources.
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/useAuth";
import { useViewLocation } from "../context/useViewLocation";
import AppShell from "../components/AppShell";
import BottomNav from "../components/BottomNav";
import { fetchLocationByName, getCachedLocationByName } from "../api/floodApi";
import { findLocationPath } from "../data/locations";

function buildSummary(item) {
    if (item.userSummary) {
        return item.userSummary;
    }

    if (item.latestUpdate) {
        const actionText = item.action
            ? ` Suggested action: ${item.action.toLowerCase()}.`
            : "";

        return `Based on current local data, ${item.location} is marked "${item.status || "Monitoring"}". ${item.latestUpdate.summary || "No recent official update."}${actionText}`;
    }

    return item.summary || item.message || "No update summary available.";
}

function UpdateSkeleton() {
    const [messageIndex, setMessageIndex] = useState(0);
    const messages = [
        "Loading latest update...",
        "Checking official alerts...",
        "Waiting for AI summary...",
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setMessageIndex((currentIndex) =>
                Math.min(currentIndex + 1, messages.length - 1)
            );
        }, 1800);

        return () => clearInterval(timer);
    }, [messages.length]);

    return (
        <article className="rounded-xl border border-slate-300 bg-white p-6 text-center shadow-sm">
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">
                {messages[messageIndex]}
            </p>
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-sky-500" />
        </article>
    );
}

function LoadingDots() {
    return (
        <span className="inline-flex w-6 justify-start">
            <span className="source-dot">.</span>
            <span className="source-dot delay-150">.</span>
            <span className="source-dot delay-300">.</span>
        </span>
    );
}

function SourceBox({ item, isLoading }) {
    const [showSourceLoading, setShowSourceLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowSourceLoading(false);
        }, 1200);

        return () => clearTimeout(timer);
    }, [item.location, item.lastUpdate, item.officialNotice?.source]);

    const shouldShowLoading = isLoading || showSourceLoading;

    if (item.officialNotice?.notice) {
        return (
            <section className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <h3 className="text-sm font-bold text-slate-950">
                    Source:{" "}
                    {shouldShowLoading ? (
                        <LoadingDots />
                    ) : (
                        item.officialNotice.source || "Official notice"
                    )}
                </h3>
            </section>
        );
    }

    return (
        <section className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <h3 className="text-sm font-bold text-slate-950">
                Source: <LoadingDots />
            </h3>
        </section>
    );
}

function hasSource(item) {
    return Boolean(item?.officialNotice?.source || item?.officialNotice?.notice);
}

export default function LatestUpdates() {
    const { user } = useAuth();
    const { currentViewedLocation, viewingLocation } = useViewLocation();
    const [updates, setUpdates] = useState([]);
    const updatesRef = useRef([]);
    const [updatesLoading, setUpdatesLoading] = useState(true);
    const [updatesError, setUpdatesError] = useState("");

    const currentLocation = viewingLocation || user?.defaultLocation;
    const currentState = currentViewedLocation?.state || user?.state;
    const currentDistrict =
        currentViewedLocation?.district ||
        user?.defaultDistrict ||
        findLocationPath(currentLocation)?.district ||
        "";

    useEffect(() => {
        updatesRef.current = updates;
    }, [updates]);

    useEffect(() => {
        const controller = new AbortController();

        async function loadUpdates() {
            try {
                if (!updatesRef.current.length) {
                    setUpdatesLoading(true);
                }
                setUpdatesError("");

                if (!currentLocation || !currentState) {
                    setUpdates([]);
                    setUpdatesError("Please update your default location.");
                    return;
                }

                const cachedLocation =
                    getCachedLocationByName(
                        currentLocation,
                        currentState,
                        currentDistrict,
                        true
                    ) ||
                    getCachedLocationByName(
                        currentLocation,
                        currentState,
                        currentDistrict,
                        false
                    );

                if (cachedLocation) {
                    setUpdates([cachedLocation]);
                }

                const data = await fetchLocationByName(
                    currentLocation,
                    currentState,
                    controller.signal,
                    currentDistrict,
                    { includeAi: true, force: true }
                );
                setUpdates(data ? [data] : []);

                if (data && !hasSource(data)) {
                    const retryTimer = setTimeout(async () => {
                        if (controller.signal.aborted) {
                            return;
                        }

                        try {
                            const refreshedData = await fetchLocationByName(
                                currentLocation,
                                currentState,
                                controller.signal,
                                currentDistrict,
                                { includeAi: true, force: true }
                            );
                            setUpdates(refreshedData ? [refreshedData] : []);
                        } catch {
                            // Keep the visible update and source loading state if enrichment is still unavailable.
                        }
                    }, 1800);

                    controller.signal.addEventListener(
                        "abort",
                        () => clearTimeout(retryTimer),
                        { once: true }
                    );
                }
            } catch (error) {
                if (error.name !== "AbortError") {
                    setUpdatesError(
                        updatesRef.current.length
                            ? "Could not refresh updates. Showing the last loaded update."
                            : "Unable to load updates."
                    );
                }
            } finally {
                setUpdatesLoading(false);
            }
        }

        loadUpdates();

        return () => controller.abort();
    }, [currentDistrict, currentLocation, currentState]);

    const visibleUpdates = Array.from(
        new Map(
            updates.map((item) => [
                `${item.location}-${item.lastUpdate}-${item.latestUpdate?.summary || item.summary || ""}`,
                {
                    ...item,
                    summaryText: buildSummary(item),
                },
            ])
        ).values()
    );

    return (
        <AppShell className="pb-24">
            <h1 className="mt-3 text-2xl font-bold text-slate-950">
                {currentLocation}
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
                Updates for the currently viewed location.
            </p>

            <section className="mt-5 space-y-3">
                {updatesLoading && updates.length === 0 && (
                    <>
                        <UpdateSkeleton />
                        <UpdateSkeleton />
                    </>
                )}

                {updatesError && (
                    <p className={`rounded-xl border p-4 text-sm ${
                        updates.length
                            ? "border-amber-200 bg-amber-50 text-amber-700"
                            : "border-red-200 bg-red-50 text-red-600"
                    }`}>
                        {updatesError}
                    </p>
                )}

                {!updatesLoading && !updatesError && visibleUpdates.length === 0 && (
                    <p className="rounded-xl border border-slate-300 bg-white p-4 text-sm text-slate-500">
                        No updates available.
                    </p>
                )}

                {visibleUpdates.map((item, index) => (
                    <article
                        key={item.id || `${item.location}-${item.lastUpdate}-${index}`}
                        className="soft-pop rounded-xl border border-slate-300 bg-white p-4 shadow-sm"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-xs font-bold text-slate-500">
                                    {item.latestUpdate?.type || item.type || "Update"}
                                </p>
                                <h2 className="mt-1 text-sm font-bold text-slate-950">
                                    {item.status || item.title || "Latest update"}
                                </h2>
                            </div>
                            <span className="shrink-0 whitespace-nowrap rounded-full border border-slate-300 bg-white px-3 py-1 text-[11px] font-bold text-slate-700">
                                {item.lastUpdate || item.timestamp || item.time}
                            </span>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-slate-700">
                            {item.summaryText}
                        </p>
                        <SourceBox
                            key={`${item.location}-${item.lastUpdate}-${item.officialNotice?.source || "source"}`}
                            item={item}
                            isLoading={updatesLoading}
                        />
                    </article>
                ))}
            </section>

            <BottomNav />
        </AppShell>
    );
}
