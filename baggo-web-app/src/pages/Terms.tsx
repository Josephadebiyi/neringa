import React from 'react';
import LegalPage from './LegalPage';

const Terms: React.FC = () => {
    return (
        <LegalPage
            title="Terms of Service"
            lastUpdated="March 01, 2026"
            sections={[
                {
                    title: "Acceptance of Terms",
                    content: "By accessing or using the Bago platform, you agree to be bound by these Terms of Service. If you do not agree to all of these terms, do not use our services. These terms constitute a legally binding agreement between you and Bago Technologies Inc."
                },
                {
                    title: "User Eligibility",
                    content: [
                        "You must be at least 18 years old to create an account.",
                        "You must provide accurate and complete identification information.",
                        "You may not use Bago for any illegal or unauthorized purpose.",
                        "You are responsible for maintaining the confidentiality of your account credentials."
                    ]
                },
                {
                    title: "Shipping & Transit Rules",
                    content: "Bago does not handle the items physically. We connect Shippers and Travelers. Travelers are responsible for the items in their possession, and Shippers must ensure items comply with all international aviation and customs laws of both origin and destination countries."
                },
                {
                    title: "Prohibited Items",
                    content: [
                        "Explosives, firearms, or flammable materials",
                        "Illegal drugs or controlled substances",
                        "Counterfeit goods or pirated materials",
                        "Perishable items without proper stabilization",
                        "Any item prohibited by local or international law"
                    ]
                },
                {
                    title: "Payments & Fees",
                    content: "Bago uses a secure escrow system. Payments are held by our payment processor until delivery is confirmed by the Shipper. Bago collects a service fee for facilitating the transaction, which is clearly disclosed at the time of booking."
                },
                {
                    title: "Limitation of Liability",
                    content: "To the maximum extent permitted by law, Bago shall not be liable for any indirect, incidental, special, consequential or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly."
                }
            ]}
        />
    );
};

export default Terms;
