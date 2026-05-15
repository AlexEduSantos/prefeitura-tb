"use client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Editor } from "../app/modules/text-editor/components/Editor";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useState, useRef } from "react";
import { X, Tag } from "lucide-react";

// ---------------------------------------------------------------------------
// Dados de exemplo (substituir por chamadas de API futuramente)
// ---------------------------------------------------------------------------

const CATEGORIES = [
  { id: "esportes", label: "Secretaria de Esportes" },
  { id: "cultura", label: "Secretaria de Cultura" },
  { id: "governo", label: "Secretaria de Governo" },
  { id: "saude", label: "Secretaria de Saúde" },
  { id: "educacao", label: "Secretaria de Educação" },
  { id: "meio-ambiente", label: "Secretaria de Meio Ambiente" },
];

const ESTADOS = [
  { id: "rascunho", label: "Rascunho" },
  { id: "revisao", label: "Em Revisão" },
  { id: "publicado", label: "Publicado" },
  { id: "arquivado", label: "Arquivado" },
];

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

interface MateriaFormData {
  titulo: string;
  linhaFina: string;
  categoria: string;
  tags: string[];
  estado: string;
  destaque: boolean;
  dataCriacao: string;
  dataInicioPublicacao: string;
  dataFimPublicacao: string;
  // conteúdo do editor é lido via callback separado
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export default function MateriaForm() {
  // --- Visibilidade de campos opcionais ---
  const [hasLinhaFina, setHasLinhaFina] = useState(false);
  const [hasDataInicio, setHasDataInicio] = useState(false);
  const [hasDataFim, setHasDataFim] = useState(false);

  // --- Campos do formulário ---
  const [form, setForm] = useState<MateriaFormData>({
    titulo: "",
    linhaFina: "",
    categoria: "",
    tags: [],
    estado: "rascunho",
    destaque: false,
    dataCriacao: new Date().toISOString().slice(0, 16), // YYYY-MM-DDTHH:MM
    dataInicioPublicacao: "",
    dataFimPublicacao: "",
  });

  // --- Tag input ---
  const [tagInput, setTagInput] = useState("");

  // --- Ref para capturar o conteúdo do editor ---
  const editorContentRef = useRef<unknown>(null);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  function setField<K extends keyof MateriaFormData>(
    key: K,
    value: MateriaFormData[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function addTag() {
    const trimmed = tagInput.trim();
    if (!trimmed || form.tags.includes(trimmed)) return;
    setField("tags", [...form.tags, trimmed]);
    setTagInput("");
  }

  function removeTag(tag: string) {
    setField(
      "tags",
      form.tags.filter((t) => t !== tag),
    );
  }

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const output = {
      ...form,
      linhaFina: hasLinhaFina ? form.linhaFina : null,
      dataInicioPublicacao: hasDataInicio ? form.dataInicioPublicacao : null,
      dataFimPublicacao: hasDataFim ? form.dataFimPublicacao : null,
      conteudo: editorContentRef.current ?? "(editor vazio)",
    };

    console.log("=== MATÉRIA ===", output);
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Cabeçalho */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Nova Matéria</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Preencha os campos abaixo. A publicação ocorrerá somente após a
            conclusão e aprovação.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          {/* ----------------------------------------------------------------
              Seção: Conteúdo principal
          ---------------------------------------------------------------- */}
          <fieldset className="flex flex-col gap-5 border border-border rounded-xl p-6">
            <legend className="px-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Conteúdo
            </legend>

            {/* Título */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="titulo" className="font-medium">
                Título <span className="text-destructive">*</span>
              </Label>
              <Input
                id="titulo"
                placeholder="Informe o título da matéria"
                value={form.titulo}
                onChange={(e) => setField("titulo", e.target.value)}
                required
              />
            </div>

            {/* Linha Fina (opcional, toggle) */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <Label htmlFor="toggle-linha-fina" className="cursor-pointer">
                  Linha Fina
                  <span className="text-muted-foreground font-normal">
                    (opcional)
                  </span>
                </Label>
                <Switch
                  id="toggle-linha-fina"
                  checked={hasLinhaFina}
                  onCheckedChange={setHasLinhaFina}
                />
              </div>
              {hasLinhaFina && (
                <Textarea
                  id="linha-fina"
                  placeholder="Subtítulo ou linha de apoio da matéria"
                  value={form.linhaFina}
                  onChange={(e) => setField("linhaFina", e.target.value)}
                  rows={2}
                  className="resize-none"
                />
              )}
            </div>

            {/* Editor de Texto */}
            <div className="flex flex-col gap-1.5">
              <Label className="font-medium">
                Conteúdo <span className="text-destructive">*</span>
              </Label>
              <Editor
                onChange={(content) => (editorContentRef.current = content)}
              />
            </div>
          </fieldset>

          {/* ----------------------------------------------------------------
              Seção: Classificação
          ---------------------------------------------------------------- */}
          <fieldset className="flex flex-col gap-5 border border-border rounded-xl p-6">
            <legend className="px-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Classificação
            </legend>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Categoria */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="categoria" className="font-medium">
                  Categoria <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.categoria}
                  onValueChange={(v) => setField("categoria", v)}
                  required
                >
                  <SelectTrigger id="categoria" className="w-full">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Estado */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="estado" className="font-medium">
                  Estado <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.estado}
                  onValueChange={(v) => setField("estado", v)}
                >
                  <SelectTrigger id="estado" className="w-full">
                    <SelectValue placeholder="Selecione o estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTADOS.map((est) => (
                      <SelectItem key={est.id} value={est.id}>
                        {est.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-col gap-2">
              <Label className="font-medium">Tags</Label>
              <div className="flex gap-2">
                <Input
                  id="tag-input"
                  placeholder="Digite uma tag e pressione Enter ou clique em Adicionar"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                />
                <Button type="button" variant="outline" onClick={addTag}>
                  <Tag size={14} className="mr-1.5" />
                  Adicionar
                </Button>
              </div>
              {form.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {form.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground text-sm font-medium"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="rounded-full hover:bg-muted p-0.5 transition-colors"
                        aria-label={`Remover tag ${tag}`}
                      >
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Destaque */}
            <div className="flex items-center gap-3">
              <Switch
                id="destaque"
                checked={form.destaque}
                onCheckedChange={(v) => setField("destaque", v)}
              />
              <Label htmlFor="destaque" className="cursor-pointer">
                Destaque{" "}
                <span className="text-muted-foreground font-normal text-sm">
                  (exibe na área principal do portal)
                </span>
              </Label>
            </div>
          </fieldset>

          {/* ----------------------------------------------------------------
              Seção: Datas
          ---------------------------------------------------------------- */}
          <fieldset className="flex flex-col gap-5 border border-border rounded-xl p-6">
            <legend className="px-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Datas
            </legend>

            {/* Data de Criação */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="data-criacao" className="font-medium">
                Data de Criação <span className="text-destructive">*</span>
              </Label>
              <Input
                id="data-criacao"
                type="datetime-local"
                value={form.dataCriacao}
                onChange={(e) => setField("dataCriacao", e.target.value)}
                required
                className="w-fit"
              />
            </div>

            {/* Data de Início da Publicação (opcional) */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <Switch
                  id="toggle-data-inicio"
                  checked={hasDataInicio}
                  onCheckedChange={setHasDataInicio}
                />
                <Label
                  htmlFor="toggle-data-inicio"
                  className="cursor-pointer font-medium"
                >
                  Data de Início da Publicação{" "}
                  <span className="text-muted-foreground font-normal">
                    (opcional)
                  </span>
                </Label>
              </div>
              {hasDataInicio && (
                <Input
                  id="data-inicio"
                  type="datetime-local"
                  value={form.dataInicioPublicacao}
                  onChange={(e) =>
                    setField("dataInicioPublicacao", e.target.value)
                  }
                  className="w-fit"
                />
              )}
            </div>

            {/* Data de Fim da Publicação (opcional) */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <Switch
                  id="toggle-data-fim"
                  checked={hasDataFim}
                  onCheckedChange={setHasDataFim}
                />
                <Label
                  htmlFor="toggle-data-fim"
                  className="cursor-pointer font-medium"
                >
                  Data de Fim da Publicação{" "}
                  <span className="text-muted-foreground font-normal">
                    (opcional)
                  </span>
                </Label>
              </div>
              {hasDataFim && (
                <Input
                  id="data-fim"
                  type="datetime-local"
                  value={form.dataFimPublicacao}
                  onChange={(e) =>
                    setField("dataFimPublicacao", e.target.value)
                  }
                  className="w-fit"
                />
              )}
            </div>
          </fieldset>

          {/* ----------------------------------------------------------------
              Ações
          ---------------------------------------------------------------- */}
          <div className="flex justify-end gap-3 pb-12">
            <Button type="button" variant="outline">
              Cancelar
            </Button>
            <Button type="submit">Salvar (console.log)</Button>
          </div>
        </form>
      </div>
    </main>
  );
}
