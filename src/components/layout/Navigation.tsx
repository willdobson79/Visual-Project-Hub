'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Menu, X, Search, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import SyncIndicator from '@/components/global/SyncIndicator';

export default function Navigation() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav
            className={cn(
                "fixed top-0 left-0 right-0 z-[100] transition-all duration-300 px-6 py-4",
                isScrolled ? "bg-slate-950/80 backdrop-blur-md border-b border-white/10" : "bg-transparent"
            )}
        >
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <Link href="/" className="text-2xl font-bold highlighted tracking-tight">
                    Project Canvas
                </Link>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center gap-8">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-accent-1 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Quick search... (Cmd+K)"
                            className="glass-input pl-10 w-64 text-sm"
                        />
                    </div>

                    <SyncIndicator />

                    <button className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors">
                        <div className="icon-box">
                            <User size={18} />
                        </div>
                        <span className="font-medium">My Account</span>
                    </button>
                </div>

                {/* Mobile Toggle */}
                <button
                    className="md:hidden text-white"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    {isMobileMenuOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden bg-slate-900/95 backdrop-blur-xl border-b border-white/10 overflow-hidden"
                    >
                        <div className="px-6 py-8 flex flex-col gap-6">
                            <input
                                type="text"
                                placeholder="Search..."
                                className="glass-input w-full"
                            />
                            <button className="btn-primary w-full">Account</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}

import { AnimatePresence } from 'framer-motion';
