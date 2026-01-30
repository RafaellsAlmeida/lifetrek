
# Plano: Atualização da Área Veterinária e Adição do Cliente Vetmaker

## Resumo
Atualizar a seção veterinária na página de Produtos com 2 novas fotos de implantes e adicionar o logo do novo cliente Vetmaker Facilities na seção de clientes.

---

## Arquivos Enviados

| Arquivo | Tipo | Uso |
|---------|------|-----|
| `Placa_T_Y_MIckey_3.5.jpg` | Implante veterinário (roxo) | Catálogo veterinário |
| `WhatsApp_Image_2025-05-21_at_08.42.35.jpeg` | Implante veterinário (magenta) | Catálogo veterinário |
| `WhatsApp_Image_2025-05-21_at_10.42.24.jpeg` | Implante veterinário (azul) | Opcional |
| `WhatsApp_Image_2025-05-21_at_15.20.11_1.jpeg` | Parafuso veterinário (dourado) | Opcional |
| `WhatsApp_Image_2025-05-21_at_10.42.25_1.jpeg` | Implante veterinário (azul/osso) | Opcional |
| `logotipo_vetmaker...pdf` | Logo Vetmaker Facilities | Seção clientes |

---

## Alterações Planejadas

### 1. Substituir 2 Fotos na Área Veterinária

**Arquivo:** `src/pages/Products.tsx`

**Imagens atuais do catálogo veterinário (linhas 131-137):**
- `veterinaryImplant1` - `veterinary-implant-1.jpg`
- `veterinaryImplant2` - `veterinary-implant-2.jpg`

**Ação:**
1. Copiar as 2 novas imagens para `src/assets/products/`:
   - `user-uploads://Placa_T_Y_MIckey_3.5.jpg` → `src/assets/products/veterinary-implant-1.jpg`
   - `user-uploads://WhatsApp_Image_2025-05-21_at_08.42.35.jpeg` → `src/assets/products/veterinary-implant-2.jpg`
2. Atualizar os alt texts para descrever os novos implantes

### 2. Adicionar Logo Vetmaker na Seção de Clientes

**Arquivos:**
- `src/pages/Clients.tsx` - Grid de logos
- `src/pages/Home.tsx` - Carrossel de clientes

**Ação:**
1. Extrair a melhor imagem do logo do PDF (página 1 ou 2)
2. Copiar para `src/assets/clients/vetmaker-new.png`
3. Adicionar import e entrada no array `clientLogos` em ambos os arquivos

---

## Detalhes Técnicos

### Estrutura Atual do Catálogo Veterinário
```typescript
// src/pages/Products.tsx - linhas 131-137
catalogImages: [{
  src: veterinaryImplant1,
  alt: "Implantes Ortopédicos Veterinários - Placas e parafusos para cirurgia veterinária"
}, {
  src: veterinaryImplant2,
  alt: "Sistemas de Fixação Veterinária - Implantes de titânio para ortopedia animal"
}]
```

### Estrutura dos Clientes
```typescript
// src/pages/Clients.tsx - clientLogos array
{ src: vetmaker, alt: "Vetmaker Facilities - Veterinary orthopedic implants" }

// src/pages/Home.tsx - clientLogos array (carrossel)
{ src: vetmaker, alt: "Vetmaker Facilities" }
```

---

## Resumo de Arquivos a Modificar

| Arquivo | Ação |
|---------|------|
| `src/assets/products/veterinary-implant-1.jpg` | **Substituir** com nova foto |
| `src/assets/products/veterinary-implant-2.jpg` | **Substituir** com nova foto |
| `src/assets/clients/vetmaker-new.png` | **Criar** com logo extraído |
| `src/pages/Clients.tsx` | **Adicionar** import e logo Vetmaker |
| `src/pages/Home.tsx` | **Adicionar** import e logo Vetmaker ao carrossel |

---

## Critérios de Sucesso

1. Ao abrir `/products` e expandir o catálogo veterinário, as 2 novas fotos de implantes (placa roxa e magenta) aparecem
2. O logo Vetmaker Facilities aparece no carrossel da Home e na grid de clientes em `/clients`
3. Todas as imagens carregam corretamente com lazy loading
