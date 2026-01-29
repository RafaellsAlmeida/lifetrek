
## Objetivo
Eliminar a tela branca causada por:
- `SyntaxError: Cannot declare an imported binding name twice: 'Clapperboard'` em `src/components/admin/AdminHeader.tsx`
- erro em cascata `TypeError: Importing a module script failed` (normalmente consequência do primeiro erro impedir o bundle de carregar)

## O que eu vi no código (estado atual)
- Em `src/components/admin/AdminHeader.tsx`, a importação de `lucide-react` atualmente mostra apenas **um** `Clapperboard` (linha ~24).
- O diff que você mandou mostra que existiu uma duplicação explícita (`Clapperboard` duas vezes) e só uma ocorrência foi removida naquele commit, o que sugere que:
  1) ainda pode haver **duplicação em outra importação** (em outro arquivo/branch/casing), ou  
  2) o Preview está carregando um bundle **cacheado** (Vite) que ainda contém a versão antiga com duplicação.

## Plano de correção (código + validação)
### 1) Confirmar e remover duplicações de imports no AdminHeader
- Revisar o bloco `import { ... } from "lucide-react";` do `AdminHeader.tsx` e garantir que:
  - `Clapperboard` aparece exatamente uma vez.
  - não há outros ícones duplicados (às vezes isso acontece por merge/auto-fix).
- Aplicar uma pequena alteração “inequívoca” no arquivo (ex.: reordenar o bloco de imports ou padronizar o bloco) para forçar o rebuild do bundle no Preview.

### 2) Verificar se existe um “arquivo duplicado” por casing (Admin/admin)
Esse tipo de bug já apareceu no projeto (conflitos `src/pages/admin/` vs `src/pages/Admin/`). Então:
- Procurar se existe algum arquivo alternativo/import paralelo que também exporte/importe `AdminHeader` (por exemplo, pastas `Admin` vs `admin`, ou uma segunda cópia do componente em outro local).
- Confirmar que o app usa apenas `src/components/admin/AdminHeader.tsx`.

### 3) Garantir que o Preview não está preso em cache
Mesmo com o código correto, o navegador pode continuar usando chunks antigos:
- Depois da correção, fazer um “hard refresh” (Ctrl/Cmd+Shift+R) e, se necessário, abrir o Preview em aba anônima para garantir que o bundle novo está sendo baixado.
- Validar especificamente em `/admin/video-studio` (rota atual do usuário), pois é onde o menu “Conteúdo” referencia `Clapperboard`.

### 4) Validar a correção no fluxo real
- Abrir `/admin/video-studio`:
  - confirmar que a página renderiza (sem tela branca)
  - confirmar que o header e o dropdown “Conteúdo” abrem normalmente
- Checar console: garantir que **sumiram** os dois erros de runtime.

## Critérios de pronto
- Não existe mais `Cannot declare an imported binding name twice: 'Clapperboard'`.
- Não existe mais `Importing a module script failed`.
- `/admin/video-studio` carrega normalmente com o header.

## Observação importante
Se após remover a duplicação no arquivo e forçar rebuild o erro persistir, o próximo passo será investigar se algum chunk está sendo gerado com uma versão antiga por conflito de path/casing, ou se algum import indireto está trazendo uma segunda declaração do mesmo binding (menos comum, mas possível em refactors). Nessa etapa eu vou rastrear a cadeia de imports a partir do `AdminLayout` / `App.tsx` até o `AdminHeader`.
