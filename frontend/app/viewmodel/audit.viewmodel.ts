"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AuditService } from "../service/audit.service";
import { IAuditFilterParams } from "../type/audit";

export function useAuditViewModel() {
  const [filters, setFilters] = useState<IAuditFilterParams>({
    page: 1,
    limit: 20,
    action: "all",
    entity: "all",
    search: "",
  });

  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);

  const auditQuery = useQuery({
    queryKey: ["audit-logs", filters],
    queryFn: () => AuditService.getAuditLogs(filters),
    placeholderData: (prev) => prev,
  });

  const selectedLogQuery = useQuery({
    queryKey: ["audit-log", selectedLogId],
    queryFn: () => (selectedLogId ? AuditService.getAuditLogById(selectedLogId) : null),
    enabled: !!selectedLogId,
  });

  const setPage = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const setFilterField = <K extends keyof IAuditFilterParams>(
    field: K,
    value: IAuditFilterParams[K],
  ) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
      page: 1, // Reseta para a primeira página ao alterar filtros
    }));
  };

  const resetFilters = () => {
    setFilters({
      page: 1,
      limit: 20,
      action: "all",
      entity: "all",
      search: "",
    });
  };

  return {
    logs: auditQuery.data?.data || [],
    total: auditQuery.data?.total || 0,
    page: auditQuery.data?.page || 1,
    totalPages: auditQuery.data?.totalPages || 1,
    limit: auditQuery.data?.limit || 20,
    isLoading: auditQuery.isLoading,
    isFetching: auditQuery.isFetching,
    isError: auditQuery.isError,
    refetch: auditQuery.refetch,

    filters,
    setFilterField,
    setPage,
    resetFilters,

    selectedLogId,
    setSelectedLogId,
    selectedLog: selectedLogQuery.data,
    isLoadingSelected: selectedLogQuery.isLoading,
  };
}

