---
description: Qualify and score leads, suggest next actions, and engineer lead nurturing flows
---

# Lead Agent Engineer Skill

## Purpose
Analyze incoming leads, score them, and design nurturing strategies.

## Lead Scoring Framework

### BANT Criteria
| Factor | Weight | Criteria |
|--------|--------|----------|
| **Budget** | 25% | Has budget for medical device manufacturing? |
| **Authority** | 25% | Decision maker or influencer? |
| **Need** | 30% | Urgent need for precision manufacturing? |
| **Timeline** | 20% | Project timeline aligned with capacity? |

### Scoring Matrix
| Score | Label | Action |
|-------|-------|--------|
| 80-100 | 🔥 Hot | Immediate call from Vanessa |
| 60-79 | 🟡 Warm | Email sequence + meeting offer |
| 40-59 | 🟠 Nurture | Content drip, check back in 30 days |
| 0-39 | ❄️ Cold | Newsletter only, re-score quarterly |

## Lead Data Sources

### Form Fields to Analyze
- Company name → CNPJ lookup, size, industry
- Job title → Authority level
- Message content → Need urgency keywords
- Website → Company profile

### Enrichment Sources
- LinkedIn company page
- CNPJ lookup (ReceitaWS)
- ANVISA registry (if relevant)
- Google search for recent news

## Qualification Questions

Ask or infer:
1. What product are you developing? (Implant, instrument, equipment)
2. What materials? (Titanium, PEEK, stainless)
3. Current stage? (Prototype, validation, production)
4. Volume expectations? (Units/month)
5. Certifications needed? (FDA, ANVISA, CE)

## Response Templates

### Hot Lead Response
```
Olá [NOME],

Recebi sua mensagem sobre [PROJETO]. Pelo que entendi, vocês estão 
buscando [NECESSIDADE ESPECÍFICA].

Temos experiência direta com [CAPACIDADE RELEVANTE] e gostaríamos 
de entender melhor o projeto.

Posso sugerir uma call rápida de 15 minutos esta semana?

[VANESSA]
Engenheira de Vendas
```

### Warm Lead Response
```
Olá [NOME],

Obrigado pelo interesse na Lifetrek. 

Preparei alguns materiais que podem ajudar no seu projeto:
- [LINK CASE STUDY]
- [LINK CAPABILITIES]

Quando fizer sentido avançar, estou à disposição para uma conversa.

[VANESSA]
```

## Nurture Sequence Design

### Email Sequence Structure
| Day | Email | Goal |
|-----|-------|------|
| 0 | Welcome + Value prop | Introduce Lifetrek |
| 3 | Case study | Prove capability |
| 7 | Educational content | Add value |
| 14 | Check-in | Re-engage |
| 30 | Re-qualification | Score again |

## Integration Points

- **Supabase**: `leads` table for storage
- **Resend**: Email delivery
- **Stripe**: For payment-ready leads
- **LinkedIn**: Connection request flow

## Output Format

When analyzing a lead, provide:
1. **Score**: X/100 with breakdown
2. **Classification**: Hot/Warm/Nurture/Cold
3. **Next Action**: Specific recommendation
4. **Talking Points**: For Vanessa's call prep
5. **Risk Factors**: Potential deal blockers
