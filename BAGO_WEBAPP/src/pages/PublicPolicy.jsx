import React from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import { businessContact, refundPolicy } from '../config/publicPolicies';

export default function PublicPolicy({ contact = false }) {
    return <div className="min-h-screen bg-[#F8F6F3] text-[#012126]">
        <nav className="flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4 md:px-12">
            <Link to="/" aria-label="Bago home"><img src="/bago_logo.png" alt="Bago" className="h-9" /></Link>
            <div className="flex gap-5 text-sm font-bold"><Link to="/contact">Contact</Link><Link to="/refund-policy">Refund policy</Link></div>
        </nav>
        <main className="mx-auto max-w-4xl px-6 py-14">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#5845D8]">{businessContact.name}</p>
            <h1 className="text-3xl font-black md:text-4xl">{contact ? 'Contact us' : refundPolicy.title}</h1>
            {contact ? <div className="mt-8 space-y-6 rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
                <p>For booking help, payment enquiries, refunds or disputes, contact BAGO PLATFORM using the details below. You do not need to sign in to email or call us.</p>
                <dl className="space-y-5">
                    <div><dt className="text-sm text-gray-500">Business / merchant name</dt><dd className="mt-1 font-bold">{businessContact.name}</dd></div>
                    <div><dt className="text-sm text-gray-500">Email</dt><dd className="mt-1"><a className="font-bold text-[#5845D8] underline" href={`mailto:${businessContact.email}`}>{businessContact.email}</a></dd></div>
                    <div><dt className="text-sm text-gray-500">Telephone</dt><dd className="mt-1 flex flex-col gap-2">{businessContact.phones.map(phone => <a key={phone.href} className="font-bold text-[#5845D8] underline" href={phone.href}>{phone.label}</a>)}</dd></div>
                    <div><dt className="text-sm text-gray-500">Website</dt><dd className="mt-1"><a className="text-[#5845D8] underline" href={businessContact.website}>{businessContact.website}</a></dd></div>
                </dl>
                <p className="text-sm text-gray-600">For a booking or payment enquiry, include your booking or tracking number and payment reference. Never send your full card details, passwords or one-time codes.</p>
                <Link to="/refund-policy" className="inline-block font-bold text-[#5845D8] underline">Read our Refund and Cancellation Policy</Link>
            </div> : <article className="mt-8 rounded-3xl border border-gray-100 bg-white p-8 shadow-sm md:p-12">
                <p className="text-xs text-gray-500">Last updated: {refundPolicy.updated}</p>
                <p className="mt-6 leading-7">{refundPolicy.introduction}</p>
                {refundPolicy.sections.map(section => <section key={section.title} className="mt-8">
                    <h2 className="text-lg font-bold">{section.title}</h2>
                    {section.paragraphs.map(paragraph => <p key={paragraph} className="mt-3 leading-7 text-gray-600">{paragraph}</p>)}
                </section>)}
                <p className="mt-8"><Link to="/contact" className="font-bold text-[#5845D8] underline">View contact details</Link></p>
            </article>}
        </main>
        <Footer />
    </div>;
}
