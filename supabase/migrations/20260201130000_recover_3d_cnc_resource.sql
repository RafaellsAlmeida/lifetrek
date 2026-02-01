-- Migration to recover the missing 3D + CNC resource
-- Title: Guia de Precisão: Metrologia 3D e CNC Swiss
-- Status: pending_approval (to trigger Nelson's review)

INSERT INTO public.resources (
    title,
    description,
    content,
    type,
    persona,
    thumbnail_url,
    status,
    slug,
    metadata
) VALUES (
    'Guia de Precisão: Metrologia 3D e CNC Swiss',
    'Como a integração entre tornos suíços de alta performance e inspeção tridimensional garante zero falhas em implantes complexos.',
    '# Guia de Precisão: Metrologia 3D e CNC Swiss\n\nNa manufatura de dispositivos médicos, a precisão não é apenas um diferencial—é um requisito de sobrevivência. Este guia explora a sinergia entre o torneamento suíço e a metrologia avançada.\n\n## 1. O Papel do CNC Swiss\nTornos como o Citizen M32 e L20 permitem a usinagem de peças extremamente esbeltas com tolerâncias na casa dos microns. A tecnologia LFV (Low Frequency Vibration) é essencial para o controle de cavacos em ligas de titânio.\n\n## 2. Metrologia 3D (Zeiss Contura)\nA inspeção não pode ser um gargalo. O uso de máquinas de medir por coordenadas (CMM) com sensores de escaneamento ativo permite:\n- Verificação de perfis complexos.\n- Rastreabilidade total de cada lote.\n- Integração com software de controle estatístico de processo (CEP).\n\n## 3. Benefícios para o Cliente\n- Redução de lead time em 20%.\n- Garantia de montagem perfeita em sistemas modulares.\n- Documentação técnica completa para auditorias ANVISA/FDA.',
    'guide',
    'Engenharia/Qualidade',
    'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=2070&auto=format&fit=crop',
    'pending_approval',
    'guia-metrologia-3d-cnc-swiss',
    '{"tags": ["cnc", "metrologia", "qualidade", "3d"], "premium": true}'
) ON CONFLICT (slug) DO UPDATE SET
    status = 'pending_approval',
    updated_at = now();
