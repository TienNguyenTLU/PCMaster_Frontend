import { InputHTMLAttributes } from 'react';

interface AuthFormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export default function AuthFormField({ label, ...inputProps }: AuthFormFieldProps) {
  return (
    <div className="flex flex-col gap-2 w-full">
      <label
        className="text-[#54647a] text-[10px] tracking-[1px] uppercase font-normal"
        style={{ fontFamily: 'Inter, sans-serif' }}
      >
        {label}
      </label>
      <input
        {...inputProps}
        className="
          w-full bg-white border border-[rgba(194,198,214,0.5)] rounded-[4px]
          px-[17px] py-[15px] text-[16px] text-[#191c1e] font-normal
          placeholder:text-[#6b7280]
          focus:outline-none focus:border-[#0058be] focus:ring-1 focus:ring-[#0058be]
          transition-colors
        "
        style={{ fontFamily: 'Inter, sans-serif' }}
      />
    </div>
  );
}
