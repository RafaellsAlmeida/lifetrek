
const fs = require('fs');

async function updateLinkedInVersionB() {
    const base64B = fs.readFileSync('/Users/rafaelalmeida/lifetrek/scripts/b64_b.txt', 'utf8').trim();
    const imageUrlB = `data:image/png;base64,${base64B}`;

    const slidesB = [
        {
            "body": "Seu fornecedor passa na auditoria... mas passa na prática? Use nosso checklist AI-native para validar seus parceiros.",
            "type": "hook",
            "headline": "Auditoria ISO 13485: Além do Certificado",
            "imageUrl": imageUrlB
        }
    ];

    const payloadB = {
        slides: slidesB,
        image_urls: [imageUrlB],
        topic: "Checklist: Auditoria de Fornecedores (Versão B - AI-Native)",
        status: "pending_approval"
    };

    console.log("Updating LinkedIn post Version B to 1 slide...");

    const respB = await fetch('https://dlflpvmdzkeouhgqwqba.supabase.co/rest/v1/linkedin_carousels?id=eq.e26d7045-8323-47f5-bb2e-12661d38d58a', {
        method: 'PATCH',
        headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsZmxwdm1kemtlb3VoZ3F3cWJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzcyNzYwOSwiZXhwIjoyMDgzMzAzNjA5fQ.QT2RDwGP92JhDFb3fGRgMuViKW-AioTIu44x_g0hw5o',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsZmxwdm1kemtlb3VoZ3F3cWJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzcyNzYwOSwiZXhwIjoyMDgzMzAzNjA5fQ.QT2RDwGP92JhDFb3fGRgMuViKW-AioTIu44x_g0hw5o',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payloadB)
    });

    if (respB.ok) console.log("Success Version B!");
}

updateLinkedInVersionB();
