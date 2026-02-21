'use client';

import * as React from "react";
import { cn } from "@/lib/utils";

interface TabsContextValue {
    value: string;
    onValueChange: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | undefined>(undefined);

export function Tabs({ defaultValue, value, onValueChange, children, className }: {
    defaultValue?: string;
    value?: string;
    onValueChange?: (value: string) => void;
    children: React.ReactNode;
    className?: string;
}) {
    const [currentValue, setCurrentValue] = React.useState(defaultValue || "");

    const val = value !== undefined ? value : currentValue;
    const onChange = onValueChange || setCurrentValue;

    return (
        <TabsContext.Provider value={{ value: val, onValueChange: onChange }}>
            <div className={cn("w-full", className)}>{children}</div>
        </TabsContext.Provider>
    );
}

export function TabsList({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={cn("flex items-center gap-1 p-1 bg-slate-900/50 rounded-xl border border-white/5", className)}>
            {children}
        </div>
    );
}

export function TabsTrigger({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) {
    const context = React.useContext(TabsContext);
    if (!context) throw new Error("TabsTrigger must be used within Tabs");

    const isActive = context.value === value;

    return (
        <button
            onClick={() => context.onValueChange(value)}
            className={cn(
                "flex-1 flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all rounded-lg",
                isActive
                    ? "bg-slate-800 text-white shadow-lg border border-white/10"
                    : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                , className)}
        >
            {children}
        </button>
    );
}

export function TabsContent({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) {
    const context = React.useContext(TabsContext);
    if (!context) throw new Error("TabsContent must be used within Tabs");

    if (context.value !== value) return null;

    return (
        <div className={cn("mt-6 animate-fade-in", className)}>
            {children}
        </div>
    );
}
