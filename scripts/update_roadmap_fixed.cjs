
const fs = require('fs');

async function updateRoadmapCarousel() {
    const b64_1 = fs.readFileSync('/Users/rafaelalmeida/lifetrek/scripts/roadmap_b64_1.txt', 'utf8').trim();
    const b64_2 = fs.readFileSync('/Users/rafaelalmeida/lifetrek/scripts/roadmap_b64_2.txt', 'utf8').trim();

    const img1 = `data:image/png;base64,${b64_1}`;
    const img2 = `data:image/png;base64,${b64_2}`;

    const slides = [
        {
            "body": "Reduza riscos, melhore a qualidade e ganhe controle. Baixe nosso guia!",
            "type": "hook",
            "headline": "Roteiro de 90 Dias para Produção Local",
            "imageUrl": img1
        },
        {
            "body": "Entre em contato com a Lifetrek Medical hoje para uma consulta personalizada e descubra como nossa experiência pode ajudá-lo a implementar uma estratégia de produção local de sucesso.",
            "type": "call-to-action",
            "headline": "Pronto para assumir o controle?",
            "imageUrl": img2
        }
    ];

    const payload = {
        slides: slides,
        image_urls: [img1, img2],
        status: 'pending_approval'
    };

    console.log("Updating Roadmap carousel 5b96302d-b0c1-4b07-b0dc-a12239228c51...");

    const response = await fetch('https://dlflpvmdzkeouhgqwqba.supabase.co/rest/v1/linkedin_carousels?id=eq.5b96302d-b0c1-4b07-b0dc-a12239228c51', {
        method: 'PATCH',
        headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsZmxwdm1kemtlb3VoZ3F3cWJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzcyNzYwOSwiZXhwIjoyMDgzMzAzNjA5fQ.QT2RDwGP92JhDFb3fGRgMuViKW-AioTIu44x_g0hw5o',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsZmxwdm1kemtlb3VoZ3F3cWJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzcyNzYwOSwiZXhwIjoyMDgzMzAzNjA5fQ.QT2RDwGP92JhDFb3fGRgMuViKW-AioTIu44x_g0hw5o',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (response.ok) {
        console.log("Success! Roadmap carousel updated.");
    } else {
        console.log("Error:", response.status, await response.text());
    }
}

updateRoadmapCarousel();
