# Guia Rápido: Sincronização de Leads Enriquecidos

## 🚀 Como Começar (3 passos)

### 1️⃣ Aplicar Migration do Banco

A migration cria a tabela `enriched_leads` no Supabase.

**Opção A: Via Supabase Dashboard**
1. Acesse o Supabase Dashboard
2. Vá em SQL Editor
3. Copie e cole o conteúdo de `supabase/migrations/20260103140000_create_enriched_leads.sql`
4. Execute

**Opção B: Via Supabase CLI (se instalado)**
```bash
supabase db push
```

### 2️⃣ Importar Leads do CSV

```bash
# Certifique-se que o .env está configurado
npm run import-leads
```

Isso vai:
- ✅ Ler 2,127 leads do CSV
- ✅ Importar para o Supabase
- ✅ Mostrar estatísticas

### 3️⃣ Visualizar no Dashboard

1. Acesse `/admin/login`
2. Faça login como admin
3. Navegue para `/ev`
4. Clique na aba **"Leads Enriquecidos"**

## ✨ O Que Você Verá

### Dashboard com 6 Cards de Estatísticas:
- **Leads Formulário**: Leads do formulário de contato
- **Leads Enriquecidos**: 2,127 leads importados
- **Novos**: Leads novos do formulário
- **Alta Prioridade**: Leads marcados como prioridade
- **Alta Qualidade**: Leads com score ≥ 70
- **Score Médio**: Score médio dos leads enriquecidos

### Nova Aba "Leads Enriquecidos":
- 🔍 Busca por empresa, cidade, email
- 🏷️ Filtro por Segmento (Dental Implants, Orthopedic Devices, etc.)
- ⭐ Filtro por Score (Alto, Médio, Baixo)
- 📍 Filtro por Estado (SP, RJ, PR, etc.)
- 📥 Botão de exportar para CSV
- 🔄 Atualização em tempo real

### Para Cada Lead:
- Nome da empresa e segmento
- Score de qualidade (0-100)
- Email e telefone
- Localização
- Certificações (FDA, CE)
- Link para website
- Click para ver detalhes completos

## 📊 Exemplos de Uso

### Encontrar Leads de Alta Qualidade em SP
1. Selecione "Estado: SP"
2. Selecione "Score: Alto (≥80)"
3. Ordene automaticamente por score

### Buscar Empresas de Implantes Dentários
1. Selecione "Segmento: Dental Implants"
2. Use a busca para refinar

### Exportar Lista para CRM
1. Aplique filtros desejados
2. Clique em "Exportar"
3. Baixe o CSV

## 🔧 Troubleshooting

### Erro: "CSV file not found"
```bash
# Verifique se o arquivo existe
ls -la .tmp/MASTER_ENRICHED_LEADS.csv
```

### Erro: "Missing Supabase credentials"
```bash
# Adicione ao .env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon
```

### Leads não aparecem
1. Verifique se a migration foi aplicada
2. Verifique se o import foi bem-sucedido
3. Force refresh no browser (Ctrl+Shift+R)

## 📁 Arquivos Criados

```
✅ supabase/migrations/20260103140000_create_enriched_leads.sql
✅ scripts/import-enriched-leads.ts
✅ src/components/admin/EnrichedLeadsTable.tsx
✅ src/hooks/useEnrichedLeads.ts
✅ src/pages/SalesEngineerDashboard.tsx (atualizado)
✅ docs/ENRICHED_LEADS_SETUP.md (documentação completa)
```

## 📚 Próximos Passos

1. ✅ Aplicar migration
2. ✅ Importar leads
3. ✅ Testar no dashboard
4. 📝 Treinar equipe de vendas
5. 🎯 Começar a qualificar leads

---

Para documentação completa, veja [docs/ENRICHED_LEADS_SETUP.md](docs/ENRICHED_LEADS_SETUP.md)
