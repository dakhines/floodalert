import { useState } from "react";
import { AuthContext } from "./AuthContext.1";

const USER_KEY = "user";
const USERS_KEY = "users";

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

    const defaultLocation = user.defaultLocation || user.location || "Ayer Keroh";

    return {
        name: user.name || user.username || "",
        email: user.email || "",
        password: user.password || "",
        defaultLocation,
        defaultState: user.defaultState || user.state || "",
        defaultDistrict: user.defaultDistrict || user.district || "",
        location: defaultLocation,
        profileImage: user.profileImage || "",
    };
}

function getStoredUsers() {
    const users = readJson(USERS_KEY, []).map(normalizeUser).filter(Boolean);
    const legacyUser = normalizeUser(readJson(USER_KEY, null));

    if (
        legacyUser &&
        !users.some((item) => item.name === legacyUser.name)
    ) {
        return [...users, legacyUser];
    }

    return users;
}

function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function saveCurrentUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function isValidPassword(password) {
    return (
        /^[A-Za-z0-9]+$/.test(password) &&
        /[A-Z]/.test(password) &&
        /[a-z]/.test(password) &&
        /\d/.test(password)
    );
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(normalizeUser(readJson(USER_KEY, null)));

    const signup = (newUser) => {
        const nextUser = normalizeUser(newUser);
        const users = getStoredUsers();

        if (
            users.some(
                (item) =>
                    item.name.toLowerCase() === nextUser.name.toLowerCase()
            )
        ) {
            throw new Error("Username is already taken.");
        }

        if (
            nextUser.email &&
            users.some(
                (item) =>
                    item.email &&
                    item.email.toLowerCase() === nextUser.email.toLowerCase()
            )
        ) {
            throw new Error("Email is already registered.");
        }

        if (!isValidPassword(nextUser.password)) {
            throw new Error(
                "Password must use uppercase, lowercase, and numbers only."
            );
        }

        const nextUsers = [...users, nextUser];
        saveUsers(nextUsers);
        saveCurrentUser(nextUser);
        setUser(nextUser);
    };

    const login = (form) => {
        const identifier = (form.identifier || form.name || form.email || "")
            .trim()
            .toLowerCase();
        const users = getStoredUsers();
        const savedUser = users.find(
            (item) =>
                item.name.toLowerCase() === identifier ||
                item.email.toLowerCase() === identifier
        );

        if (!savedUser) {
            throw new Error("No account found.");
        }

        if (form.password !== savedUser.password) {
            throw new Error("Invalid username or password.");
        }

        saveCurrentUser(savedUser);
        setUser(savedUser);
    };

    const logout = () => {
        localStorage.removeItem(USER_KEY);
        setUser(null);
    };

    const resetPassword = ({ email, password }) => {
        const users = getStoredUsers();
        const userIndex = users.findIndex(
            (item) => item.email.toLowerCase() === email.toLowerCase()
        );

        if (userIndex === -1) {
            throw new Error("No account found for that email.");
        }

        if (!isValidPassword(password)) {
            throw new Error(
                "Password must use uppercase, lowercase, and numbers only."
            );
        }

        const nextUsers = users.map((item, index) =>
            index === userIndex ? { ...item, password } : item
        );
        saveUsers(nextUsers);

        if (user?.email?.toLowerCase() === email.toLowerCase()) {
            const nextUser = { ...user, password };
            saveCurrentUser(nextUser);
            setUser(nextUser);
        }
    };

    const updateProfile = ({
        name,
        email,
        password,
        currentPassword,
        code,
        profileImage,
        defaultLocation,
        defaultState,
        defaultDistrict,
        removeProfileImage = false,
    }) => {
        if (!user) {
            throw new Error("Please log in again.");
        }

        if (currentPassword !== undefined && currentPassword !== user.password) {
            throw new Error("Current password is incorrect.");
        }

        if (code && code !== "1234") {
            throw new Error("Verification code is incorrect.");
        }

        if (password && !isValidPassword(password)) {
            throw new Error(
                "Password must use uppercase, lowercase, and numbers only."
            );
        }

        const users = getStoredUsers();
        const nextName = name?.trim() || user.name;
        const nextEmail = email?.trim() || user.email;
        const nextDefaultLocation = defaultLocation?.trim() || user.defaultLocation;
        const nextDefaultState = defaultState ?? user.defaultState;
        const nextDefaultDistrict = defaultDistrict ?? user.defaultDistrict;

        if (
            nextName.toLowerCase() !== user.name.toLowerCase() &&
            users.some(
                (item) => item.name.toLowerCase() === nextName.toLowerCase()
            )
        ) {
            throw new Error("Username is already taken.");
        }

        if (
            nextEmail &&
            nextEmail.toLowerCase() !== user.email.toLowerCase() &&
            users.some(
                (item) =>
                    item.email &&
                    item.email.toLowerCase() === nextEmail.toLowerCase()
            )
        ) {
            throw new Error("Email is already registered.");
        }

        const nextUser = {
            ...user,
            name: nextName,
            email: nextEmail,
            password: password || user.password,
            defaultLocation: nextDefaultLocation,
            defaultState: nextDefaultState,
            defaultDistrict: nextDefaultDistrict,
            location: nextDefaultLocation,
            profileImage: removeProfileImage
                ? ""
                : profileImage !== undefined
                  ? profileImage
                  : user.profileImage,
        };

        const nextUsers = users.map((item) =>
            item.name === user.name ? nextUser : item
        );
        saveUsers(nextUsers);
        saveCurrentUser(nextUser);
        setUser(nextUser);
    };

    const deleteAccount = () => {
        if (!user) {
            return;
        }

        const nextUsers = getStoredUsers().filter(
            (item) => item.name !== user.name
        );
        saveUsers(nextUsers);
        localStorage.removeItem(USER_KEY);
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                signup,
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
