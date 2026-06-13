import { InputHTMLAttributes } from "react";

interface AuthFormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export default function AuthFormField({
  label,
  error,
  ...inputProps
}: AuthFormFieldProps) {
  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex justify-between items-center">
        <label
          className="text-[#54647a] text-[10px] tracking-[1px] uppercase font-normal"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          {label}
        </label>
      </div>
      {error && (
        <span className="text-red-500 text-[11px] font-semibold flex items-center gap-1 animate-in fade-in slide-in-from-top-1 duration-150">
          ⚠️ {error}
        </span>
      )}
      <input
        {...inputProps}
        className={`
          w-full bg-white border rounded-[4px]
          px-[17px] py-[15px] text-[16px] text-[#191c1e] font-normal
          placeholder:text-[#6b7280]
          focus:outline-none transition-colors
          ${error ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500" : "border-[rgba(194,198,214,0.5)] focus:border-[#0058be] focus:ring-1 focus:ring-[#0058be]"}
        `}
        style={{ fontFamily: "Inter, sans-serif" }}
      />
    </div>
  );
}
