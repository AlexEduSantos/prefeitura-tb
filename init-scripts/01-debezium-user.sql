-- init-scripts/01-debezium-user.sql
CREATE USER debezium WITH REPLICATION LOGIN PASSWORD 'debezium';

-- Concede acesso de leitura em todas as tabelas existentes
GRANT USAGE ON SCHEMA public TO debezium;

GRANT SELECT ON ALL TABLES IN SCHEMA public TO debezium;

-- Garante que futuras tabelas também sejam acessíveis
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT
SELECT ON TABLES TO debezium;

GRANT CREATE ON DATABASE pmtb TO debezium;