import Link from 'next/link';
import { Mail, Phone, MapPin, ExternalLink } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="relative z-10 pt-16 pb-8 px-4 bg-gradient-to-t from-black to-transparent border-t border-white/5">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                <div className="md:col-span-2">
                    <Link href="/" className="text-2xl font-bold highlighted mb-6 block">
                        Project Canvas
                    </Link>
                    <p className="text-normal max-w-md">
                        The next generation of visual project management. Mind-mapping meets structured tracking for the modern professional.
                    </p>
                </div>

                <div>
                    <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Get in Touch</h4>
                    <ul className="space-y-4">
                        <li>
                            <a href="mailto:will@willpowered.design" className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors group">
                                <div className="icon-box group-hover:bg-accent-3/10 group-hover:border-accent-3/20 transition-all">
                                    <Mail size={16} />
                                </div>
                                <span>will@willpowered.design</span>
                            </a>
                        </li>
                        <li>
                            <a href="tel:+447496660143" className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors group">
                                <div className="icon-box group-hover:bg-accent-1/10 group-hover:border-accent-1/20 transition-all">
                                    <Phone size={16} />
                                </div>
                                <span>+44 7496 660143</span>
                            </a>
                        </li>
                        <li>
                            <a href="https://maps.google.com" target="_blank" className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors group">
                                <div className="icon-box group-hover:bg-accent-2/10 group-hover:border-accent-2/20 transition-all">
                                    <MapPin size={16} />
                                </div>
                                <span>Kent, United Kingdom</span>
                            </a>
                        </li>
                    </ul>
                </div>

                <div>
                    <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Navigation</h4>
                    <ul className="space-y-3">
                        <li><Link href="/privacy-policy" className="text-slate-400 hover:text-white transition-colors">Privacy Policy</Link></li>
                        <li><Link href="/faq" className="text-slate-400 hover:text-white transition-colors">FAQs</Link></li>
                    </ul>
                </div>
            </div>

            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center pt-8 border-t border-white/5 gap-4">
                <p className="text-sm text-slate-500">
                    © {new Date().getFullYear()} Project Canvas. All rights reserved.
                </p>
                <a
                    href="https://willpowered.design/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-all group"
                >
                    <span className="text-sm group-hover:text-accent-1 transition-colors">⚡ Willpowered!</span>
                    <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-all" />
                </a>
            </div>
        </footer>
    );
}
