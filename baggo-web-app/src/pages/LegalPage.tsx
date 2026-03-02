import React from 'react';
import { Shield, Scale } from 'lucide-react';

interface LegalPageProps {
    title: string;
    lastUpdated: string;
    sections: {
        title: string;
        content: string | string[];
    }[];
}

const LegalPage: React.FC<LegalPageProps> = ({ title, lastUpdated, sections }) => {
    return (
        <div className="pt-32 pb-40">
            <header className="px-6 mb-24">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
                            <Scale size={24} />
                        </div>
                        <span className="text-slate-400 font-bold uppercase tracking-widest text-xs">Legal Department</span>
                    </div>
                    <h1 className="text-5xl md:text-8xl mb-6">{title.toLowerCase()}</h1>
                    <p className="text-slate-500 font-bold italic">Last updated: {lastUpdated}</p>
                </div>
            </header>

            <section className="px-6">
                <div className="max-w-4xl mx-auto grid lg:grid-cols-[1fr_2fr] gap-20">
                    <aside className="hidden lg:block">
                        <div className="sticky top-40 bg-slate-50 rounded-3xl p-8 border-2 border-slate-100">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-8">Table of Contents</h4>
                            <nav className="flex flex-col gap-4 font-bold text-slate-900 text-sm">
                                {sections.map((section, i) => (
                                    <a key={i} href={`#section-${i}`} className="hover:text-brand-primary transition-colors">
                                        {i + 1}. {section.title}
                                    </a>
                                ))}
                            </nav>
                        </div>
                    </aside>

                    <div className="flex flex-col gap-20">
                        {sections.map((section, i) => (
                            <div key={i} id={`section-${i}`} className="scroll-mt-40">
                                <h2 className="text-3xl font-black mb-8 text-slate-900 flex items-center gap-4">
                                    <span className="text-brand-primary/20">{i + 1}.</span>
                                    {section.title}
                                </h2>
                                <div className="space-y-6 text-lg text-slate-600 font-bold leading-relaxed">
                                    {Array.isArray(section.content) ? (
                                        <ul className="list-disc pl-6 space-y-4">
                                            {section.content.map((item, j) => (
                                                <li key={j}>{item}</li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p>{section.content}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="px-6 mt-40">
                <div className="max-w-4xl mx-auto bg-slate-900 rounded-[3rem] p-12 text-center">
                    <div className="w-20 h-20 bg-white/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
                        <Shield className="text-brand-primary" size={40} />
                    </div>
                    <h3 className="text-2xl text-white mb-6">Need more clarification?</h3>
                    <p className="text-slate-400 font-bold mb-10">Our legal team is available to answer any questions regarding our terms or privacy practices.</p>
                    <a href="mailto:legal@bago.com" className="text-brand-primary font-black uppercase tracking-widest text-sm hover:underline">Contact Legal →</a>
                </div>
            </section>
        </div>
    );
};

export default LegalPage;
