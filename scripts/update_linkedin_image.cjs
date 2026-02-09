
const fs = require('fs');

async function updateLinkedIn() {
    const base64 = fs.readFileSync('/Users/rafaelalmeida/lifetrek/scripts/cover_base64.txt', 'utf8').trim();
    const imageUrl = `data:image/png;base64,${base64}`;

    const payload = {
        image_urls: [imageUrl],
        status: 'pending_approval'
    };

    console.log("Updating LinkedIn carousel baa58b96-2337-49e6-9aab-cf1d15bc0b71...");

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
        console.log("Success!");
    } else {
        console.log("Error:", response.status, await response.text());
    }
}

updateLinkedIn();
