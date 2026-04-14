import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";
import BottomNav from "../components/BottomNav";
import ProfileImageUploader from "../components/ProfileImageUploader";
import SettingsOptionCard from "../components/SettingsOptionCard";
import { useAuth } from "../context/useAuth";

export default function EditProfile() {
    const { user, updateProfile } = useAuth();

    const handleSavePhoto = ({ profileImage, removeProfileImage }) => {
        updateProfile({
            name: user?.name,
            email: user?.email,
            profileImage,
            removeProfileImage,
        });
    };

    return (
        <AppShell className="pb-24">
            <Link to="/settings" className="text-sm font-bold text-slate-600">
                Back
            </Link>
            <h1 className="mt-3 text-2xl font-bold text-slate-950">
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

            <BottomNav />
        </AppShell>
    );
}
