FEAT: Adicionar função de deleção em massa no media-upload-modal.

TODO: (Users Manager) - Adicionar função de gerenciamento de usuários. Adicionar filtros de busca e ordenação. Apenas usuários gestores podem criar, editar e excluir usuários. Demais usuários podem gerenciar apenas seu próprio usuário.

TODO: (Site Infos Manager) - Adicionar função de gerenciamento de informações do site na área administrativa. Deve conter informações como telefones úteis, endereços dos prédios públicos, informações de contato geral, composição da equipe de governo, secretarias e suas funções, etc. Além disso deve ser possível adicionar metadados do site como título, descrição, palavras-chave, etc.

TODO: (Theme Manager) - Adicionar função de gerenciamento de temas na área administrativa. Deve conter informações como nome, descrição, cores, fontes, etc. Acessível apenas para usuários administradores.

TODO: (Relatórios) - Adicionar relatórios de estatísticas do site. Deve conter informações como número de acessos por página, tempo médio de permanência, número de visitantes únicos, etc.

TODO: (API Documentation) - Adicionar documentação da API na área administrativa.

TODO: (Logs Viewer) - Adicionar função de logs. Apenas usuário administrador pode visualizar logs. Deve contér informações de toda a atividade dos usuários no sistema. Implementar a auditoria de aplicação primeiro (interceptor + AuditService + BullMQ para não bloquear request) — funciona hoje, sem Kafka/Debezium. Quando a infraestrutura de busca (CDC + Kafka) estiver rodando, adicionar o segundo consumer Kafka que enriquece a auditoria com before/after e cobre alterações fora do fluxo.

FIX: reordenação de itens de destaque não funciona.

FEAT: Adicionar função de busca global no site.

TODO: (Notícias) - Adicionar função de busca na lista de notícias. - Adicionar filtros de busca e ordenação. - Adicionar opção de buscar por data. - Adicionar funções de impressão, compartilhamento e e-mail na página da notícia. - Adicionar paginação na lista de notícias. - Adicionar função de comentários. - Adicionar opção de curtir e descurtir. - Adicionar opção de compartilhar nas redes sociais. - Adicionar contador de visualizações. - Adicionar tratamento de imagens para posicionamento de capa.

TODO: (Search Engine) - Criar um motor de busca que indexe todo o conteúdo do site. A barra de pesquisa já está funcionando, falta criar um índice pg_trgm nos campos title e text. Será necessário criar uma coluna com o texto do corpo em formato de string sem formatação para poder criar um índice pg_trgm nela.

TODO: Adicionar verificação de slug ao criar novo artigo, se já houver algum artigo com mesmo slug, adicionar um número ao final do slug, ex: "noticia-1".

FEAT: Botão de visualizar matéria dentro da página de artigos
