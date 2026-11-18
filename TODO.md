# TO-DO 2.0: Pré-Produção e Correções Residuais

## FASE 1: Quick Wins (Bloqueadores de Produção)

Correções rápidas que impedem o deploy imediato ou representam falhas críticas de segurança.

### Patch Crítico de Dependências (Next.js e Sharp):

[x] Atualizar next e eslint-config-next para >= 16.4.1 (mitiga RCEs críticos).
[x] Atualizar sharp para ^0.35.5 (mitiga CVEs de processamento de imagem).
[x] Atualizar prisma e @prisma/client para >= 7.10.1.

### Sanar Vazamentos e Dependências Órfãs:

[x] Mover shadcn de dependencies para devDependencies no frontend (reduz 118 alertas).
[x] Remover fluent-ffmpeg do backend.
[x] Adicionar ioredis explicitamente nas dependencies do backend.

### Proteger o Bull Board (/admin/queues):

[x] Adicionar middleware Express exigindo ADMIN (o PoliciesGuard não cobre rotas Express puras).

### Corrigir Vazamento de PII em GET /popups:

[x] Alterar PopupsService.findAll() de user: true para select: { name: true, avatar: true }.

### Ajustar Infraestrutura Docker (Linux e Rede):

[x] Adicionar app.set('trust proxy', 1); no main.ts (evita quebra de cookies HTTPS e bloqueio global do Throttler).
[x] Renomear backend/dockerfile para Dockerfile (case-sensitive no Linux).
[x] Corrigir o healthcheck do MinIO (curl -f http://localhost:9000/minio/health/live).
[x] Rodar docker compose down && docker compose up -d --build para aplicar o isolamento de portas e senha do Redis.

## FASE 2: Hardening e Segurança Contínua

Medidas para blindar o sistema contra ataques e garantir integridade dos dados.

### Validação de Magic Bytes em Uploads:

[x] Validar os primeiros bytes dos arquivos em uploadDocument e uploadVideo antes de retornar 202 Accepted.

### Proteção CSRF:

[x] Implementar csrf-csrf (Double Submit Cookie) para rotas de mutação (POST/PATCH/DELETE).

### Autenticação Reforçada:

[x] Adicionar suporte a Login Único Gov.br (OAuth2/OIDC) _(Descontinuado no TO-DO 3.0 por decisão de escopo: dashboard exclusivo para servidores)._
[x] Implementar 2FA/TOTP (otplib) obrigatório para ADMIN e PUBLISHER _(Adiado para pós-lançamento no TO-DO 3.0)._

### Tipagem CASL:

[x] Remover 'Admin' as any e adicionar o Subject formal no casl-ability.factory.ts.

## FASE 3: Débitos Arquiteturais e Refatoração

Melhorias para deixar o código mais limpo e evitar problemas futuros de manutenção.

### Eliminar Editores Redundantes:

[x] Remover o TipTap do projeto (ou o Lexical), consolidando o editor.

### Eliminar Hardcodes de Menu:

[x] Remover UUIDs fixos do header.tsx e footer.tsx e consultar os menus via GET /menus/by/location/....

### Eliminar Hardcode do Umami:

[x] Trocar a URL fixa http://localhost:3002 e o website-id no layout.tsx por variáveis NEXT*PUBLIC_UMAMI*\*.

### Unificar e Automatizar o Full-Text Search:

[x] Mover o fulltext-search.sql para uma migration oficial do Prisma.
[x] Criar o endpoint global /search (ocupando o diretório backend/src/search).

### Finalizar Pipeline CI/CD:

[x] Configurar GitHub Actions/GitLab CI para rodar tsc --noEmit, vitest, playwright, npm audit e varredura de containers com Trivy.
[x] Configurar Husky + lint-staged localmente.

## FASE 4: Evolução e Funcionalidades (Pós-Lançamento)

Melhorias de produto e auditoria para o futuro.

### Indexação de PDFs do Diário Oficial:

[x] Extrair texto dos PDFs no MediaProcessor (usando pdf-parse) e salvar em coluna tsvector para busca dentro do conteúdo.

### Streaming de Vídeo (HLS):

[x] Usar o FFmpeg nativo para gerar versões H.264/MP4 ou .m3u8 em background.

### Acessibilidade e Testes:

[x] Integrar @axe-core/playwright no E2E para validar contraste e ARIA.
[x] Criar a suíte de testes unitários Vitest no frontend (./test/\*_/_.test.{ts,tsx}).

---

# TO-DO 3.0: Redefinição de Auth, Ativação de Conta, CSRF Estrito e Correções P0/P1

## NÍVEL 1: Remoção de Gov.br/2FA e Sistema de Ativação de Conta por E-mail

### Remoção de Funcionalidades Fora de Escopo / Pós-Lançamento:

[x] Remover Login com Gov.br (`govbr-oauth.service.ts`, rotas `/auth/govbr/*` e provider).
[x] Remover 2FA/TOTP por ora (`totp.service.ts`, rotas `/auth/2fa/*` e pacote `otplib`), mantendo registrado como função pós-lançamento do site teste.

### Sistema de Ativação de Conta com Definição de Senha:

[x] Adicionar campos de token de ativação no model `User` (`activationTokenHash`, `activationTokenExpiresAt`, `activationTokenMaxUses`, `activationTokenUsedCount`) com migration Prisma.
[x] Criar `MailService` para disparo do e-mail de ativação com link de definição de senha.
[x] Na criação de usuário por `ADMIN`, criar conta inativa (`active: false`), gerar link com prazo de expiração e limite de 1 uso e enviar por e-mail; disponibilizar endpoint `POST /user/:id/resend-activation` e ação na tabela de usuários.
[x] Implementar `GET /auth/activate-account/validate` e `POST /auth/activate-account` garantindo uso único e expiração, exibindo mensagem orientando contato com o Administrador caso expirado/usado, e ativando o usuário após definir a senha.
[x] Bloquear login e hidratação de sessão de usuários com `active: false` (`AuthService.validateUser` e `SessionSerializer.deserializeUser`).
[x] Criar página pública `/ativar-conta` no frontend para definição de senha e feedback de link expirado/usado.

## NÍVEL 2: Proteção CSRF Estrita Full-Stack

[x] Implementar `csrfFetch` em `frontend/lib/csrf.ts` garantindo cookie/header `X-CSRF-Token` automático.
[x] Atualizar todos os serviços de mutação do frontend (`frontend/app/service/*.ts`) para utilizar `csrfFetch`.
[x] Remover o modo permissivo do `csrfProtectionMiddleware` no backend, exigindo CSRF válido em todas as mutações.

## NÍVEL 3: Correções Críticas P0/P1 da Auditoria Pós-TO-DO 2.0

### Sanitização XSS (Frontend):

[x] Sanitizar HTML em `puck.config.tsx` (blocos `Texto` e `Embed`) e em `dynamic-icon.tsx`.

### Correção de Bugs de Rota e Schema (P0):

[x] Corrigir Route Shadowing em `MediaController` (`@Get('images'|'documents'|'videos')` antes de `@Get(':id')`) e `StoryController` (`@Get('items')` antes de `@Get(':id')`).
[x] Corrigir divergência `bannerId` → `galleryId` em `CreateGalleryMediaDto` e `GalleryMediaService`.

### Segurança, LGPD e Paginação (P1):

[x] Remover `email: true` de `GalleriesService.findAll` e `findOne`.
[x] Manter `userId` imutável em `ServicesService.update`.
[x] Validar path traversal (`..`) e existência/status `ready` em `GET /media/presigned/*path`.
[x] Aplicar limites seguros (`page >= 1`, `limit <= 100`) em `ServicesService.findAllPublic` e `StoryController.findAllStories`.

## BACKLOG PÓS-LANÇAMENTO (Site Teste)

- Implantar 2FA/TOTP persistido em banco para ADMIN e PUBLISHER *(fora do TO-DO 4.0)*;
- Vincular `Media.extractedText` → `OfficialGazette.contentText` via evento `media.ready`;
- Aplicar `pnpm.overrides` no `frontend/package.json` e executar Playwright E2E completo contra servidor no CI.

---

# TO-DO 4.0: Varredura LGPD, Separação Admin vs Public e Fluxo de Aprovação MANAGER (Sem 2FA/TOTP)

## NÍVEL 1: Varredura Completa de Vazamentos de E-mail e Papel de Servidores (LGPD)

[x] Bloquear exposição de `email`, `role`, `phone`, `username` e `lastLogin` de `user`/`author`/`editor`/`createdBy`/`updatedBy` em todas as consultas públicas e adicionar sanitização contextual para rotas públicas no `ExcludePasswordInterceptor`.
[x] Corrigir especificamente `GET /official-gazette/:id` para não expor `email` nem `role` de `createdBy`/`updatedBy`, criando `GET /official-gazette/admin/:id` autenticado.

## NÍVEL 2: Separação Completa Admin vs Public em Todos os Módulos

[x] Separar rotas públicas (filtrando `active: true`, `published: true` / `status: 'publicado'`, `deletedAt: null` e janelas de publicação/expiração) e rotas `/admin` (protegidas por `SessionGuard + PoliciesGuard + @CheckPolicies`) em `Popups`, `Galleries`, `GalleryMedia`, `Story`, `Organizations`, `Services`, `Menus`, `MenuItem`, `Pages`, `Media` e `Analytics`.
[x] Tornar `userId` imutável em `PopupsService.update` e remover fallback `createPageDto.userId` em `PagesService.create`.
[x] Sanitizar `page`/`limit` em `MediaController.listFiles` (`GET /media/list/*prefix`).
[x] Atualizar os services e viewmodels do frontend (`popups.service.ts`, `gallery.service.ts`, `organization.service.ts`, `stories.service.ts`, `gallery.viewmodal.tsx`) para consumir as rotas `/admin` no painel e corrigir `/story/item/:id` → `/story/items/:id`.

## NÍVEL 3: Role MANAGER, Fluxo de Aprovação (USER → MANAGER) e Soft Delete

[x] Adicionar `Action.Approve` e `Action.SoftDelete` e implementar as regras de `UserRole.MANAGER` e `UserRole.USER` no `CaslAbilityFactory` (proibindo `Action.Delete` físico e gestão de `User`/`Admin` ao `MANAGER`, e protegendo `AuthController.register` com `'Admin'`).
[x] Adicionar campos de workflow e soft delete (`workflowStatus`, `pendingAction`, `approvedById`, `approvedAt`, `deletedAt`, e `active` em `Services`) no `schema.prisma` com migration oficial.
[x] Implementar submissão sujeita a aprovação (`USER`), aprovação/rejeição (`MANAGER`/`ADMIN` via `PATCH /:id/approve` e `PATCH /:id/reject`) e exclusão apenas via Soft Delete para `MANAGER` em `Pages`, `Articles`, `Popups`, `Galleries` e `Services`.

## Orientações Para refatoração

- Fazer os testes na ferramenta após concluir as alterações;
- Se os testes apresentarem 80% ou mais de aproveitamento, realizar commit;
- Se os testes apresentarem menos de 80% de aproveitamento, refazer os testes ou ajustar o código até atingir 80%;
- Se o commit for realizado, marcar etapa como concluída;
- Se o commit não for realizado, notifique e registre o motivo.
