'use client';

import { usePathname } from 'next/navigation';
import { cn } from "@/lib/utils";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import WhatsAppButton from "@/components/ui/WhatsAppButton";
import ScrollToTop from "@/components/ui/ScrollToTop";
import CommandPalette from "@/components/global/CommandPalette";
import SmoothScroll from "@/components/layout/SmoothScroll";
import SyncProvider from "@/components/providers/SyncProvider";

export default function LayoutClient({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isBoardPage = pathname?.includes('/board/');

    return (
        <SyncProvider>
            <SmoothScroll>
                <div className="relative min-h-screen flex flex-col">
                    {!isBoardPage && <Navigation />}
                    <main className={cn("flex-grow", !isBoardPage && "pt-24")}>
                        {children}
                    </main>
                    {!isBoardPage && <Footer />}
                    {!isBoardPage && <WhatsAppButton />}
                    {!isBoardPage && <ScrollToTop />}
                    <CommandPalette />
                </div>
            </SmoothScroll>
        </SyncProvider>
    );
}
