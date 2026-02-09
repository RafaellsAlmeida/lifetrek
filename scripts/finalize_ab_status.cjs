
const payloads = [
    {
        id: 'baa58b96-2337-49e6-9aab-cf1d15bc0b71',
        topic: 'Checklist: Auditoria de Fornecedores (Versão A - Fotográfica)',
        status: 'pending_approval'
    },
    {
        id: 'e26d7045-8323-47f5-bb2e-12661d38d58a',
        topic: 'Checklist: Auditoria de Fornecedores (Versão B - AI-Native)',
        status: 'pending_approval'
    }
];

async function finalizeABStatus() {
    for (const p of payloads) {
        console.log(`Finalizing status for ${p.id}...`);
        const resp = await fetch(`https://dlflpvmdzkeouhgqwqba.supabase.co/rest/v1/linkedin_carousels?id=eq.${p.id}`, {
            method: 'PATCH',
            headers: {
                'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsZmxwdm1kemtlb3VoZ3F3cWJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzcyNzYwOSwiZXhwIjoyMDgzMzAzNjA5fQ.QT2RDwGP92JhDFb3fGRgMuViKW-AioTIu44x_g0hw5o',
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsZmxwdm1kemtlb3VoZ3F3cWJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzcyNzYwOSwiZXhwIjoyMDgzMzAzNjA5fQ.QT2RDwGP92JhDFb3fGRgMuViKW-AioTIu44x_g0hw5o',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: p.status, topic: p.topic })
        });
        if (resp.ok) console.log(`Success for ${p.id}!`);
    }
}

finalizeABStatus();
