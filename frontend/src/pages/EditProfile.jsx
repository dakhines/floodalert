// Edit Profile page (default location/state/district).
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useMemo, useState } from "react";
import AppShell from "../components/AppShell";
import BottomNav from "../components/BottomNav";
import ProfileImageUploader from "../components/ProfileImageUploader";
import SettingsOptionCard from "../components/SettingsOptionCard";
import { useAuth } from "../context/useAuth";
import { useViewLocation } from "../context/useViewLocation";
import { MALAYSIA_LOCATION_DATA } from "../data/locations";

export default function EditProfile() {
    const { user, updateProfile } = useAuth();
    const { clearViewingLocation } = useViewLocation();
    const navigate = useNavigate();
    const [defaultState, setDefaultState] = useState(user?.defaultState || "");
    const [defaultDistrict, setDefaultDistrict] = useState(
        user?.defaultDistrict || ""
    );
    const [defaultLocation, setDefaultLocation] = useState(
        user?.defaultLocation || ""
    );
    const [locationMessage, setLocationMessage] = useState("");
    const [isSavingLocation, setIsSavingLocation] = useState(false);

    const states = useMemo(() => Object.keys(MALAYSIA_LOCATION_DATA), []);
    const districts = defaultState
        ? Object.keys(MALAYSIA_LOCATION_DATA[defaultState] || {})
        : [];
    const cities =
        defaultState && defaultDistrict
            ? MALAYSIA_LOCATION_DATA[defaultState]?.[defaultDistrict] || []
            : [];

    const handleSavePhoto = async ({ profileImage, removeProfileImage }) => {
        await updateProfile({
            name: user?.name,
            email: user?.email,
            profileImage,
            removeProfileImage,
        });
    };

    const handleSaveLocation = async () => {
        if (!defaultLocation) {
            setLocationMessage("Please select a city or area.");
            return;
        }

        try {
            setIsSavingLocation(true);
            await updateProfile({
                name: user?.name,
                email: user?.email,
                state: defaultState,
                defaultLocation,
                defaultState,
                defaultDistrict,
            });
            clearViewingLocation();
            setLocationMessage("Default location updated.");
        } catch (error) {
            setLocationMessage(error.message || "Unable to update location.");
        } finally {
            setIsSavingLocation(false);
        }
    };

    const handleBack = () => {
        navigate("/settings");
    };

    return (
        <AppShell className="pb-24">
            <button
                type="button"
                onClick={handleBack}
                className="mt-2 inline-flex items-center gap-2 rounded-full px-1 py-2 text-sm font-bold text-slate-600 transition hover:text-sky-600"
            >
                <ArrowLeft size={18} />
                Back
            </button>

            <h1 className="mt-1 text-2xl font-bold text-slate-950">
                Edit Profile
            </h1>

            <ProfileImageUploader
                savedProfileImage={user?.profileImage}
                onSave={handleSavePhoto}
            />

            <div className="mt-5 space-y-3">
                <SettingsOptionCard to="/change-username">
                    Change Username
                </SettingsOptionCard>
                <SettingsOptionCard to="/change-email">
                    Change Email
                </SettingsOptionCard>
                <SettingsOptionCard to="/verify-password-code">
                    Change Password
                </SettingsOptionCard>
            </div>

            <section className="mt-5 rounded-2xl border border-slate-300 bg-white p-4 shadow-sm">
                <h2 className="text-sm font-bold text-slate-950">
                    Change Default Location
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                    Choose the area you want FloodAlert to show first.
                </p>

                <div className="mt-4 space-y-3">
                    <select
                        value={defaultState}
                        onChange={(event) => {
                            setDefaultState(event.target.value);
                            setDefaultDistrict("");
                            setDefaultLocation("");
                            setLocationMessage("");
                        }}
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 hover:border-sky-300"
                    >
                        <option value="">Select State</option>
                        {states.map((state) => (
                            <option key={state} value={state}>
                                {state}
                            </option>
                        ))}
                    </select>

                    <select
                        value={defaultDistrict}
                        onChange={(event) => {
                            setDefaultDistrict(event.target.value);
                            setDefaultLocation("");
                            setLocationMessage("");
                        }}
                        disabled={!defaultState}
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 disabled:bg-slate-100 disabled:text-slate-400 hover:border-sky-300"
                    >
                        <option value="">Select District</option>
                        {districts.map((district) => (
                            <option key={district} value={district}>
                                {district}
                            </option>
                        ))}
                    </select>

                    <select
                        value={defaultLocation}
                        onChange={(event) => {
                            setDefaultLocation(event.target.value);
                            setLocationMessage("");
                        }}
                        disabled={!defaultDistrict}
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 disabled:bg-slate-100 disabled:text-slate-400 hover:border-sky-300"
                    >
                        <option value="">Select City/Area</option>
                        {cities.map((city) => (
                            <option key={city} value={city}>
                                {city}
                            </option>
                        ))}
                    </select>

                    {locationMessage && (
                        <p className="text-xs font-semibold text-slate-500">
                            {locationMessage}
                        </p>
                    )}

                    <button
                        type="button"
                        onClick={handleSaveLocation}
                        disabled={isSavingLocation}
                        className="w-full rounded-full border border-slate-950 px-4 py-2 text-sm font-bold text-slate-950 transition duration-200 ease-in-out hover:scale-103 hover:bg-slate-800 hover:text-white"
                    >
                        {isSavingLocation ? "Saving..." : "Save Default Location"}
                    </button>
                </div>
            </section>

            <BottomNav />
        </AppShell>
    );
}
