
const fs = require('fs');

async function updateLinkedInSingleSlide() {
    const base64A = fs.readFileSync('/Users/rafaelalmeida/lifetrek/scripts/b64_1.txt', 'utf8').trim();
    const imageUrlA = `data:image/png;base64,${base64A}`;

    const slidesA = [
        {
            "body": "Seu fornecedor passa na auditoria técnica? Baixe nosso checklist completo e garanta a conformidade ISO 13485.",
            "type": "hook",
            "headline": "Checklist: Auditoria de Fornecedores de Dispositivos Médicos",
            "imageUrl": imageUrlA
        }
    ];

    const payloadA = {
        slides: slidesA,
        image_urls: [imageUrlA],
        topic: "Checklist: Auditoria de Fornecedores (Versão A - Fotográfica)"
    };

    console.log("Updating main LinkedIn post to 1 slide (Version A)...");

    const respA = await fetch('https://dlflpvmdzkeouhgqwqba.supabase.co/rest/v1/linkedin_carousels?id=eq.baa58b96-2337-49e6-9aab-cf1d15bc0b71', {
        method: 'PATCH',
        headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsZmxwdm1kemtlb3VoZ3F3cWJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzcyNzYwOSwiZXhwIjoyMDgzMzAzNjA5fQ.QT2RDwGP92JhDFb3fGRgMuViKW-AioTIu44x_g0hw5o',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsZmxwdm1kemtlb3VoZ3F3cWJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzcyNzYwOSwiZXhwIjoyMDgzMzAzNjA5fQ.QT2RDwGP92JhDFb3fGRgMuViKW-AioTIu44x_g0hw5o',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payloadA)
    });

    if (respA.ok) console.log("Success Version A!");
}

updateLinkedInSingleSlide();
