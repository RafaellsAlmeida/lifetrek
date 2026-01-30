
# Plano: Correção de Usabilidade do Chatbot

## Problemas Identificados

### 1. Posicionamento Errado (Esquerda em vez de Direita)
**Código atual:**
```tsx
// Linha 123 - Botão flutuante
className="fixed bottom-28 left-6 ..."

// Linha 132 - Janela do chat  
<div className="fixed bottom-28 left-6 w-96 h-[600px] ..."
```
O chatbot está fixo no **lado esquerdo** (`left-6`), mas o padrão de UX é **lado direito**.

### 2. Conflito de Espaço com MobileNav e StickyCTA
- **MobileNav** (mobile): `fixed bottom-0` com `z-50`
- **StickyCTA** (desktop): `fixed bottom-0` com `z-50`
- **Chatbot**: `fixed bottom-28 left-6` com `z-50`

O `bottom-28` (112px) foi colocado para "fugir" do MobileNav, mas é um valor arbitrário que não funciona bem.

### 3. Lógica de Scroll Confusa
```tsx
// Linhas 36-62
useEffect(() => {
  const handleScroll = () => {
    const scrollDepth = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
    
    // Mostra botão só após 20% de scroll
    if (scrollDepth > 20) {
      setShowButton(true);
    }
    
    // Auto-abre em 35% de scroll
    if (scrollDepth > 35 && !hasAutoOpened && !isOpen) {
      setHasAutoOpened(true);
      setIsOpen(true);
    }
  };
  ...
});
```

**Problemas:**
1. O `showButton` é setado para `true` quando `scrollDepth > 20%`, mas **nunca volta para false** (não esconde quando volta ao topo)
2. O auto-open em 35% pode ser irritante para o usuário
3. Não há lógica para esconder ao fazer scroll UP (o que o usuário reportou)

---

## Correções Propostas

### 1. Mover Chatbot para o Lado Direito (Padrão UX)
```tsx
// Botão flutuante - ANTES
className="fixed bottom-28 left-6 ..."

// DEPOIS
className="fixed bottom-24 right-4 md:bottom-28 md:right-8 ..."

// Janela do chat - ANTES
<div className="fixed bottom-28 left-6 w-96 h-[600px] ..."

// DEPOIS  
<div className="fixed bottom-24 right-4 md:bottom-28 md:right-8 w-[calc(100vw-2rem)] md:w-96 h-[70vh] md:h-[600px] ..."
```

### 2. Corrigir Lógica de Visibilidade
```tsx
// Mostrar botão SEMPRE (ou após um delay inicial, não baseado em scroll)
const [showButton, setShowButton] = useState(false);

useEffect(() => {
  // Mostrar botão após 2 segundos na página
  const timer = setTimeout(() => setShowButton(true), 2000);
  return () => clearTimeout(timer);
}, []);
```

### 3. Remover Auto-Open Agressivo
O auto-open em 35% do scroll é irritante. Remover essa funcionalidade ou fazer opt-in.

### 4. Ajustar z-index para Evitar Conflitos
```tsx
// Chatbot deve ter z-index maior que MobileNav/StickyCTA
className="... z-[60]"  // em vez de z-50
```

### 5. Responsividade Mobile
No mobile, a janela do chat deve ocupar quase toda a tela para melhor usabilidade.

---

## Código Final Proposto

```tsx
export const AIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([...]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Mostrar botão após 2s (não depende de scroll)
  useEffect(() => {
    const timer = setTimeout(() => setShowButton(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  // ... resto do código

  return (
    <>
      {/* Botão Flutuante - LADO DIREITO */}
      {!isOpen && showButton && (
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="fixed bottom-24 right-4 md:bottom-28 md:right-8 h-12 w-12 sm:h-14 sm:w-14 rounded-full shadow-2xl hover:scale-110 transition-all duration-300 z-[60] bg-primary animate-bounce-subtle"
          aria-label="Abrir chat do Assistente Trek"
        >
          <MessageCircle className="h-5 w-5 sm:h-6 sm:6" />
        </Button>
      )}

      {/* Janela do Chat - LADO DIREITO + Responsiva */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 md:bottom-28 md:right-8 w-[calc(100vw-2rem)] md:w-96 h-[70vh] md:h-[600px] max-h-[calc(100vh-8rem)] bg-card border border-border rounded-2xl shadow-2xl flex flex-col z-[60] animate-scale-in">
          {/* Header, Messages, Input - sem alterações */}
        </div>
      )}
    </>
  );
};
```

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/AIChatbot.tsx` | Mover para direita, corrigir lógica de scroll, ajustar z-index, melhorar responsividade |

---

## Testes a Realizar

1. Verificar que o botão do chatbot aparece no **canto inferior direito**
2. Verificar que a janela do chat abre no **lado direito**
3. Fazer scroll UP e DOWN - o chatbot **não deve esconder**
4. Testar no mobile - verificar que não conflita com MobileNav
5. Testar envio de mensagem - confirmar que o backend responde
6. Testar em viewport pequeno (mobile) - janela deve ser responsiva

---

## Critérios de Pronto

1. Chatbot posicionado no lado direito (padrão UX)
2. Chatbot **não esconde** ao fazer scroll em qualquer direção
3. Botão aparece após 2s, sem depender de % de scroll
4. Sem conflito visual com MobileNav ou StickyCTA
5. Backend responde corretamente às mensagens
