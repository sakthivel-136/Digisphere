"use client";

import { Factory } from "@/app/dashboard/qr-crud/page";
import { ChevronDown, Building2 } from "lucide-react"; // Professional icons

interface QrFiltersProps {
  value: string; 
  onChange: (factoryCode: string) => void;
  factories: Factory[];
}

export default function QrFilters({ value, onChange, factories }: QrFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full max-w-md">
      
      {/* Label with Icon */}
      <div className="flex items-center gap-2">
        <Building2 className="w-5 h-5 text-[var(--primary)]" />
        <label className="text-sm font-bold text-[var(--foreground-muted)] uppercase tracking-wider whitespace-nowrap">
          Factory
        </label>
      </div>

      {/* Custom Styled Select */}
      <div className="relative flex-1 group">
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 group-hover:text-blue-500 transition-colors duration-200">
          <ChevronDown className="w-4 h-4" />
        </div>
        
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input-modern"
        >
          <option value="" disabled className="text-slate-400">Select a factory location...</option>
          {factories.map((f) => (
            <option key={f.factory_code} value={f.factory_code}>
              {f.factory_name}
            </option>
          ))}
        </select>
      </div>

    </div>
  );
}