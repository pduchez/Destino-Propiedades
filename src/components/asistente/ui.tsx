"use client";

import React from "react";

// ---------------------------------------------------------------------------
//  Primitivas de UI — botones grandes, dropdowns cerrados, campos legibles.
//  Diseño sobrio: azul marino / dorado / grises. Mobile-first (380px).
// ---------------------------------------------------------------------------

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "gold";
}) {
  const base =
    "w-full rounded-xl px-5 py-4 text-base font-semibold transition active:scale-[.99] disabled:opacity-40 disabled:pointer-events-none";
  const variants: Record<string, string> = {
    primary: "bg-marino-700 text-white shadow-card hover:bg-marino-600",
    gold: "bg-dorado-500 text-marino-900 shadow-card hover:bg-dorado-400",
    secondary:
      "bg-white text-marino-700 border border-marino-100 hover:bg-marino-50",
    ghost: "bg-transparent text-marino-600 hover:bg-marino-50",
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1.5 block text-sm font-semibold text-marino-700">
      {children}
    </label>
  );
}

/** Dropdown CERRADO. El vendedor solo elige valores autorizados. */
export function Select({
  value,
  onChange,
  children,
  placeholder,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-xl border border-marino-100 bg-white px-4 py-4 pr-11 text-marino-800 shadow-sm outline-none focus:border-marino-600 focus:ring-2 focus:ring-marino-600/20 disabled:bg-marino-50 disabled:text-gray-400"
      >
        {placeholder !== undefined && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {children}
      </select>
      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-marino-600">
        ▾
      </span>
    </div>
  );
}

export function TextField({
  value,
  onChange,
  placeholder,
  inputMode,
  type = "text",
  maxLength,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  inputMode?: "text" | "numeric" | "decimal";
  type?: string;
  maxLength?: number;
}) {
  return (
    <input
      type={type}
      value={value}
      inputMode={inputMode}
      maxLength={maxLength}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-marino-100 bg-white px-4 py-4 text-marino-800 shadow-sm outline-none focus:border-marino-600 focus:ring-2 focus:ring-marino-600/20"
    />
  );
}

export function TextArea({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      rows={rows}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full resize-none rounded-xl border border-marino-100 bg-white px-4 py-3 text-marino-800 shadow-sm outline-none focus:border-marino-600 focus:ring-2 focus:ring-marino-600/20"
    />
  );
}

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl bg-white p-4 shadow-card ${className}`}
    >
      {children}
    </div>
  );
}

/** Fila de resultado destacado (etiqueta + valor grande). */
export function ResultRow({
  label,
  value,
  big,
  gold,
}: {
  label: string;
  value: string;
  big?: boolean;
  gold?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-3 border-b border-marino-50 py-2.5 last:border-0 ${
        gold ? "rounded-xl bg-dorado-50 px-3" : ""
      }`}
    >
      <span className="text-sm text-marino-600">{label}</span>
      <span
        className={`text-right font-semibold ${
          big ? "text-2xl" : "text-base"
        } ${gold ? "text-dorado-600" : "text-marino-800"}`}
      >
        {value}
      </span>
    </div>
  );
}

export function Banner({
  tone = "info",
  children,
}: {
  tone?: "info" | "warn" | "danger" | "ok";
  children: React.ReactNode;
}) {
  const tones: Record<string, string> = {
    info: "bg-marino-50 text-marino-700 border-marino-100",
    warn: "bg-amber-50 text-amber-800 border-amber-200",
    danger: "bg-red-50 text-red-700 border-red-200",
    ok: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
  return (
    <div className={`rounded-xl border px-3.5 py-3 text-sm ${tones[tone]}`}>
      {children}
    </div>
  );
}
