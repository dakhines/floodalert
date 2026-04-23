// Viewing location provider: lets users preview another area without changing their saved default.
import { useState } from "react";
import { ViewLocationContext } from "./ViewLocationContextValue";

export function ViewLocationProvider({ children }) {
    const [currentViewedLocation, setCurrentViewedLocation] = useState(null);
    const [selectedState, setSelectedState] = useState("");
    const [selectedDistrict, setSelectedDistrict] = useState("");

    const clearViewingLocation = () => {
        setCurrentViewedLocation(null);
        setSelectedState("");
        setSelectedDistrict("");
    };

    const updateViewingLocation = (location) => {
        if (typeof location === "string") {
            setCurrentViewedLocation({ location, state: "" });
            return;
        }

        setCurrentViewedLocation({
            city: location?.city || location?.location || "",
            location: location?.location || location?.city || "",
            state: location?.state || "",
            district: location?.district || "",
        });
    };

    const value = {
        currentViewedLocation,
        viewingLocation: currentViewedLocation?.location || "",
        clearViewingLocation,
        setViewingLocation: updateViewingLocation,
        selectedState,
        setSelectedState,
        selectedDistrict,
        setSelectedDistrict,
    };

    return (
        <ViewLocationContext.Provider value={value}>
            {children}
        </ViewLocationContext.Provider>
    );
}
