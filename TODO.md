TO-DO:

# Refatoração e Blindagem do Portal

## FASE 1: Segurança e Correções Críticas

Estas são as falhas mais graves. Elas devem ser resolvidas antes de qualquer novo desenvolvimento.

- [x] Restringir a rota de registro (/auth/register):
- [x] Adicionar SessionGuard e PoliciesGuard para que apenas Administradores possam criar novos usuários.
- [x] Bloquear Mass Assignment (Prisma):
- [x] Adicionar whitelist: true, forbidNonWhitelisted: true e transform: true no ValidationPipe global no main.ts.
- [x] Auditar serviços (User, Pages, Popups) para garantir que não estão repassando o ...dto cru para o data do Prisma, ou que os DTOs estão bem definidos.
- [x] Proteger Variáveis de Ambiente:
- [x] Remover o fallback 'super-secret-key' do express-session.
- [x] Exigir que SESSION_SECRET seja uma chave forte de 64 caracteres no .env.
- [x] Mover chaves expostas (OBSERVE_APP_SECRET, UMAMI_API_KEY, S3_SECRET_KEY) do docker-compose.yml e .env para um gerenciador de segredos ou variáveis do servidor.
- [x] Proteger Endpoints Expostos (Admin e Rascunhos):
- [x] Sanitizar Retorno de Dados Pessoais (LGPD):
- [x] Nas queries públicas de ArticlesService e PagesService, alterar include: { author: true } para select: { name: true, avatar: true } (remover e-mail, username e role).
- [x] Prevenir Stored XSS em Mídias:
- [x] Adicionar X-Content-Type-Options: nosniff e Content-Security-Policy: sandbox no endpoint GET /media/file/path.

## FASE 2: Hardening e Infraestrutura

Itens para evitar abusos e preparar o servidor para produção.

[ ] Configurar cookies com httpOnly: true, sameSite: 'lax' e secure: true (em produção).
[ ] Corrigir o logout para destruir a sessão no banco (req.session.destroy()) e limpar o cookie.
[ ] Implementar Rate Limiting (@nestjs/throttler) para o /auth/login (ex: 5 tentativas por minuto).
[ ] Correção de Injeção de Coluna:
[ ] Criar uma allowlist de campos permitidos no MenuController (GET /menus/by/:field/:value).
[ ] Isolamento de Rede Docker:
[ ] Remover o mapeamento externo de portas do PostgreSQL, Redis e MinIO no docker-compose.yml.
[ ] Adicionar senha ao Redis.
[ ] Limpeza de Dependências (Supply Chain):
[ ] Remover @ffmpeg-installer/ffmpeg e instalar o FFmpeg via apk add ffmpeg no Dockerfile.
[ ] Remover do package.json backend: @nestjs/elasticsearch, kafkajs, @nestjs/microservices, @nestjs/websockets.
[ ] Remover do package.json frontend: socket.io-client.
[ ] Correção de Upload de Vídeo (OOM):
[ ] Alterar o FileInterceptor para usar diskStorage em vez do MemoryStorage na rota POST /media/video.
[ ] Adicionar Helmet e Validação de Env:
[ ] Instalar e configurar o helmet no NestJS.
[ ] Validar as variáveis de ambiente com Zod na inicialização do backend.

## FASE 3: Débitos Arquiteturais e Performance

Melhorias para garantir que o sistema não fique lento conforme a prefeitura publica mais conteúdo.

[ ] Corrigir Acoplamento MinIO/Backend:
[ ] Remover o volume compartilhado bucket_data entre o MinIO e o backend no docker-compose.
[ ] Forçar todo acesso a arquivos a passar pela API S3 ou URLs pré-assinadas.
[ ] Implementar Paginação Server-Side:
[ ] Adicionar skip e take obrigatórios nas rotas GET /articles/admin, GET /pages e GET /media.
[ ] Adicionar Cache com Redis:
[ ] Implementar cache para rotas de leitura frequente (GET /menus, GET /settings, GET /pages/public/\*) com invalidação nas mutações.

## FASE 4: Novas Funcionalidades e Observabilidade

Ferramentas para melhorar a operação e a experiência do cidadão.

[ ] Monitoramento e Operação:
[ ] Instalar e configurar o Bull Board no NestJS para monitorar as filas de mídia visualmente.
[ ] Configurar o Sentry (ou OpenTelemetry) para rastreamento de erros no backend e frontend.
[ ] Criar rotina de backup automatizado (dump do PostgreSQL + sincronização do MinIO).
[ ] Acessibilidade e Qualidade (eMAG/WCAG):
[ ] Integrar o widget VLibras no portal público.
[ ] Criar barra de acessibilidade (alto contraste, controle de fonte).
[ ] Implementar atalhos de teclado (Alt+1, Alt+2, etc).
[ ] Adicionar Playwright para testes E2E no frontend.
[ ] Melhorias de Busca:
[ ] Implementar o Full-Text Search (tsvector) no PostgreSQL para as notícias e Diário Oficial (para buscar dentro do texto).
[ ] CDN / Proxy Reverso:
[ ] Configurar Cloudflare (ou Nginx/Traefik) para cache de borda e WAF na frente do frontend.

# Orientações Para refatoração

- Fazer os testes na ferramenta após concluir as alterações;
- Se os testes apresentarem 80% ou mais de aproveitamento, realizar commit;
- Se os testes apresentarem menos de 80% de aproveitamento, refazer os testes ou ajustar o código até atingir 80%;
- Se o commit for realizado, marcar etapa como concluída;
- Se o commit não for realizado, notifique e registre o motivo.
