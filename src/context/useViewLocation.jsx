import { useContext } from "react";
import { ViewLocationContext } from "./ViewLocationContextValue";

export function useViewLocation() {
    return useContext(ViewLocationContext);
}
