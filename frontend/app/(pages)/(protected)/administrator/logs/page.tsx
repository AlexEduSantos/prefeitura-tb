"use client";

import { useAuditViewModel } from "@/app/viewmodel/audit.viewmodel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  FilterXIcon,
  RefreshCwIcon,
  SearchIcon,
  ShieldCheckIcon,
  ClockIcon,
  UserIcon,
  LaptopIcon,
  LayersIcon,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PainelHeader } from "@/components/painel-header";

const ACTION_COLORS: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  CREATE: {
    bg: "bg-emerald-500/10 dark:bg-emerald-500/20",
    text: "text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-500/30",
  },
  UPDATE: {
    bg: "bg-blue-500/10 dark:bg-blue-500/20",
    text: "text-blue-700 dark:text-blue-400",
    border: "border-blue-500/30",
  },
  DELETE: {
    bg: "bg-rose-500/10 dark:bg-rose-500/20",
    text: "text-rose-700 dark:text-rose-400",
    border: "border-rose-500/30",
  },
  LOGIN: {
    bg: "bg-purple-500/10 dark:bg-purple-500/20",
    text: "text-purple-700 dark:text-purple-400",
    border: "border-purple-500/30",
  },
  LOGOUT: {
    bg: "bg-zinc-500/10 dark:bg-zinc-500/20",
    text: "text-zinc-700 dark:text-zinc-400",
    border: "border-zinc-500/30",
  },
};

