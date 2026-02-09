
const fs = require('fs');

async function updateLinkedInFull() {
    const images = [
        `data:image/png;base64,${fs.readFileSync('/Users/rafaelalmeida/lifetrek/scripts/b64_1.txt', 'utf8').trim()}`,
        `data:image/png;base64,${fs.readFileSync('/Users/rafaelalmeida/lifetrek/scripts/b64_2.txt', 'utf8').trim()}`,
        `data:image/png;base64,${fs.readFileSync('/Users/rafaelalmeida/lifetrek/scripts/b64_3.txt', 'utf8').trim()}`,
        `data:image/png;base64,${fs.readFileSync('/Users/rafaelalmeida/lifetrek/scripts/b64_4.txt', 'utf8').trim()}`,
        `data:image/png;base64,${fs.readFileSync('/Users/rafaelalmeida/lifetrek/scripts/b64_5.txt', 'utf8').trim()}`
    ];

    const slides = [
        {
            "body": "Are your medical device supplier audits truly comprehensive? A weak link in your supply chain can compromise product quality and patient safety. This checklist will help Quality Managers and Lead Auditors ensure thorough supplier evaluations.",
            "type": "hook",
            "headline": "Is Your Medical Device Supplier Audit a Safety Net or a Gamble?",
            "imageUrl": images[0]
        },
        {
            "body": "Supplier audits are paramount for maintaining quality and regulatory compliance. Key areas to assess include: \n\n*   **QMS Compliance:** Verify adherence to ISO 13485 & FDA 21 CFR Part 820.\n*   **Regulatory Standards:** Confirm understanding and implementation of applicable regulations.\n*   **Critical Processes:** Evaluate control and validation of critical manufacturing processes.",
            "type": "content",
            "headline": "Key Focus Areas for Robust Medical Device Supplier Audits",
            "imageUrl": images[1]
        },
        {
            "body": "Ensure your checklist covers these crucial aspects of your supplier's operations:\n\n*   **Document Control:** Is documentation accurate, up-to-date, and readily available?\n*   **Training Records:** Are personnel adequately trained and competent?\n*   **Equipment Maintenance:** Is equipment properly maintained and calibrated?\n*   **CAPA Management:** Are corrective and preventive actions effectively implemented?\n*   **Risk Management:** Are risks identified, assessed, and mitigated?",
            "type": "content",
            "headline": "Essential Checklist Items: Dive Deeper into Key Processes",
            "imageUrl": images[2]
        },
        {
            "body": "Go beyond process audits! Verify:\n\n*   **Product Specifications:** Can the supplier consistently meet defined specifications?\n*   **Adequate Testing:** Are appropriate tests performed and documented?\n*   **Traceability:** Can products be traced throughout the entire supply chain, from raw materials to finished goods?",
            "type": "content",
            "headline": "Product Quality & Traceability: Verify Performance Metrics",
            "imageUrl": images[3]
        },
        {
            "body": "Elevate your supplier quality management program with our detailed checklist. Ensure thorough evaluations and mitigate potential risks. Contact Lifetrek Medical today to optimize your supplier quality management program! [Link to Download]",
            "type": "call_to_action",
            "headline": "Download Your Comprehensive Medical Device Supplier Audit Checklist!",
            "imageUrl": images[4]
        }
    ];

    const payload = {
        slides: slides,
        image_urls: images
    };

    console.log("Updating all slides for LinkedIn carousel baa58b96-2337-49e6-9aab-cf1d15bc0b71...");

    const response = await fetch('https://dlflpvmdzkeouhgqwqba.supabase.co/rest/v1/linkedin_carousels?id=eq.baa58b96-2337-49e6-9aab-cf1d15bc0b71', {
        method: 'PATCH',
        headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsZmxwdm1kemtlb3VoZ3F3cWJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzcyNzYwOSwiZXhwIjoyMDgzMzAzNjA5fQ.QT2RDwGP92JhDFb3fGRgMuViKW-AioTIu44x_g0hw5o',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsZmxwdm1kemtlb3VoZ3F3cWJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzcyNzYwOSwiZXhwIjoyMDgzMzAzNjA5fQ.QT2RDwGP92JhDFb3fGRgMuViKW-AioTIu44x_g0hw5o',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (response.ok) {
        console.log("Success! All 5 slides updated with images.");
    } else {
        console.log("Error:", response.status, await response.text());
    }
}

updateLinkedInFull();
