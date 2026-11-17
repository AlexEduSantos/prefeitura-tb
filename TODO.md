TO-DO 2.0: Pré-Produção e Correções Residuais

# FASE 1: Quick Wins (Bloqueadores de Produção)

Correções rápidas que impedem o deploy imediato ou representam falhas críticas de segurança.

## Patch Crítico de Dependências (Next.js e Sharp):

[x] Atualizar next e eslint-config-next para >= 16.4.1 (mitiga RCEs críticos).
[x] Atualizar sharp para ^0.35.5 (mitiga CVEs de processamento de imagem).
[x] Atualizar prisma e @prisma/client para >= 7.10.1.

## Sanar Vazamentos e Dependências Órfãs:

[x] Mover shadcn de dependencies para devDependencies no frontend (reduz 118 alertas).
[x] Remover fluent-ffmpeg do backend.
[x] Adicionar ioredis explicitamente nas dependencies do backend.

## Proteger o Bull Board (/admin/queues):

[x] Adicionar middleware Express exigindo ADMIN (o PoliciesGuard não cobre rotas Express puras).

## Corrigir Vazamento de PII em GET /popups:

[x] Alterar PopupsService.findAll() de user: true para select: { name: true, avatar: true }.

## Ajustar Infraestrutura Docker (Linux e Rede):

[x] Adicionar app.set('trust proxy', 1); no main.ts (evita quebra de cookies HTTPS e bloqueio global do Throttler).
[x] Renomear backend/dockerfile para Dockerfile (case-sensitive no Linux).
[x] Corrigir o healthcheck do MinIO (curl -f http://localhost:9000/minio/health/live).
[x] Rodar docker compose down && docker compose up -d --build para aplicar o isolamento de portas e senha do Redis.

# FASE 2: Hardening e Segurança Contínua

Medidas para blindar o sistema contra ataques e garantir integridade dos dados.

## Validação de Magic Bytes em Uploads:

[x] Validar os primeiros bytes dos arquivos em uploadDocument e uploadVideo antes de retornar 202 Accepted.

## Proteção CSRF:

[x] Implementar csrf-csrf (Double Submit Cookie) para rotas de mutação (POST/PATCH/DELETE).

## Autenticação Reforçada:

[x] Adicionar suporte a Login Único Gov.br (OAuth2/OIDC).
[x] Implementar 2FA/TOTP (otplib) obrigatório para ADMIN e PUBLISHER.

## Tipagem CASL:

[x] Remover 'Admin' as any e adicionar o Subject formal no casl-ability.factory.ts.

# FASE 3: Débitos Arquiteturais e Refatoração

Melhorias para deixar o código mais limpo e evitar problemas futuros de manutenção.

## Eliminar Editores Redundantes:

[] Remover o TipTap do projeto (ou o Lexical), consolidando o editor.

## Eliminar Hardcodes de Menu:

[] Remover UUIDs fixos do header.tsx e footer.tsx e consultar os menus via GET /menus/by/location/....

## Eliminar Hardcode do Umami:

[] Trocar a URL fixa http://localhost:3002 e o website-id no layout.tsx por variáveis NEXT*PUBLIC_UMAMI*\*.

## Unificar e Automatizar o Full-Text Search:

[] Mover o fulltext-search.sql para uma migration oficial do Prisma.
[] Criar o endpoint global /search (ocupando o diretório backend/src/search).

## Finalizar Pipeline CI/CD:

[] Configurar GitHub Actions/GitLab CI para rodar tsc --noEmit, vitest, playwright, npm audit e varredura de containers com Trivy.
[] Configurar Husky + lint-staged localmente.

# FASE 4: Evolução e Funcionalidades (Pós-Lançamento)

Melhorias de produto e auditoria para o futuro.

## Indexação de PDFs do Diário Oficial:

[] Extrair texto dos PDFs no MediaProcessor (usando pdf-parse) e salvar em coluna tsvector para busca dentro do conteúdo.

## Streaming de Vídeo (HLS):

[] Usar o FFmpeg nativo para gerar versões H.264/MP4 ou .m3u8 em background.

## Acessibilidade e Testes:

[] Integrar @axe-core/playwright no E2E para validar contraste e ARIA.
[] Criar a suíte de testes unitários Vitest no frontend (./test/\*_/_.test.{ts,tsx}).

# Orientações Para refatoração

- Fazer os testes na ferramenta após concluir as alterações;
- Se os testes apresentarem 80% ou mais de aproveitamento, realizar commit;
- Se os testes apresentarem menos de 80% de aproveitamento, refazer os testes ou ajustar o código até atingir 80%;
- Se o commit for realizado, marcar etapa como concluída;
- Se o commit não for realizado, notifique e registre o motivo.
