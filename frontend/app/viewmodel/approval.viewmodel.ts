"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApprovalService } from "../service/approval.service";
import {
  IApprovalListResponse,
  IContentChangeRequest,
} from "../type/approval";

export function useApprovalQueue() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("pendente");
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>("todos");
  const [page, setPage] = useState<number>(1);
  const [selectedRequest, setSelectedRequest] =
    useState<IContentChangeRequest | null>(null);

  const requestsQuery = useQuery<IApprovalListResponse>({
    queryKey: ["approvals", statusFilter, entityTypeFilter, page],
    queryFn: () =>
      ApprovalService.getRequests({
        status: statusFilter,
        entityType: entityTypeFilter,
        page,
        limit: 20,
      }),
  });

  const invalidateAllContentQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["approvals"] });
    queryClient.invalidateQueries({ queryKey: ["pages"] });
    queryClient.invalidateQueries({ queryKey: ["articles"] });
    queryClient.invalidateQueries({ queryKey: ["popups"] });
    queryClient.invalidateQueries({ queryKey: ["gallery"] });
    queryClient.invalidateQueries({ queryKey: ["services"] });
  };

  const approveMutation = useMutation({
    mutationFn: ({
      id,
      proposedData,
    }: {
      id: string;
      proposedData?: Record<string, unknown>;
    }) => ApprovalService.approveRequest(id, proposedData),
    onSuccess: () => {
      invalidateAllContentQueries();
      toast.success("Solicitação aprovada e aplicada com sucesso!");
      setSelectedRequest(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao aprovar solicitação");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      ApprovalService.rejectRequest(id, reason),
    onSuccess: () => {
      invalidateAllContentQueries();
      toast.success("Solicitação rejeitada com motivo registrado.");
      setSelectedRequest(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao rejeitar solicitação");
    },
  });

  const updateProposedMutation = useMutation({
    mutationFn: ({
      id,
      proposedData,
    }: {
      id: string;
      proposedData: Record<string, unknown>;
    }) => ApprovalService.updateProposedData(id, proposedData),
    onSuccess: () => {
      invalidateAllContentQueries();
      toast.success("Proposta atualizada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar proposta");
    },
  });

  const resubmitMutation = useMutation({
    mutationFn: ({
      id,
      proposedData,
    }: {
      id: string;
      proposedData: Record<string, unknown>;
    }) => ApprovalService.resubmitRequest(id, proposedData),
    onSuccess: () => {
      invalidateAllContentQueries();
      toast.success("Nova solicitação reenviada para aprovação!");
      setSelectedRequest(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao reenviar solicitação");
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => ApprovalService.cancelRequest(id),
    onSuccess: () => {
      invalidateAllContentQueries();
      toast.success("Solicitação cancelada.");
      setSelectedRequest(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao cancelar solicitação");
    },
  });

  return {
    items: requestsQuery.data?.items ?? [],
    meta: requestsQuery.data?.meta ?? {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 1,
    },
    summary: requestsQuery.data?.summary ?? {
      pendente: 0,
      rejeitado: 0,
      aprovado: 0,
    },
    isLoading: requestsQuery.isLoading,
    isFetching: requestsQuery.isFetching,
    isError: requestsQuery.isError,
    error: requestsQuery.error,
    refetch: requestsQuery.refetch,
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
    updateProposedMutation,
    resubmitMutation,
    cancelMutation,
  };
}
