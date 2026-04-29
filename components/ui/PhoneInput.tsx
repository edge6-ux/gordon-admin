"use client";

import { formatPhoneInput } from "@/lib/utils";

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> & {
  value: string;
  onChange: (value: string) => void;
};

export default function PhoneInput({ value, onChange, ...props }: Props) {
  return (
    <input
      {...props}
      type="tel"
      value={value}
      onChange={(e) => onChange(formatPhoneInput(e.target.value))}
    />
  );
}
