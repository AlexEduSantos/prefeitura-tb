const DANGEROUS_BLOCK_TAGS =
  /<\s*(script|object|embed|applet|meta|base|link|style|form|textarea|input|select|button)\b[^>]*>[\s\S]*?<\/\s*\1\s*>|<\s*(script|object|embed|applet|meta|base|link|style|form|textarea|input|select|button)\b[^>]*\/?>/gi;

const INLINE_EVENT_HANDLERS =
  /\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi;

const DANGEROUS_URI_SCHEME =
  /(\b(?:href|src|action|formaction|xlink:href|poster|data)\s*=\s*)(["'])\s*(?:javascript|vbscript|data\s*:\s*text\/html)[\s\S]*?\2/gi;

const DANGEROUS_URI_UNQUOTED =
  /(\b(?:href|src|action|formaction|xlink:href|poster|data)\s*=\s*)(?:javascript|vbscript|data\s*:\s*text\/html)[^\s>]*/gi;

function stripNullAndControlChars(input: string): string {
  return input.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
}

/**
 * Sanitiza HTML gerado por editor rich-text (Puck Texto) antes de dangerouslySetInnerHTML.
 */
export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== "string") return "";

  let cleaned = stripNullAndControlChars(html);
  // Remove iframes dentro de blocos de texto simples (iframes possuem bloco dedicado)
  cleaned = cleaned.replace(
    /<\s*iframe\b[^>]*>[\s\S]*?<\/\s*iframe\s*>|<\s*iframe\b[^>]*\/?>/gi,
    "",
  );
  cleaned = cleaned.replace(DANGEROUS_BLOCK_TAGS, "");
  cleaned = cleaned.replace(INLINE_EVENT_HANDLERS, "");
  cleaned = cleaned.replace(DANGEROUS_URI_SCHEME, '$1"#"');
  cleaned = cleaned.replace(DANGEROUS_URI_UNQUOTED, "$1#");
  return cleaned;
}

/**
 * Sanitiza código de Embed mantendo iframes HTTPS seguros com sandbox aplicado.
 */
export function sanitizeEmbedHtml(code: string): string {
  if (!code || typeof code !== "string") return "";

  let cleaned = stripNullAndControlChars(code);
  cleaned = cleaned.replace(DANGEROUS_BLOCK_TAGS, "");
  cleaned = cleaned.replace(INLINE_EVENT_HANDLERS, "");
  // Remove srcdoc para impedir execução de HTML arbitrário em iframe same-origin
  cleaned = cleaned.replace(
    /\s+srcdoc\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi,
    "",
  );
  cleaned = cleaned.replace(DANGEROUS_URI_SCHEME, '$1"about:blank"');
  cleaned = cleaned.replace(DANGEROUS_URI_UNQUOTED, "$1about:blank");

  // Garante que iframes usem apenas https:// (ou relative '/') e tenham atributo sandbox
  cleaned = cleaned.replace(/<iframe\b([^>]*)>/gi, (_match, attrs: string) => {
    const srcMatch = attrs.match(/\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
    const rawSrc = (srcMatch?.[1] || srcMatch?.[2] || srcMatch?.[3] || "").trim();
    const isSafeUrl =
      rawSrc.startsWith("https://") ||
      (rawSrc.startsWith("/") && !rawSrc.startsWith("//"));

    let safeAttrs = attrs;
    if (!isSafeUrl) {
      if (srcMatch) {
        safeAttrs = safeAttrs.replace(
          /\bsrc\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/i,
          'src="about:blank"',
        );
      } else {
        safeAttrs += ' src="about:blank"';
      }
    }

    if (!/\bsandbox\s*=/i.test(safeAttrs)) {
      safeAttrs +=
        ' sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"';
    }

    return `<iframe${safeAttrs}>`;
  });

  return cleaned;
}

/**
 * Sanitiza SVGs externos antes de injeção no DOM via DynamicIcon.
 */
export function sanitizeSvg(svg: string): string {
  if (!svg || typeof svg !== "string" || !/<svg\b/i.test(svg)) {
    return "";
  }

  let cleaned = stripNullAndControlChars(svg);
  cleaned = cleaned.replace(
    /<\s*(script|foreignObject|iframe|object|embed|style)\b[^>]*>[\s\S]*?<\/\s*\1\s*>|<\s*(script|foreignObject|iframe|object|embed|style)\b[^>]*\/?>/gi,
    "",
  );
  cleaned = cleaned.replace(INLINE_EVENT_HANDLERS, "");
  cleaned = cleaned.replace(DANGEROUS_URI_SCHEME, '$1"#"');
  cleaned = cleaned.replace(DANGEROUS_URI_UNQUOTED, "$1#");
  // Mantém a limpeza original de estilos fixos para estilização via Tailwind
  cleaned = cleaned
    .replace(/class="[^"]*"/gi, "")
    .replace(/fill="#[^"]*"/gi, "");

  return cleaned;
}
