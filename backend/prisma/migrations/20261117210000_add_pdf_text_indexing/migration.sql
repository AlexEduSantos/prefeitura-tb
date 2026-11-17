-- Indexação Full-Text Search do conteúdo interno de PDFs (Mídia + Diário Oficial)

ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "extractedText" TEXT;
ALTER TABLE "official_gazette" ADD COLUMN IF NOT EXISTS "contentText" TEXT;

DROP INDEX IF EXISTS idx_official_gazette_fulltext_pt;
CREATE INDEX IF NOT EXISTS idx_official_gazette_fulltext_pt
ON "official_gazette"
USING GIN (
  to_tsvector(
    'portuguese',
    coalesce("title", '') || ' ' || coalesce("description", '') || ' ' || coalesce("edition", '') || ' ' || coalesce("contentText", '')
  )
);

CREATE INDEX IF NOT EXISTS idx_media_fulltext_pt
ON "media"
USING GIN (
  to_tsvector(
    'portuguese',
    coalesce("title", '') || ' ' || coalesce("description", '') || ' ' || coalesce("extractedText", '')
  )
);
