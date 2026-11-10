[20/07/2026 - 16:34]

[x] Adicionada página personalizada de rota não encontrada.

[x] Verifiquei que o @media-manager não está renderizando corretamente, mas upload de imagens e criação de pastas estavam funcionando. O erro era por conta da alteração das colunas no banco de dados de "created_at" para "createdAt" e "file_size" para "fileSize".

[28/07/2026 - 17:32]

Alterei o new-article para receber os modos edit e create, dessa forma sendo possível reutilizar o componente. Ainda falta corrigir a visualização da capa no modo edição. No modo de edição, as imagens da galeria também não estão aparecendo.

O componente da parte pública de exibição dos artigos precisa ser corrigido.

[14/08/2026 - 17:27]

[x] O new-article foi atualizado, retirei o controle de galeria de dentro da tabela de artigos para utilizar o model correto de galerias. Foram necessárias alterações no schema, article.service e new-article.tsx. Apenas a parte visual foi implementada no new-article.tsx, falta criar um model para escolha de galeria na edição do artigo.

[21/08/2026 - 16:24]

[x] Criei o model para criação de menus, mas percebi que a forma de visualização deles está confusa. Vou precisar pensar em outra forma de gereciamento para os menus.

[24 a 27/08/2026]

[x] Adicionada função de gerenciamento de popUps na área administrativa. Foi necessário criar um model PopUp, um service PopUp e adicionar uma nova rota. A função de criação, edição, remoção e listagem está funcionando.

[09/09/2026]
[x] Criado gerenciador de destaques.

[11/09/2026]
[x] Corrigido conflito do new-page-modal com o dnd-kit.

[15/09/2026 - 16:00]
[x] Article-block atualizado com animações e rotas. Criados os componentes articles-list, article e article-body-visualizer para auxiliar na organização e visualização das notícias.

[06/11/2026]
Finalizado os cards do dashboard, ajustado para o editor de texto acessar o modal de seleção de imagens, corrigido alguns botões da toolbar do editor de texto, corrigido visualizador de artigos para suportar imagens vindas do banco de dados.

[09/11/2026]

- [x] Stories (Visualizador e Gerenciador):
  - Ajustado visualizador de stories: botão de pause agora é toggle; divisão de tela em 50% à esquerda (retroceder) e 50% à direita (avançar); toques longos (>500ms) apenas pausam sem trocar de slide; clique fora da imagem fecha o visualizador.
  - Implementada exibição e abertura de links nos stories: botão com ícone chevron no desktop e gesto swipe-up no mobile, além de exibição inferior de legendas (caption).
  - Criado modal para edição de destaques (título e descrição) e formulário de adição/edição de itens de stories com suporte a caption e link.
  - Corrigido conflito de rota `@Patch('items/order')` x `@Patch('items/:id')` no backend e regenerado Prisma Client com a coluna `link`.

- [x] Artigos (Filtros e UX de Listagem):
  - Substituído dropdown de filtros por Sheet lateral (Drawer) seguindo boas práticas de UX (busca de categorias em tempo real, badges, botões semânticos de status, contador de resultados e chips de filtros ativos com remoção rápida).
  - Corrigida a função de filtragem por categorias no ViewModel para filtrar por UUID.

- [x] Artigos (Ciclo de Vida, Agendamento e Soft Delete):
  - Adicionado status `programado` ao enum `ArticleStatus` no Prisma Schema e aplicada migration.
  - Criado worker com `@nestjs/schedule` (`ArticlesSchedulerService`):
    - Execução a cada minuto para publicar artigos programados cuja data de publicação chegou e expirar artigos cuja data de expiração passou.
    - Execução diária (3h da manhã) para expurgar artigos com soft delete (`excluido`) há mais de 90 dias.
  - Isolada listagem administrativa (`GET /articles/admin`) para exibir todos os artigos não excluídos, enquanto a rota pública exibe apenas artigos publicados e vigentes.
  - Atualizado frontend (service, viewmodel e listagem) para suportar o status `programado` e consumir a rota administrativa.

