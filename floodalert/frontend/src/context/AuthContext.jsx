import { useState } from "react";
import {
    deleteUserAccount,
    loginUser,
    resetUserPassword,
    signupUser,
    updateUserProfile,
    verifySignupCode,
} from "../api/authApi";
import { AuthContext } from "./AuthContext.1";

const USER_KEY = "user";

function readJson(key, fallback) {
    try {
        return JSON.parse(localStorage.getItem(key)) || fallback;
    } catch {
        return fallback;
    }
}

function normalizeUser(user) {
    if (!user) {
        return null;
    }

    const defaultLocation = user.defaultLocation || user.location || "";
    const state = user.state || user.defaultState || "";

    return {
        id: user.id || user._id || "",
        name: user.name || user.username || "",
        email: user.email || "",
        defaultLocation,
        state,
        defaultState: state,
        defaultDistrict: user.defaultDistrict || user.district || "",
        location: defaultLocation,
        profileImage: user.profileImage || "",
    };
}

function saveCurrentUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(normalizeUser(readJson(USER_KEY, null)));

    const persistUser = (nextUser) => {
        const normalizedUser = normalizeUser(nextUser);
        saveCurrentUser(normalizedUser);
        setUser(normalizedUser);
        return normalizedUser;
    };

    const signup = async (newUser) => {
        return signupUser(newUser);
    };

    const verifySignup = async ({ email, code }) => {
        const savedUser = await verifySignupCode({ email, code });
        return persistUser(savedUser);
    };

    const login = async (form) => {
        const savedUser = await loginUser(form);
        return persistUser(savedUser);
    };

    const logout = () => {
        localStorage.removeItem(USER_KEY);
        setUser(null);
    };

    const resetPassword = async ({ email, password, verificationToken }) => {
        const updatedUser = await resetUserPassword({
            email,
            password,
            verificationToken,
        });

        if (user?.email?.toLowerCase() === email.toLowerCase()) {
            persistUser(updatedUser);
        }

        return updatedUser;
    };

    const updateProfile = async (updates) => {
        if (!user) {
            throw new Error("Please log in again.");
        }

        const updatedUser = await updateUserProfile({
            ...updates,
            currentEmail: user.email,
        });

        return persistUser(updatedUser);
    };

    const deleteAccount = async () => {
        if (!user?.email) {
            return;
        }

        await deleteUserAccount(user.email);
        localStorage.removeItem(USER_KEY);
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                signup,
                verifySignup,
                login,
                logout,
                resetPassword,
                updateProfile,
                deleteAccount,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}
