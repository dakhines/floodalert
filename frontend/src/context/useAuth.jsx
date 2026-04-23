// Small hook so components can access auth state easily.
import { useContext } from "react";
import { AuthContext } from "./AuthContext.1";

export function useAuth() {
    return useContext(AuthContext);
}
