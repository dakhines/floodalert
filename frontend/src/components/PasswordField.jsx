// Password input with show/hide toggle.
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function PasswordField({
    value,
    onChange,
    placeholder = "Password",
    className = "",
    inputClassName = "",
    ...inputProps
}) {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div
            className={`flex h-12 rounded-xl border border-slate-300 bg-white focus-within:border-blue-600 ${className}`}
        >
            <input
                type={isVisible ? "text" : "password"}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                {...inputProps}
                className={`min-w-0 flex-1 rounded-l-xl px-4 py-3 text-sm outline-none ${inputClassName}`}
            />
            <button
                type="button"
                onClick={() => setIsVisible((value) => !value)}
                className="shrink-0 px-3 text-gray-500"
                aria-label={isVisible ? "Hide password" : "Show password"}
            >
                {isVisible ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
        </div>
    );
}
