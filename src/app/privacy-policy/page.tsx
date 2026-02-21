import React from 'react';

export default function PrivacyPolicy() {
    return (
        <div className="max-w-4xl mx-auto px-6 py-24">
            <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>

            <div className="prose prose-invert prose-slate max-w-none">
                <p className="text-lg text-slate-300 mb-8 leading-relaxed">
                    Last updated: February 1, 2026. This Privacy Policy describes how your personal information is collected, used, and shared when you use Project Canvas (the "Service").
                </p>

                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-white mb-4">1. Information We Collect</h2>
                    <p className="text-slate-400 mb-4">
                        We collect information you provide directly to us when you create an account, create boards, cards, or otherwise communicate with us. This may include:
                    </p>
                    <ul className="list-disc pl-6 text-slate-400 space-y-2">
                        <li>Account Information: Name, email address, and authentication details.</li>
                        <li>Content Information: Boards, cards, drawings, and metadata you create within the Service.</li>
                        <li>Technical Information: IP address, browser type, device information, and usage data.</li>
                    </ul>
                </section>

                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-white mb-4">2. Local-First Data Storage</h2>
                    <p className="text-slate-400 mb-4">
                        Project Canvas is a local-first application. This means:
                    </p>
                    <ul className="list-disc pl-6 text-slate-400 space-y-2">
                        <li>Your data is primarily stored on your own device using browser-based storage (IndexedDB).</li>
                        <li>If you enable synchronization, your data is transmitted over an encrypted connection to our servers to allow access across multiple devices.</li>
                        <li>We do not sell or trade your project data to third parties.</li>
                    </ul>
                </section>

                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-white mb-4">3. How We Use Information</h2>
                    <p className="text-slate-400 mb-4">
                        We use the information we collect to:
                    </p>
                    <ul className="list-disc pl-6 text-slate-400 space-y-2">
                        <li>Provide, maintain, and improve the Service.</li>
                        <li>Sync your data across your devices.</li>
                        <li>Provide customer support.</li>
                        <li>Analyse usage patterns to improve user experience.</li>
                    </ul>
                </section>

                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-white mb-4">4. GDPR Compliance</h2>
                    <p className="text-slate-400 mb-4">
                        For users in the European Economic Area (EEA), we act as a data controller. You have the right to request access to your personal data, as well as the right to request that we rectify, erase, or restrict the processing of your data.
                    </p>
                </section>

                <section className="mb-12 border-t border-white/5 pt-12">
                    <p className="text-sm text-slate-500">
                        If you have any questions about this Privacy Policy, please contact us at <a href="mailto:privacy@willpowered.design" className="text-accent-3 hover:underline">privacy@willpowered.design</a>.
                    </p>
                </section>
            </div>
        </div>
    );
}
