import { useRef } from "react";

export default function OTPInput({ value, onChange, length = 4 }) {
    const inputsRef = useRef([]);
    const digits = Array.from({ length }, (_, index) => value[index] || "");

    const setDigit = (index, nextValue) => {
        const sanitized = nextValue.replace(/\D/g, "");

        if (!sanitized) {
            const nextDigits = [...digits];
            nextDigits[index] = "";
            onChange(nextDigits.join("").trim());
            return;
        }

        if (sanitized.length > 1) {
            const nextDigits = sanitized.slice(0, length).split("");
            onChange(nextDigits.join(""));
            inputsRef.current[Math.min(nextDigits.length, length) - 1]?.focus();
            return;
        }

        const nextDigits = [...digits];
        nextDigits[index] = sanitized;
        onChange(nextDigits.join(""));

        if (index < length - 1) {
            inputsRef.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (event, index) => {
        if (event.key !== "Backspace" || digits[index]) {
            return;
        }

        if (index > 0) {
            inputsRef.current[index - 1]?.focus();
        }
    };

    const handlePaste = (event) => {
        event.preventDefault();
        const pastedCode = event.clipboardData
            .getData("text")
            .replace(/\D/g, "")
            .slice(0, length);

        if (!pastedCode) {
            return;
        }

        onChange(pastedCode);
        inputsRef.current[Math.min(pastedCode.length, length) - 1]?.focus();
    };

    return (
        <div className="mx-auto grid w-fit grid-cols-4 gap-2" onPaste={handlePaste}>
            {Array.from({ length }).map((_, index) => (
                <input
                    key={index}
                    ref={(element) => {
                        inputsRef.current[index] = element;
                    }}
                    aria-label={`Code digit ${index + 1}`}
                    inputMode="numeric"
                    maxLength={1}
                    value={digits[index] || ""}
                    onChange={(event) => setDigit(index, event.target.value)}
                    onKeyDown={(event) => handleKeyDown(event, index)}
                    className="h-11 w-11 rounded-xl border border-slate-300 text-center text-xl font-bold outline-none focus:border-blue-600"
                />
            ))}
        </div>
    );
}
