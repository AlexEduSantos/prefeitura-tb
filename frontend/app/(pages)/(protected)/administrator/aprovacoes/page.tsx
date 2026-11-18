"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Eye,
  RefreshCw,
  RotateCcw,
  Trash2,
  XCircle,
} from "lucide-react";
import { PainelHeader } from "@/components/painel-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useApprovalQueue } from "@/app/viewmodel/approval.viewmodel";
import { useProfileViewModel } from "@/app/viewmodel/user.viewmodel";
import {
  IContentChangeRequest,
  RequestStatus,
  RequestType,
} from "@/app/type/approval";

const ENTITY_LABELS: Record<string, string> = {
  Page: "Página",
  Article: "Notícia",
  Popup: "Popup",
  Gallery: "Galeria",
  Service: "Serviço",
  Story: "Destaque",
  Menu: "Menu",
  MenuItem: "Item de Menu",
  Organization: "Secretaria / Órgão",
};

const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
  create: "Criação",
  update: "Edição",
  delete: "Exclusão",
};

const STATUS_BADGE: Record<RequestStatus, { label: string; className: string }> =
  {
    pendente: {
      label: "Pendente",
      className: "bg-amber-500/15 text-amber-700 border-amber-500/30",
    },
    aprovado: {
      label: "Aprovado",
      className: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
    },
    rejeitado: {
      label: "Rejeitado",
      className: "bg-rose-500/15 text-rose-700 border-rose-500/30",
    },
    cancelado: {
      label: "Cancelado",
      className: "bg-zinc-500/15 text-zinc-700 border-zinc-500/30",
    },
  };

const HIDDEN_DIFF_KEYS = new Set([
  "id",
  "createdAt",
  "updatedAt",
  "deletedAt",
  "userId",
  "organization",
  "space",
  "user",
  "image",
  "cover",
  "categories",
]);

function formatDiffValue(val: unknown): string {
  if (val === undefined || val === null) return "—";
  if (typeof val === "string") return val || "—";
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  try {
    return JSON.stringify(val, null, 2);
  } catch {
    return String(val);
  }
}

function getRequestTitle(req: IContentChangeRequest): string {
  const proposedTitle = req.proposedData?.title;
  if (typeof proposedTitle === "string" && proposedTitle.trim()) {
    return proposedTitle;
  }
  const currentTitle = req.currentEntity?.title;
  if (typeof currentTitle === "string" && currentTitle.trim()) {
    return currentTitle;
  }
  return req.entityId ? `ID ${req.entityId.slice(0, 8)}...` : "Novo item";
}

