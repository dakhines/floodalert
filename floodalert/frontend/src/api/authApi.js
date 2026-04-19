const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

function unwrapResponse(payload) {
    if (payload && typeof payload === "object" && "data" in payload) {
        return payload.data;
    }

    return payload;
}

async function request(path, options = {}) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {}),
        },
        ...options,
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(payload.message || `Request failed: ${response.status}`);
    }

    return unwrapResponse(payload);
}

export function signupUser(user) {
    return request("/auth/signup", {
        method: "POST",
        body: JSON.stringify(user),
    });
}

export function verifySignupCode(payload) {
    return request("/auth/verify-signup", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export function loginUser(credentials) {
    return request("/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
    });
}

export function checkAccountEmail(email) {
    return request("/auth/check-email", {
        method: "POST",
        body: JSON.stringify({ email }),
    });
}

export function sendEmailCode(payload) {
    return request("/auth/send-code", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export function verifyEmailCode(payload) {
    return request("/auth/verify-code", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export function resetUserPassword(payload) {
    return request("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export function updateUserProfile(payload) {
    return request("/auth/profile", {
        method: "PATCH",
        body: JSON.stringify(payload),
    });
}

export function deleteUserAccount(email) {
    return request("/auth/profile", {
        method: "DELETE",
        body: JSON.stringify({ email }),
    });
}