export default function AuditLogsPage() {
  const {
    logs,
    total,
    page,
    totalPages,
    isLoading,
    isFetching,
    isError,
    refetch,
    filters,
    setFilterField,
    setPage,
    resetFilters,
    selectedLogId,
    setSelectedLogId,
    selectedLog,
    isLoadingSelected,
  } = useAuditViewModel();

  const getActionBadge = (action: string) => {
    const style = ACTION_COLORS[action] || {
      bg: "bg-muted",
      text: "text-muted-foreground",
      border: "border-border",
    };

    return (
      <span
        className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${style.bg} ${style.text} ${style.border}`}
      >
        {action}
      </span>
    );
  };

  return (
    <section>
      {/* Header */}
      <PainelHeader title="Logs de Auditoria" />

      <div className="p-2 flex flex-col gap-2">
        {/* Toolbar de Filtros */}
        <>
          <div className="flex flex-col md:flex-row items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-60 w-full md:w-auto">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por email, entidade, ação ou ID..."
                value={filters.search || ""}
                onChange={(e) => setFilterField("search", e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
              <Select
                value={filters.action || "all"}
                onValueChange={(val) => setFilterField("action", val)}
              >
                <SelectTrigger className="w-35">
                  <SelectValue placeholder="Ação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas Ações</SelectItem>
                  <SelectItem value="CREATE">CREATE</SelectItem>
                  <SelectItem value="UPDATE">UPDATE</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                  <SelectItem value="LOGIN">LOGIN</SelectItem>
                  <SelectItem value="LOGOUT">LOGOUT</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filters.entity || "all"}
                onValueChange={(val) => setFilterField("entity", val)}
              >
                <SelectTrigger className="w-35">
                  <SelectValue placeholder="Entidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas Entidades</SelectItem>
                  <SelectItem value="Article">Artigo</SelectItem>
                  <SelectItem value="Media">Mídia</SelectItem>
                  <SelectItem value="Story">Story</SelectItem>
                  <SelectItem value="Galleries">Galeria</SelectItem>
                  <SelectItem value="Menu">Menu</SelectItem>
                  <SelectItem value="MenuItem">Item de Menu</SelectItem>
                  <SelectItem value="Popup">Popup</SelectItem>
                  <SelectItem value="Service">Serviço</SelectItem>
                  <SelectItem value="User">Usuário</SelectItem>
                  <SelectItem value="Settings">Configurações</SelectItem>
                  <SelectItem value="Page">Página</SelectItem>
                </SelectContent>
              </Select>
              {(filters.search ||
                filters.action !== "all" ||
                filters.entity !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                  className="px-2.5 text-muted-foreground hover:text-foreground"
                  title="Limpar filtros"
                >
                  <FilterXIcon className="h-4 w-4 mr-1" />
                  Limpar
                </Button>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="gap-1.5 bg-card h-9"
            >
              <RefreshCwIcon
                className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
              />
              Atualizar
            </Button>
          </div>
        </>
        {/* Tabela de Logs */}
        <Card className="overflow-hidden p-0 shadow-none! ring-0 border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-42.5">Data / Hora</TableHead>
                <TableHead className="w-55">Usuário</TableHead>
                <TableHead className="w-27.5">Ação</TableHead>
                <TableHead className="w-32.5">Recurso</TableHead>
                <TableHead>ID Afetado</TableHead>
                <TableHead className="w-35">IP</TableHead>
                <TableHead className="w-20 text-right">Detalhes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-32 text-center text-muted-foreground"
                  >
                    <RefreshCwIcon className="h-5 w-5 animate-spin mx-auto mb-2 text-primary" />
                    Carregando registros de auditoria...
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-32 text-center text-destructive"
                  >
                    <p className="mb-2">
                      Erro ao carregar os registros de auditoria.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => refetch()}
                    >
                      Tentar novamente
                    </Button>
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-32 text-center text-muted-foreground"
                  >
                    Nenhum registro de auditoria encontrado com os filtros
                    atuais.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow
                    key={log.id}
                    className="hover:bg-muted/40 transition-colors"
                  >
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {format(new Date(log.createdAt), "dd/MM/yyyy HH:mm:ss", {
                        locale: ptBR,
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={log.user?.avatar || undefined} />
                          <AvatarFallback className="text-[10px]">
                            {log.user?.name?.charAt(0) ||
                              log.userEmail?.charAt(0) ||
                              "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-medium truncate">
                            {log.user?.name || log.userEmail || "Sistema"}
                          </span>
                          {log.user?.email && (
                            <span className="text-[10px] text-muted-foreground truncate">
                              {log.user.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getActionBadge(log.action)}</TableCell>
                    <TableCell className="text-xs font-medium">
                      <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground">
                        {log.entity}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground truncate max-w-50">
                      {log.entityId || "—"}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">
                      {log.ip || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={() => setSelectedLogId(log.id)}
                        title="Ver detalhes da requisição"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/20">
              <span className="text-xs text-muted-foreground">
                Página <strong>{page}</strong> de <strong>{totalPages}</strong>{" "}
                ({total} total)
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1 || isLoading}
                  className="h-8 px-2"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages || isLoading}
                  className="h-8 px-2"
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Modal de Detalhes do Log */}
      <Dialog
        open={!!selectedLogId}
        onOpenChange={(open) => !open && setSelectedLogId(null)}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <DialogTitle>Detalhes da Auditoria</DialogTitle>
              {selectedLog && getActionBadge(selectedLog.action)}
            </div>
            <DialogDescription>
              Registros de atividade do sistema.
            </DialogDescription>
          </DialogHeader>

          {isLoadingSelected || !selectedLog ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground">
              <RefreshCwIcon className="h-5 w-5 animate-spin mr-2" />
              Carregando detalhes...
            </div>
          ) : (
            <div className="flex flex-col gap-4 overflow-y-auto pr-1">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-muted/40 border text-xs">
                <div>
                  <span className="text-muted-foreground block mb-0.5">
                    Data e Hora:
                  </span>
                  <span className="font-semibold font-mono">
                    {format(
                      new Date(selectedLog.createdAt),
                      "dd/MM/yyyy HH:mm:ss",
                      { locale: ptBR },
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-0.5">
                    Entidade:
                  </span>
                  <span className="font-semibold">{selectedLog.entity}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-0.5">
                    ID Afetado:
                  </span>
                  <span className="font-semibold font-mono truncate block">
                    {selectedLog.entityId || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-0.5">
                    Usuário:
                  </span>
                  <span className="font-semibold">
                    {selectedLog.user?.name ||
                      selectedLog.userEmail ||
                      "Sistema"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-0.5">
                    Endereço IP:
                  </span>
                  <span className="font-semibold font-mono">
                    {selectedLog.ip || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-0.5">
                    Papel (Role):
                  </span>
                  <span className="font-semibold">
                    {selectedLog.user?.role || "—"}
                  </span>
                </div>
              </div>

              {selectedLog.userAgent && (
                <div className="p-3 rounded-xl bg-muted/30 border text-xs">
                  <span className="text-muted-foreground block mb-1">
                    Navegador / User-Agent:
                  </span>
                  <span className="font-mono text-muted-foreground break-all">
                    {selectedLog.userAgent}
                  </span>
                </div>
              )}

              {/* JSON de Detalhes da Requisição */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-muted-foreground">
                  Payload Sanitizado / Metadados da Operação:
                </span>
                <pre className="p-3 rounded-xl bg-zinc-950 text-zinc-100 dark:bg-zinc-900 text-xs font-mono overflow-x-auto max-h-60 border border-zinc-800">
                  {selectedLog.details
                    ? JSON.stringify(selectedLog.details, null, 2)
                    : "// Nenhum detalhe adicional gravado"}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
