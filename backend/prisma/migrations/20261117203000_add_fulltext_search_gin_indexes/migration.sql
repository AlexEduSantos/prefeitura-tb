-- Índices GIN de Full-Text Search (tsvector em português) para Notícias e Diário Oficial

CREATE INDEX IF NOT EXISTS idx_article_fulltext_pt
ON "article"
USING GIN (
  to_tsvector(
    'portuguese',
    coalesce("title", '') || ' ' || coalesce("headline", '') || ' ' || coalesce("body"::text, '')
  )
);

CREATE INDEX IF NOT EXISTS idx_official_gazette_fulltext_pt
ON "official_gazette"
USING GIN (
  to_tsvector(
    'portuguese',
    coalesce("title", '') || ' ' || coalesce("description", '') || ' ' || coalesce("edition", '')
  )
);
