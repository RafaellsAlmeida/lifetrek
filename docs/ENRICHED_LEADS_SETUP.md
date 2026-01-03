# Sistema de Leads Enriquecidos

## Visão Geral

Este sistema permite importar e visualizar leads enriquecidos (2600+ leads) no painel EV do Lifetrek Medical. Os leads foram gerados através de um processo de scraping, scoring e enrichment, e agora ficam sincronizados com o front-end.

## Arquitetura

```
┌─────────────────┐
│  CSV File       │
│  (2127 leads)   │
└────────┬────────┘
         │
         │ import-leads script
         ↓
┌─────────────────┐
│  Supabase DB    │
│ enriched_leads  │
└────────┬────────┘
         │
         │ Real-time sync
         ↓
┌─────────────────┐
│  EV Dashboard   │
│   Front-end     │
└─────────────────┘
```

## Estrutura de Dados

### Tabela `enriched_leads`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único |
| company | TEXT | Nome da empresa |
| website | TEXT | Website da empresa |
| email | TEXT | Email de contato |
| phone | TEXT | Telefone |
| decision_maker | TEXT | Tomador de decisão |
| lead_score | INTEGER | Score do lead (0-100) |
| confidence_score | INTEGER | Confiança no enrichment (0-100) |
| city | TEXT | Cidade |
| state | TEXT | Estado |
| employees | INTEGER | Número de funcionários |
| years_active | INTEGER | Anos de atividade |
| perplexity_segment | TEXT | Segmento de mercado |
| fda_certified | BOOLEAN | Certificação FDA |
| ce_certified | BOOLEAN | Certificação CE |
| linkedin_company | TEXT | URL LinkedIn da empresa |
| perplexity_notes | TEXT | Notas de enrichment |
| ... | ... | Outros campos de enrichment |

## Setup e Instalação

### 1. Aplicar a Migration do Banco de Dados

```bash
# A migration cria a tabela enriched_leads e views
# Se você usa Supabase CLI:
supabase db push

# Ou aplique manualmente o arquivo:
# supabase/migrations/20260103140000_create_enriched_leads.sql
```

### 2. Importar os Leads do CSV

```bash
# Certifique-se de que o arquivo .env está configurado com:
# VITE_SUPABASE_URL=your-supabase-url
# VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Execute o script de importação:
npm run import-leads
```

O script irá:
- Ler o arquivo `.tmp/MASTER_ENRICHED_LEADS.csv`
- Limpar dados existentes (opcional)
- Importar em lotes de 100 leads
- Mostrar estatísticas ao final

### 3. Verificar a Importação

Após a importação, você verá:

```
🎉 Import completed!
   ✅ Success: 2127 leads
   ❌ Errors: 0 leads
=================================================

📈 Statistics:
   Total leads: 2127
   High quality (score >= 70): 856
   Unique segments: 42
   Top segments: Dental Implants, Orthopedic Devices, ...
```

## Uso no Dashboard EV

### Acessar o Painel

1. Faça login como administrador em `/admin/login`
2. Navegue para `/ev` (Dashboard EV)
3. Clique na aba "Leads Enriquecidos"

### Funcionalidades Disponíveis

#### 1. Filtros Avançados

- **Busca por texto**: Procure por empresa, cidade, email
- **Filtro por Segmento**: Dental Implants, Orthopedic Devices, etc.
- **Filtro por Score**: Alto (≥80), Médio (60-79), Baixo (<60)
- **Filtro por Estado**: SP, RJ, PR, etc.

#### 2. Visualização de Leads

Cada card de lead mostra:
- Nome da empresa e segmento
- Score e confiança
- Email e telefone
- Localização (cidade/estado)
- Número de funcionários
- Certificações (FDA, CE)
- Link para website

#### 3. Detalhes do Lead

Clique em qualquer lead para ver:
- Informações completas de contato
- Detalhes da empresa
- Produtos oferecidos
- Notas de enrichment (Perplexity)
- Links para LinkedIn
- Histórico de enriquecimento

