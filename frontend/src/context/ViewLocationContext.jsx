import { useState } from "react";
import { ViewLocationContext } from "./ViewLocationContextValue";

export function ViewLocationProvider({ children }) {
    const [currentViewedLocation, setCurrentViewedLocation] = useState(null);
    const [selectedState, setSelectedState] = useState("");

    const updateViewingLocation = (location) => {
        if (typeof location === "string") {
            setCurrentViewedLocation({ location, state: "" });
            return;
        }

        setCurrentViewedLocation({
            city: location?.city || location?.location || "",
            location: location?.location || location?.city || "",
            state: location?.state || "",
        });
    };

    const value = {
        currentViewedLocation,
        viewingLocation: currentViewedLocation?.location || "",
        setViewingLocation: updateViewingLocation,
        selectedState,
        setSelectedState,
    };

    return (
        <ViewLocationContext.Provider value={value}>
            {children}
        </ViewLocationContext.Provider>
    );
}
