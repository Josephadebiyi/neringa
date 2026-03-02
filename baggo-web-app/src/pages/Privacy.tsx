import React from 'react';
import LegalPage from './LegalPage';

const Privacy: React.FC = () => {
    return (
        <LegalPage
            title="Privacy Policy"
            lastUpdated="March 01, 2026"
            sections={[
                {
                    title: "Information We Collect",
                    content: [
                        "Personal identification (Name, email, phone number)",
                        "Government-issued ID for verification purposes",
                        "Payment information (processed securely via MONEI)",
                        "Device information and IP addresses",
                        "Location data to facilitate matching with travelers"
                    ]
                },
                {
                    title: "How We Use Your Data",
                    content: "We use your data to facilitate matches, process payments, verify identities, and improve our services. Your data is also used to communicate important updates regarding your shipments and to ensure the safety of our community."
                },
                {
                    title: "Data Sharing",
                    content: "We do not sell your personal data. We share only necessary information with your matched traveler/shipper (like your name and location) to facilitate the delivery. We also share data with service providers like payment processors and ID verification services."
                },
                {
                    title: "Your Rights",
                    content: "Depending on your location (e.g., GDPR in Europe), you may have rights to access, correct, or delete your personal data. You can manage most of these settings directly from your Profile page or by contacting our data protection officer."
                },
                {
                    title: "Security Measures",
                    content: "We implement industry-standard security measures to protect your data, including encryption at rest and in transit. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security."
                }
            ]}
        />
    );
};

export default Privacy;
