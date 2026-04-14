import { useState } from "react";
import { useAuth } from "./useAuth";
import { ViewLocationContext } from "./ViewLocationContextValue";

const STORAGE_KEY = "flood-viewing-location";

export function ViewLocationProvider({ children }) {
    const { user } = useAuth();
    const [sessionSelection, setSessionSelection] = useState(() => {
        const saved = sessionStorage.getItem(STORAGE_KEY);

        if (!saved) {
            return null;
        }

        try {
            return JSON.parse(saved);
        } catch {
            return null;
        }
    });

    const hasSessionLocation = sessionSelection?.owner === user?.name;

    const viewingLocation = hasSessionLocation
        ? sessionSelection.location
        : user?.defaultLocation || "";

    const updateViewingLocation = (location) => {
        const nextSelection = {
            owner: user?.name || "guest",
            location,
        };

        setSessionSelection(nextSelection);
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(nextSelection));
    };

    const value = {
        viewingLocation,
        setViewingLocation: updateViewingLocation,
    };

    return (
        <ViewLocationContext.Provider value={value}>
            {children}
        </ViewLocationContext.Provider>
    );
}
