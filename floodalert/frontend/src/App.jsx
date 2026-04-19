import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./context/useAuth";
import { ViewLocationProvider } from "./context/ViewLocationContext";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import SignUp from "./pages/Signup";
import Home from "./pages/Home";
import AllLocations from "./pages/AllLocations";
import LatestUpdates from "./pages/LatestUpdates";
import ForgotPassword from "./pages/ForgotPassword";
import VerifyCode from "./pages/VerifyCode";
import VerifySignupCode from "./pages/VerifySignupCode";
import ResetPassword from "./pages/ResetPassword";
import Settings from "./pages/Settings";
import EditProfile from "./pages/EditProfile";
import HowToUse from "./pages/HowToUse";
import ReportProblem from "./pages/ReportProblem";
import ChangeUsername from "./pages/ChangeUsername";
import ChangeEmail from "./pages/ChangeEmail";
import VerifyPasswordCode from "./pages/VerifyPasswordCode";
import ChangePassword from "./pages/ChangePassword";

function ProtectedRoute({ children }) {
    const { user } = useAuth();

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return children;
}

export default function App() {
    return (
        <AuthProvider>
            <AppRoutes />
        </AuthProvider>
    );
}

function AppRoutes() {
    const { user } = useAuth();
    const viewLocationScope = user?.email || user?.name || "signed-out";

    return (
        <ViewLocationProvider key={viewLocationScope}>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<SignUp />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/verify-code" element={<VerifyCode />} />
                    <Route path="/verify-signup-code" element={<VerifySignupCode />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route
                        path="/home"
                        element={
                            <ProtectedRoute>
                                <Home />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/locations"
                        element={
                            <ProtectedRoute>
                                <AllLocations />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/updates"
                        element={
                            <ProtectedRoute>
                                <LatestUpdates />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/settings"
                        element={
                            <ProtectedRoute>
                                <Settings />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/settings/edit"
                        element={
                            <ProtectedRoute>
                                <EditProfile />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/how-to-use"
                        element={
                            <ProtectedRoute>
                                <HowToUse />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/report"
                        element={
                            <ProtectedRoute>
                                <ReportProblem />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/change-username"
                        element={
                            <ProtectedRoute>
                                <ChangeUsername />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/change-email"
                        element={
                            <ProtectedRoute>
                                <ChangeEmail />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/verify-password-code"
                        element={
                            <ProtectedRoute>
                                <VerifyPasswordCode />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/change-password"
                        element={
                            <ProtectedRoute>
                                <ChangePassword />
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </BrowserRouter>
        </ViewLocationProvider>
    );
}
