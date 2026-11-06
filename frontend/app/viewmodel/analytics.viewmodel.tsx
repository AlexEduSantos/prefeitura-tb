"use client";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AnalyticsService } from "../service/analytics.service";
import { TopNewsRange } from "../type/analytics";

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

export function UseTopNews(initialRange: TopNewsRange = "week") {
  const [range, setRange] = useState<TopNewsRange>(initialRange);

  const topNewsQuery = useQuery({
    queryKey: ["topNews", range],
    queryFn: () => AnalyticsService.getTopNews({ range, limit: 5 }),
  });

  return {
    range,
    setRange,
    topNews: topNewsQuery.data || [],
    isLoading: topNewsQuery.isLoading,
    isFetching: topNewsQuery.isFetching,
    isError: topNewsQuery.isError,
    refetch: topNewsQuery.refetch,
  };
}

export function UseTopPages(initialRange: TopNewsRange = "week") {
  const [range, setRange] = useState<TopNewsRange>(initialRange);

  const topPagesQuery = useQuery({
    queryKey: ["topPages", range],
    queryFn: () => AnalyticsService.getTopPages({ range, limit: 5 }),
  });

  return {
    range,
    setRange,
    topPages: topPagesQuery.data || [],
    isLoading: topPagesQuery.isLoading,
    isFetching: topPagesQuery.isFetching,
    isError: topPagesQuery.isError,
    refetch: topPagesQuery.refetch,
  };
}