export default function AprovacoesPage() {
  const { profile } = useProfileViewModel();
  const isReviewer =
    profile?.role === "MANAGER" || profile?.role === "ADMIN";

  const {
    items,
    meta,
    summary,
    isLoading,
    isFetching,
    refetch,
    statusFilter,
    setStatusFilter,
    entityTypeFilter,
    setEntityTypeFilter,
    page,
    setPage,
    selectedRequest,
    setSelectedRequest,
    approveMutation,
    rejectMutation,
    resubmitMutation,
    cancelMutation,
  } = useApprovalQueue();

  const [rejectDialogRequest, setRejectDialogRequest] =
    useState<IContentChangeRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [editedJson, setEditedJson] = useState("");
  const [editedTitle, setEditedTitle] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);

  const openReviewModal = (req: IContentChangeRequest) => {
    const data = req.proposedData ?? {};
    setSelectedRequest(req);
    setEditedTitle(typeof data.title === "string" ? data.title : "");
    setEditedDescription(
      typeof data.description === "string"
        ? data.description
        : typeof data.headline === "string"
          ? data.headline
          : "",
    );
    setEditedJson(JSON.stringify(data, null, 2));
    setJsonError(null);
  };

  const syncJsonField = (key: string, value: string) => {
    try {
      const parsed = JSON.parse(editedJson || "{}") as Record<string, unknown>;
      parsed[key] = value;
      setEditedJson(JSON.stringify(parsed, null, 2));
      setJsonError(null);
    } catch {
      setJsonError("JSON inválido na aba avançada.");
    }
  };

  const parseEditedPayload = (): Record<string, unknown> | null => {
    try {
      const parsed = JSON.parse(editedJson || "{}") as Record<string, unknown>;
      setJsonError(null);
      return parsed;
    } catch {
      setJsonError("O JSON proposto possui sintaxe inválida.");
      return null;
    }
  };

  const handleApproveWithEdits = () => {
    if (!selectedRequest) return;
    const payload = parseEditedPayload();
    if (!payload) return;
    approveMutation.mutate({ id: selectedRequest.id, proposedData: payload });
  };

  const handleResubmitDraft = () => {
    if (!selectedRequest) return;
    const payload = parseEditedPayload();
    if (!payload) return;
    resubmitMutation.mutate({ id: selectedRequest.id, proposedData: payload });
  };

  const handleConfirmReject = () => {
    if (!rejectDialogRequest) return;
    rejectMutation.mutate({
      id: rejectDialogRequest.id,
      reason: rejectionReason,
    });
    setRejectDialogRequest(null);
    setRejectionReason("");
  };

  const diffKeys = selectedRequest
    ? Array.from(
        new Set([
          ...Object.keys(selectedRequest.currentEntity ?? {}),
          ...Object.keys(selectedRequest.proposedData ?? {}),
        ]),
      ).filter((key) => !HIDDEN_DIFF_KEYS.has(key))
    : [];

  return (
    <section className="w-full">
      <PainelHeader title="Fila de Aprovações" />

      <div className="p-4 space-y-6">
        {/* Cards Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card
            className="cursor-pointer transition hover:border-amber-500/50"
            onClick={() => {
              setStatusFilter("pendente");
              setPage(1);
            }}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Pendentes de Análise
              </CardTitle>
              <Clock className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">
                {summary.pendente}
              </div>
              <p className="text-xs text-muted-foreground">
                Solicitações aguardando revisão
              </p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer transition hover:border-rose-500/50"
            onClick={() => {
              setStatusFilter("rejeitado");
              setPage(1);
            }}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Rejeitadas</CardTitle>
              <XCircle className="h-4 w-4 text-rose-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-rose-600">
                {summary.rejeitado}
              </div>
              <p className="text-xs text-muted-foreground">
                Rascunhos preservados para ajuste
              </p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer transition hover:border-emerald-500/50"
            onClick={() => {
              setStatusFilter("aprovado");
              setPage(1);
            }}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Aprovadas</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                {summary.aprovado}
              </div>
              <p className="text-xs text-muted-foreground">
                Publicações e alterações efetivadas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Barra de Filtros */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-44 bg-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pendente">Pendentes</SelectItem>
                <SelectItem value="rejeitado">Rejeitadas</SelectItem>
                <SelectItem value="aprovado">Aprovadas</SelectItem>
                <SelectItem value="cancelado">Canceladas</SelectItem>
                <SelectItem value="todos">Todos os status</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={entityTypeFilter}
              onValueChange={(value) => {
                setEntityTypeFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-48 bg-white">
                <SelectValue placeholder="Módulo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os módulos</SelectItem>
                <SelectItem value="Page">Páginas</SelectItem>
                <SelectItem value="Article">Notícias</SelectItem>
                <SelectItem value="Popup">Popups</SelectItem>
                <SelectItem value="Gallery">Galerias</SelectItem>
                <SelectItem value="Service">Serviços</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
            />
            Atualizar Fila
          </Button>
        </div>

        {/* Tabela Principal */}
        <div className="rounded-lg border bg-white overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              Carregando fila de aprovações...
            </div>
          ) : items.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground flex flex-col items-center gap-2">
              <ClipboardCheck className="h-8 w-8 opacity-40" />
              <p>Nenhuma solicitação encontrada para os filtros selecionados.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Módulo / Ação</TableHead>
                  <TableHead>Título / Identificação</TableHead>
                  <TableHead>Solicitante</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((req) => {
                  const statusMeta = STATUS_BADGE[req.status];
                  return (
                    <TableRow key={req.id}>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">
                            {ENTITY_LABELS[req.entityType] || req.entityType}
                          </span>
                          <Badge variant="outline" className="w-fit text-xs">
                            {REQUEST_TYPE_LABELS[req.requestType]}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {getRequestTitle(req)}
                          </span>
                          {req.status === "rejeitado" && req.rejectionReason && (
                            <span className="text-xs text-rose-600 line-clamp-2">
                              Motivo: {req.rejectionReason}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {req.requestedBy?.name || "Servidor"}
                          </span>
                          {req.requestedBy?.email && (
                            <span className="text-xs text-muted-foreground">
                              {req.requestedBy.email}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {format(new Date(req.createdAt), "dd/MM/yyyy HH:mm", {
                          locale: ptBR,
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={statusMeta?.className}
                        >
                          {statusMeta?.label || req.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openReviewModal(req)}
                            title="Comparar / Editar Proposta"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Revisar
                          </Button>

                          {isReviewer && req.status === "pendente" && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-emerald-600 hover:text-emerald-700"
                                title="Aprovar diretamente"
                                onClick={() =>
                                  approveMutation.mutate({ id: req.id })
                                }
                                disabled={approveMutation.isPending}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-rose-600 hover:text-rose-700"
                                title="Rejeitar com motivo"
                                onClick={() => {
                                  setRejectDialogRequest(req);
                                  setRejectionReason("");
                                }}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}

                          {req.status === "rejeitado" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openReviewModal(req)}
                            >
                              <RotateCcw className="h-3.5 w-3.5 mr-1" />
                              Corrigir
                            </Button>
                          )}

                          {req.status === "pendente" && !isReviewer && (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Cancelar solicitação"
                              onClick={() => {
                                if (
                                  confirm(
                                    "Deseja cancelar esta solicitação pendente?",
                                  )
                                ) {
                                  cancelMutation.mutate(req.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Paginação */}
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Anterior
            </Button>
            <span className="text-sm text-muted-foreground">
              Página {meta.page} de {meta.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Próxima
            </Button>
          </div>
        )}
      </div>

      {/* Modal de Revisão, Comparação (Diff) e Edição da Proposta */}
      <Dialog
        open={!!selectedRequest}
        onOpenChange={(open) => {
          if (!open) setSelectedRequest(null);
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Revisão de Solicitação —{" "}
              {selectedRequest &&
                (ENTITY_LABELS[selectedRequest.entityType] ||
                  selectedRequest.entityType)}
            </DialogTitle>
            <DialogDescription>
              Compare o estado atual publicado com o conteúdo proposto. Gestores
              podem ajustar campos antes de aprovar; autores podem corrigir
              rascunhos rejeitados e reenviar.
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-5">
              {selectedRequest.rejectionReason && (
                <div className="rounded-md border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-800">
                  <strong>Motivo da rejeição anterior:</strong>{" "}
                  {selectedRequest.rejectionReason}
                </div>
              )}

              {/* Tabela de Diff */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">
                  Comparação (Estado Atual vs Proposto)
                </h4>
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-40">Campo</TableHead>
                        <TableHead>Estado Atual</TableHead>
                        <TableHead>Proposto</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {diffKeys.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={3}
                            className="text-center text-muted-foreground"
                          >
                            Sem campos detalhados para comparar.
                          </TableCell>
                        </TableRow>
                      ) : (
                        diffKeys.map((key) => {
                          const currentVal = formatDiffValue(
                            selectedRequest.currentEntity?.[key],
                          );
                          const proposedVal = formatDiffValue(
                            selectedRequest.proposedData?.[key],
                          );
                          const hasChange =
                            selectedRequest.proposedData?.[key] !== undefined &&
                            currentVal !== proposedVal;

                          return (
                            <TableRow
                              key={key}
                              className={hasChange ? "bg-amber-500/5" : ""}
                            >
                              <TableCell className="font-mono text-xs font-medium align-top">
                                {key}
                                {hasChange && (
                                  <Badge
                                    variant="outline"
                                    className="ml-2 text-[10px] border-amber-500/40 text-amber-700"
                                  >
                                    Alterado
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-xs whitespace-pre-wrap break-all max-w-xs align-top text-muted-foreground">
                                {currentVal}
                              </TableCell>
                              <TableCell className="text-xs whitespace-pre-wrap break-all max-w-xs align-top font-medium">
                                {proposedVal}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Campos Rápidos e JSON Editável */}
              {selectedRequest.requestType !== "delete" &&
                (selectedRequest.status === "pendente" ||
                  selectedRequest.status === "rejeitado") && (
                  <div className="space-y-3 border-t pt-4">
                    <h4 className="text-sm font-semibold">
                      Ajustar Conteúdo Proposto
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label>Título</Label>
                        <Input
                          value={editedTitle}
                          onChange={(e) => {
                            setEditedTitle(e.target.value);
                            syncJsonField("title", e.target.value);
                          }}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Descrição / Subtítulo</Label>
                        <Input
                          value={editedDescription}
                          onChange={(e) => {
                            setEditedDescription(e.target.value);
                            const key =
                              selectedRequest.entityType === "Article"
                                ? "headline"
                                : "description";
                            syncJsonField(key, e.target.value);
                          }}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label>Payload Completo (JSON)</Label>
                      <Textarea
                        rows={8}
                        className="font-mono text-xs min-h-40"
                        value={editedJson}
                        onChange={(e) => {
                          setEditedJson(e.target.value);
                          try {
                            JSON.parse(e.target.value || "{}");
                            setJsonError(null);
                          } catch {
                            setJsonError("JSON inválido.");
                          }
                        }}
                      />
                      {jsonError && (
                        <p className="text-xs text-rose-600">{jsonError}</p>
                      )}
                    </div>
                  </div>
                )}
            </div>
          )}

          <DialogFooter className="gap-2 flex-wrap">
            <Button
              variant="outline"
              onClick={() => setSelectedRequest(null)}
            >
              Fechar
            </Button>

            {selectedRequest?.status === "pendente" && isReviewer && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setRejectDialogRequest(selectedRequest);
                    setRejectionReason("");
                  }}
                >
                  Rejeitar
                </Button>
                <Button
                  onClick={handleApproveWithEdits}
                  disabled={approveMutation.isPending || !!jsonError}
                >
                  {selectedRequest.requestType === "delete"
                    ? "Confirmar Exclusão (Soft Delete)"
                    : "Editar e Aprovar"}
                </Button>
              </>
            )}

            {selectedRequest?.status === "rejeitado" && (
              <Button
                onClick={handleResubmitDraft}
                disabled={resubmitMutation.isPending || !!jsonError}
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Corrigir Rascunho e Reenviar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Motivo de Rejeição */}
      <Dialog
        open={!!rejectDialogRequest}
        onOpenChange={(open) => {
          if (!open) setRejectDialogRequest(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Solicitação</DialogTitle>
            <DialogDescription>
              Informe o motivo da rejeição. O conteúdo proposto permanecerá salvo
              para que o autor possa corrigir e reenviar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="rejection-reason">Motivo da Rejeição</Label>
            <Textarea
              id="rejection-reason"
              placeholder="Ex.: Faltou anexar o documento oficial ou corrigir o título."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialogRequest(null)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmReject}
              disabled={rejectMutation.isPending}
            >
              Confirmar Rejeição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
