# Plano: Melhorias no Gerenciador de Menus

## Contexto

Dois problemas identificados no `menu-manager` e `menu-modal`:

1. **Listagem de itens** — a tabela flat não comunica a hierarquia (pai/filho) nem a ordem relativa dos itens de forma visual clara.
2. **Seleção de páginas** — `<Select>` não escala com muitas páginas; o usuário fica sem busca e a lista fica enorme.

---

## Problema 1 — Visualização hierárquica dos itens de menu

### Situação atual
A tabela usa `flattenTreeWithLevel` e exibe o nível com `&nbsp;` (espaços) como recuo. Isso é frágil visualmente, dificulta identificar o pai de cada item e não mostra a ordem de forma clara.

### Solução proposta: **Substituir a tabela por uma lista em árvore (Tree List)**

Criar um componente `<MenuItemTree>` que renderiza os itens de menu de forma hierárquica com:

| Elemento | Descrição |
|---|---|
| **Recuo visual** | `padding-left` proporcional ao nível (`level * 24px`) |
| **Linha conectora** | Borda lateral (`border-l-2`) com ponto (`::before`) indicando a relação pai→filho |
| **Badge de ordem** | Badge numérico (`order`) à esquerda de cada item |
| **Menu de origem** | Chip/badge com o nome do menu ao lado do label |
| **Nível** | Badge discreto `Nível N` |
| **Ações** | Botões Ver/Editar/Deletar alinhados à direita |

**Estrutura de dados:** Usar o `IMenuItem.children` (já existente no tipo) para renderizar a árvore recursivamente a partir dos itens raiz (`parentId === null`).

### Proposta visual (esquema)
```
[Menu: Principal]
  ┌ [1] Início                          Nível 0  [👁] [✏] [🗑]
  ├─ [2] Sobre                          Nível 0  [👁] [✏] [🗑]
  │   ├─ [1] Nossa história             Nível 1  [👁] [✏] [🗑]
  │   └─ [2] Equipe                     Nível 1  [👁] [✏] [🗑]
  └ [3] Contato                         Nível 0  [👁] [✏] [🗑]
```

### Arquivos afetados

#### [NEW] `components/menu-item-tree.tsx`
Componente recursivo que renderiza `IMenuItem[]` como árvore visual. Recebe os itens raiz e um callback `onEdit`/`onDelete`.

#### [MODIFY] `menus.viewmodel.tsx`
- Adicionar `rootItems`: lista dos itens sem `parentId` (itens raiz), filtrados pelo menu selecionado e busca.
- Remover/manter `filteredItems` para compatibilidade com a tabela atual durante a transição.

#### [MODIFY] `menu-manager.tsx`
- Substituir o bloco `<Table>` + paginação pelo `<MenuItemTree>`.
- Manter os filtros (menu, busca) na toolbar — eles continuam aplicáveis.
- Remover o filtro de nível (desnecessário na visão em árvore, pois o nível fica implícito na hierarquia).

---

## Problema 2 — Seleção de páginas com muitas opções

### Situação atual
`<Select>` no `menu-modal.tsx` para escolher a página vinculada ao item. Não tem busca. Com dezenas/centenas de páginas, fica inutilizável.

### Solução proposta: **Combobox com busca (Command + Popover)**

Padrão consolidado no shadcn/ui: `<Popover>` + `<Command>` (já disponíveis no projeto) formam um **combobox pesquisável**:

- Campo de busca filtra instantaneamente (client-side)
- Exibe o título + slug de cada página como sublabel
- Mostra badge "selecionado" quando há valor
- Suporta limpeza de seleção com um `×`

**Por que não paginação server-side para páginas?**
Com ~500 páginas, o fetch inicial ainda é viável e a busca client-side é instantânea. Server-side só valeria a pena acima de ~2.000 registros ou com latência alta na API.

> [!TIP]
> Se no futuro o volume crescer, basta trocar o `Command` client-side por um `Input` que chama a API com debounce — o layout do campo não muda para o usuário.

### Arquivos afetados

#### [NEW] `components/ui/combobox.tsx`
Componente reutilizável `<Combobox>` genérico:
```tsx
interface ComboboxProps<T> {
  items: T[];
  value: string | null;
  onChange: (value: string | null) => void;
  getLabel: (item: T) => string;
  getSublabel?: (item: T) => string;
  getValue: (item: T) => string;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
}
```

#### [MODIFY] `menu-modal.tsx`
- Substituir o `<Select>` de páginas pelo `<Combobox>` com `items={pages}`, `getLabel={p => p.title}`, `getSublabel={p => p.slug}`, `getValue={p => p.id}`.

---

## Proposta Visual do Combobox

```
┌─────────────────────────────────────────────┐
│ 🔍 Buscar página...                          │
├─────────────────────────────────────────────┤
│ Inscrições Cursos Técnicos                  │
│ /inscricoes-cursos                          │
├─────────────────────────────────────────────┤
│ Concurso Público 2025                       │
│ /concurso-publico-2025                      │
├─────────────────────────────────────────────┤
│ ... (filtra dinamicamente)                  │
└─────────────────────────────────────────────┘
```

---

## Resumo das entregas

| # | Arquivo | Ação | Descrição |
|---|---------|------|-----------|
| 1 | `components/menu-item-tree.tsx` | **NEW** | Componente de árvore recursiva com recuo visual, badges e ações |
| 2 | `components/ui/combobox.tsx` | **NEW** | Combobox genérico reutilizável com busca |
| 3 | `menus.viewmodel.tsx` | **MODIFY** | Adicionar `rootItems` com itens organizados por pai |
| 4 | `menu-manager.tsx` | **MODIFY** | Substituir tabela por `<MenuItemTree>` |
| 5 | `menu-modal.tsx` | **MODIFY** | Substituir `<Select>` de páginas por `<Combobox>` |

## Open Questions

> [!IMPORTANT]
> **Seletor de "item pai" no modal:** o mesmo problema de escala existe no `<Select>` de item pai. Devo aplicar o `<Combobox>` também nesse campo? (Recomendado sim, pois menus grandes terão muitos itens filhos)

> [!IMPORTANT]
> **Reordenação de itens:** deseja adicionar drag-and-drop para reordenar os itens dentro da árvore, ou a edição manual do campo `order` no modal é suficiente por enquanto?
