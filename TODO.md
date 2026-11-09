FEAT: Adicionar função de deleção em massa no media-upload-modal.

TODO: (Relatórios) - Adicionar relatórios de estatísticas do site. Deve conter informações como número de acessos por página, tempo médio de permanência, número de visitantes únicos, etc.

TODO: (API Documentation) - Adicionar documentação da API na área administrativa.

TODO: (Logs Viewer) - Adicionar função de logs. Apenas usuário administrador pode visualizar logs. Deve conter informações de toda a atividade dos usuários no sistema. Implementar a auditoria de aplicação primeiro (interceptor + AuditService + BullMQ para não bloquear request) — funciona hoje, sem Kafka/Debezium. Quando a infraestrutura de busca (CDC + Kafka) estiver rodando, adicionar o segundo consumer Kafka que enriquece a auditoria com before/after e cobre alterações fora do fluxo.

FEAT: Botão de visualizar matéria dentro da página de artigos

TODO: aviso de tamanho de imagem selecionada, se não for compatível com o local aparece um aviso antes de salvar.

TODO: Criar dentro do modal de seleção de galerias um botão para criação de galerias.
