
# Plano de Correção: Autenticação, Build Errors e Segurança

## Resumo dos Problemas Identificados

A investigação revelou **três categorias de problemas críticos**:

### 1. Bypass de Autenticação (CRÍTICO)
O arquivo `src/components/admin/ProtectedAdminRoute.tsx` contém um **bypass temporário** na linha 7-8:
```typescript
// TEMP: Bypass for screenshot
return <Outlet />;
```
Isso faz com que **todas as rotas admin sejam acessíveis sem login**, permitindo que qualquer pessoa acesse `/admin`, `/admin/leads`, etc.

### 2. Tipos do Supabase Desatualizados
O arquivo `types.ts` gerado automaticamente está **desatualizado** em relação ao schema real do banco. As tabelas existem no banco (confirmado via queries), mas os tipos TypeScript não as reconhecem:
- `blog_analytics` - existe no banco, mas TS não reconhece
- `blog_categories` - existe no banco, mas TS não reconhece  
- `content_templates` - existe no banco, mas TS não reconhece
- `content_assets` - existe no banco, mas TS não reconhece
- `onboarding_progress` - existe no banco, mas TS não reconhece

### 3. Erro de Sintaxe (Propriedade Duplicada)
Em `src/components/EquipmentCarousel.tsx` linha 238-239:
```typescript
"Sample Prep": t("equipment.category.sampleprep"),
"Sample Prep": t("equipment.category.sampleprep"), // DUPLICADO
```

---

## Plano de Ação

### Fase 1: Corrigir o Bypass de Autenticação
**Arquivo:** `src/components/admin/ProtectedAdminRoute.tsx`

Remover as linhas 7-8 que bypassam a autenticação:
```typescript
// REMOVER:
// TEMP: Bypass for screenshot
return <Outlet />;
```

Isso restaurará o fluxo normal de autenticação que:
1. Verifica se há sessão ativa
2. Consulta `admin_permissions` para validar permissão
3. Redireciona para `/admin/login` se não autorizado

### Fase 2: Regenerar Tipos do Supabase
Os tipos TypeScript precisam ser regenerados para refletir o schema atual do banco. Isso será feito automaticamente pelo sistema quando eu fizer uma migração de banco que adiciona um comentário (touch migration).

### Fase 3: Corrigir Propriedade Duplicada
**Arquivo:** `src/components/EquipmentCarousel.tsx`

Remover a linha duplicada 239:
```typescript
const labels: Record<EquipmentCategory, string> = {
  "Metrology": t("equipment.category.metrology"),
  "CNC": t("equipment.category.cnc"),
  "Sample Prep": t("equipment.category.sampleprep"),
  // REMOVER A LINHA DUPLICADA
  "Finishing": t("equipment.category.finishing"),
  "Clean Room": "Sala Limpa",
};
```

### Fase 4: Aplicar Type Assertions Temporárias
Enquanto os tipos não são regenerados, aplicar `as any` ou `as unknown` em arquivos afetados para permitir o build:
- `src/components/OnboardingChecklist.tsx`
- `src/components/admin/ContentCalendarPreview.tsx`
- `src/components/admin/dashboards/SalesDashboard.tsx`
- `src/components/admin/dashboards/SuperAdminDashboard.tsx`
- `src/components/ev/ContentCalendarPreview.tsx`
- `src/hooks/useBlogAnalytics.ts`
- `src/hooks/useBlogPosts.ts`
- `src/hooks/useLinkedInAnalytics.ts`
- `src/pages/Admin/EnvironmentAssets.tsx`

---

## Dados de Autenticação Confirmados

A investigação do banco confirmou:

**Tabela `admin_permissions` (fonte primária):**
| Email | Nível | Display Name |
|-------|-------|--------------|
| rafacrvg@icloud.com | super_admin | Rafael |
| vmartins@lifetrek-medical.com | admin | Vanessa Martins |
| njesus@lifetrek-medical.com | admin | Nelson Jesus |
| rbianchini@lifetrek-medical.com | admin | Renner Bianchini |
| erenner@lifetrek-medical.com | admin | Eduardo Renner |

**Funções de Segurança:**
- `has_role()` - Verifica roles na tabela `user_roles`
- `is_super_admin()` - Verifica se usuário é super_admin em `admin_permissions`

Ambas são `SECURITY DEFINER` e funcionam corretamente.

---

## Resultado Esperado

Após as correções:
1. O admin será protegido novamente - requer login para acessar
2. O build passará sem erros de TypeScript
3. Usuários na tabela `admin_permissions` poderão fazer login normalmente
4. A estrutura de RBAC (super_admin vs admin) funcionará conforme esperado