- [x] Implementação dos Itens do TODO.md:
  - **Criação de Galerias no GalleryPickerModal**: adicionado botão "+ Nova Galeria" no modal de seleção de galerias, integrando o `GalleryModal` para criação instantânea sem trocar de tela e selecionando automaticamente a nova galeria criada.
  - **Deleção em massa de mídias**: implementada barra de ações flutuante (*bulk action bar*) com animação, contador de arquivos selecionados, desmarcar todos, seleção total por pasta e confirmação segura via `AlertDialog` antes da exclusão.
  - **Aviso de dimensões/proporção de imagens**: criado utilitário `image-dimensions.ts` com presets (Story `9:16`, Capa `16:9`, Avatar `1:1`, Galeria `16:9`) que analisa as dimensões reais da mídia em memória e exibe alerta visual de incompatibilidade antes do salvamento.
  - **Documentação da API na área administrativa**: configurado Swagger/OpenAPI no backend (`/api/docs` e `/api/docs-json`) e criada página administrativa integrada em `/administrator/docs` com visualizador interativo e atalho na barra lateral.
  - **Auditoria de Aplicação e Logs Viewer**: criado model `AuditLog` no Prisma, interceptor global assíncrono enfileirando mutações na fila BullMQ (`audit`) sem onerar requisições, endpoint seguro para administradores (`GET /audit-logs`), página de visualização em `/administrator/logs` com badges semânticos, filtros e modal de inspeção de payload, e atalho no menu lateral.

[10/11/2026]

- [x] Documentação da API:
  - Ajustado atalho no menu lateral (`painel-sidebar.tsx`): o botão "Docs da API" agora abre diretamente o endpoint Swagger (`/api/docs`) em uma nova aba com `target="_blank"` e ícone de link externo, removendo a necessidade de página intermediária com iframe.
- [x] Módulo OfficialGazette (Boletins/Diário Oficial do Município):
  - Criada migration `20261110142954_add_official_gazette` para a tabela `official_gazette` com índices por data de publicação e título.
  - Implementado CASL Ability: leitura pública liberada para todos; criação, edição e remoção restritas exclusivamente às roles `ADMIN` e `PUBLISHER`.
  - Criados DTOs com validações e Swagger (`CreateOfficialGazetteDto`, `UpdateOfficialGazetteDto`, `QueryOfficialGazetteDto`).
  - Implementados endpoints no `OfficialGazetteController`:
    - `GET /official-gazette`: endpoint público sem autenticação para consulta com paginação e filtros (ano, mês, edição, busca e período).
    - `GET /official-gazette/admin`: endpoint administrativo protegido (`SessionGuard` + `PoliciesGuard`) com metadados de auditoria (`createdBy` e `updatedBy`).
    - `GET /official-gazette/:id`: consulta detalhada de uma edição específica por ID.
    - `POST /official-gazette`: cadastro de edição vinculando o usuário criador (ADMIN ou PUBLISHER).
    - `PATCH /official-gazette/:id`: edição do boletim vinculando o usuário editor (ADMIN ou PUBLISHER).
    - `DELETE /official-gazette/:id`: exclusão permanente de edição (ADMIN ou PUBLISHER).
  - Integrado ao `AuditInterceptor` para registro automático de mutações na fila BullMQ.
- [x] Interface Administrativa do Boletim Oficial (MVVM):
  - **Service**: criado `OfficialGazetteService` em `frontend/app/service/official-gazette.service.ts` com métodos de listagem administrativa/pública, busca por ID, criação, edição e exclusão.
  - **ViewModel**: criado `useOfficialGazetteViewModel` em `frontend/app/viewmodel/official-gazette.viewmodel.tsx` gerenciando estados do TanStack Table, React Query (queries e mutações com feedback via sonner toast), filtros de ano e busca, controle de modais e exclusão.
  - **Component**: criado `OfficialGazetteManager` em `frontend/components/official-gazette-manager.tsx` nos mesmos moldes de Serviços e Pop-ups, com toolbar de filtros e paginação, tabela com badges de edição e link do PDF, modal de criação/edição com suporte ao `MediaPickerModal`, e `AlertDialog` de confirmação para exclusão.
  - **Page**: criada página em `frontend/app/(pages)/(protected)/administrator/boletim-oficial/page.tsx` integrando o `PainelHeader` com o componente visual.
