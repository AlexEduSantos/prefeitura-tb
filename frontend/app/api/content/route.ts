import { NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

// Caminho para o arquivo de dados, fora do diretório public/
const DATA_FILE = path.join(process.cwd(), "data", "content.json");

/**
 * GET /api/content
 * Retorna o estado serializado do editor salvo no arquivo JSON.
 */
export async function GET() {
  try {
    const raw = await readFile(DATA_FILE, "utf-8");
    const data = JSON.parse(raw);
    return NextResponse.json(data);
  } catch {
    // Retorna objeto vazio se o arquivo ainda não existir ou estiver inválido
    return NextResponse.json({});
  }
}

/**
 * POST /api/content
 * Recebe o estado serializado do editor e persiste no arquivo JSON.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Garante que o diretório data/ existe antes de escrever
    await mkdir(path.dirname(DATA_FILE), { recursive: true });

    await writeFile(DATA_FILE, JSON.stringify(body, null, 2), "utf-8");

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[API/content] Erro ao salvar:", err);
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 },
    );
  }
}