#### 4. Exportação

Clique em "Exportar" para baixar os leads filtrados em CSV.

### Estatísticas no Dashboard

O dashboard mostra:
- **Total de Leads Enriquecidos**: 2127
- **Alta Qualidade** (score ≥ 70): ~850+
- **Score Médio**: calculado em tempo real
- **Distribuição por Segmento**: visualização dos principais segmentos

## Estrutura de Arquivos

```
lifetrek-mirror/
├── .tmp/
│   └── MASTER_ENRICHED_LEADS.csv          # CSV fonte
├── supabase/
│   └── migrations/
│       └── 20260103140000_create_enriched_leads.sql  # Migration
├── scripts/
│   └── import-enriched-leads.ts           # Script de importação
├── src/
│   ├── components/
│   │   └── admin/
│   │       └── EnrichedLeadsTable.tsx     # Componente principal
│   ├── hooks/
│   │   └── useEnrichedLeads.ts            # React hooks
│   └── pages/
│       └── SalesEngineerDashboard.tsx     # Dashboard EV
└── docs/
    └── ENRICHED_LEADS_SETUP.md            # Este arquivo
```

## Fluxo de Trabalho Recomendado

### Para o Engenheiro de Vendas (EV)

1. **Início do Dia**
   - Acesse o Dashboard EV
   - Revise os leads de alta qualidade (score ≥ 80)
   - Filtre por segmento de interesse

2. **Qualificação de Leads**
   - Ordene por score (já ordenado por padrão)
   - Verifique certificações (FDA, CE)
   - Analise notas de enrichment

3. **Ação**
   - Copie emails/telefones para contato
   - Visite websites das empresas
   - Conecte no LinkedIn via links fornecidos
   - Exporte lista para CRM externo se necessário

4. **Follow-up**
   - Use a aba "Ação Pendente" para leads do formulário
   - Combine com leads enriquecidos do mesmo segmento

## Manutenção

### Re-importar Leads

Se você receber uma nova versão do CSV:

```bash
# 1. Substitua o arquivo
cp novo_arquivo.csv .tmp/MASTER_ENRICHED_LEADS.csv

# 2. Re-execute o import
npm run import-leads
```

O script limpa dados antigos automaticamente.

### Backup

```sql
-- Fazer backup da tabela
SELECT * FROM enriched_leads;

-- Restaurar de backup
INSERT INTO enriched_leads (...) VALUES (...);
```

## Troubleshooting

### Erro: "CSV file not found"

Certifique-se que o arquivo existe:
```bash
ls -la .tmp/MASTER_ENRICHED_LEADS.csv
```

### Erro: "Missing Supabase credentials"

Configure o `.env`:
```bash
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon
```

### Leads não aparecem no Dashboard

1. Verifique se a migration foi aplicada
2. Verifique se o import foi bem-sucedido
3. Verifique permissões RLS no Supabase
4. Limpe cache do browser (Ctrl+Shift+R)

### Performance lenta

- A tabela tem índices otimizados para:
  - Busca por empresa
  - Filtro por cidade/estado
  - Ordenação por score
  - Filtro por segmento

Se ainda estiver lento:
```sql
-- Reindexar a tabela
REINDEX TABLE enriched_leads;
```

## Próximos Passos

Possíveis melhorias futuras:
- [ ] Integração com CRM
- [ ] Atualização automática de CSV via cron
- [ ] Sistema de tags/notas no front-end
- [ ] Histórico de interações com leads
- [ ] Exportação para diversos formatos (Excel, JSON)
- [ ] Dashboard analítico com gráficos
- [ ] Integração com LinkedIn Sales Navigator

## Suporte

Para dúvidas ou problemas:
1. Verifique este documento
2. Consulte os logs do import
3. Verifique o console do browser (F12)
4. Entre em contato com o time de desenvolvimento
