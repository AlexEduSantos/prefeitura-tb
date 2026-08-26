// src/common/utils/file-type-detector.ts
export interface FileTypeResult {
  ext: string;
  mime: string;
}

/**
 * Detecta o tipo de arquivo a partir do buffer usando bytes mágicos.
 * Retorna { ext, mime } ou null se não reconhecido.
 */
export function detectFileTypeFromBuffer(
  buffer: Buffer,
): FileTypeResult | null {
  // Verifica se é imagem
  // JPEG
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return { ext: 'jpg', mime: 'image/jpeg' };
  }
  // PNG
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { ext: 'png', mime: 'image/png' };
  }
  // GIF
  if (
    buffer.length >= 6 &&
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38 &&
    (buffer[4] === 0x37 || buffer[4] === 0x39) &&
    buffer[5] === 0x61
  ) {
    return { ext: 'gif', mime: 'image/gif' };
  }
  // WebP
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { ext: 'webp', mime: 'image/webp' };
  }
  // BMP
  if (buffer.length >= 2 && buffer[0] === 0x42 && buffer[1] === 0x4d) {
    return { ext: 'bmp', mime: 'image/bmp' };
  }

  // Documentos
  // PDF
  if (
    buffer.length >= 4 &&
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  ) {
    return { ext: 'pdf', mime: 'application/pdf' };
  }
  // DOC (Microsoft Word 97-2003)
  if (
    buffer.length >= 8 &&
    buffer[0] === 0xd0 &&
    buffer[1] === 0xcf &&
    buffer[2] === 0x11 &&
    buffer[3] === 0xe0 &&
    buffer[4] === 0xa1 &&
    buffer[5] === 0xb1 &&
    buffer[6] === 0x1a &&
    buffer[7] === 0xe1
  ) {
    return { ext: 'doc', mime: 'application/msword' };
  }
  // DOCX / XLSX / PPTX (Office Open XML) - verifica ZIP e depois [Content_Types].xml
  if (
    buffer.length >= 4 &&
    buffer[0] === 0x50 &&
    buffer[1] === 0x4b &&
    buffer[2] === 0x03 &&
    buffer[3] === 0x04
  ) {
    // Podemos tentar identificar pelo nome do arquivo, mas vamos retornar um genérico
    // e o front-end pode usar a extensão original. Vamos retornar como zip.
    // Mas para diferenciar, podemos verificar se há '[Content_Types].xml' no zip.
    // Para simplificar, retornamos um tipo genérico e depois validamos pela extensão.
    // Vamos retornar como 'docx' por padrão, mas recomendamos usar a extensão do nome do arquivo.
    // Uma abordagem mais robusta seria ler o conteúdo do ZIP, mas aqui vamos apenas retornar 'zip'.
    // Vamos retornar null para esses casos, e o código usará a extensão original.
    return null; // ou retornar { ext: 'zip', mime: 'application/zip' }
  }

  // Vídeos
  // MP4
  if (
    buffer.length >= 12 &&
    buffer[4] === 0x66 &&
    buffer[5] === 0x74 &&
    buffer[6] === 0x79 &&
    buffer[7] === 0x70 &&
    buffer[8] === 0x69 &&
    buffer[9] === 0x73 &&
    buffer[10] === 0x6f &&
    buffer[11] === 0x6d
  ) {
    return { ext: 'mp4', mime: 'video/mp4' };
  }
  // WebM
  if (
    buffer.length >= 4 &&
    buffer[0] === 0x1a &&
    buffer[1] === 0x45 &&
    buffer[2] === 0xdf &&
    buffer[3] === 0xa3
  ) {
    return { ext: 'webm', mime: 'video/webm' };
  }
  // Ogg (Theora/Vorbis)
  if (
    buffer.length >= 4 &&
    buffer[0] === 0x4f &&
    buffer[1] === 0x67 &&
    buffer[2] === 0x67 &&
    buffer[3] === 0x53
  ) {
    return { ext: 'ogg', mime: 'video/ogg' };
  }
  // MKV (matroska)
  if (
    buffer.length >= 4 &&
    buffer[0] === 0x1a &&
    buffer[1] === 0x45 &&
    buffer[2] === 0xdf &&
    buffer[3] === 0xa3
  ) {
    // Mesma assinatura do WebM? Na verdade WebM é um subset do Matroska.
    // Vamos deixar como webm ou verificar mais adiante.
    return { ext: 'mkv', mime: 'video/x-matroska' };
  }

  // Outros: txt, etc.
  return null;
}

/**
 * Obtém o MIME type a partir da extensão usando mime-types.
 * Se a extensão não for reconhecida, retorna 'application/octet-stream'.
 */
export function getMimeTypeFromExtension(ext: string): string {
  const mime = require('mime-types').lookup(ext);
  return mime || 'application/octet-stream';
}
