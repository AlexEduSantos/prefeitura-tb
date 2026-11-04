"use client";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AnalyticsService } from "../service/analytics.service";

export type AnalyticsUnit = "day" | "month" | "year" | "hour";

export interface AnalyticsDateRange {
  initDate?: string;
  finalDate?: string;
  unit: AnalyticsUnit;
}

export function UseAnalytics() {
  const [dataRange, setDataRange] = useState<AnalyticsDateRange>({
    initDate: "",
    finalDate: "",
    unit: "day",
  });

  const PageViewsQuery = useQuery({
    queryKey: ["pageViews", dataRange],
    queryFn: () => AnalyticsService.getPageViews(dataRange),
  });

  return {
    dataRange,
    setDataRange,

    pageViews: PageViewsQuery.data,
    isPageViewsLoading: PageViewsQuery.isLoading,
    isPageViewsFetching: PageViewsQuery.isFetching,
    isPageViewsError: PageViewsQuery.isError,
    refetchPageViews: PageViewsQuery.refetch,
  };
}
