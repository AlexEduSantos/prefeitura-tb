"use client";

import { useMemo, useState } from "react";
import { format, isValid, startOfDay, endOfDay, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CalendarIcon,
  Eye,
  Users,
  RefreshCw,
  X,
  TrendingUp,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  UseAnalytics,
  AnalyticsUnit,
} from "@/app/viewmodel/analytics.viewmodel";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

const pageviewsConfig = {
  pageviews: {
    label: "Visualizações",
    color: "#3b82f6",
  },
} satisfies ChartConfig;

const sessionsConfig = {
  sessions: {
    label: "Visitas Únicas",
    color: "#10b981",
  },
} satisfies ChartConfig;

export function AnalyticsCard() {
  const {
    dataRange,
    setDataRange,
    pageViews,
    isPageViewsLoading,
    isPageViewsFetching,
    isPageViewsError,
    refetchPageViews,
  } = UseAnalytics();

  // Estados locais para controlar a seleção de datas no calendário
  const [startDate, setStartDate] = useState<Date | undefined>(() =>
    dataRange.initDate ? new Date(dataRange.initDate) : undefined,
  );
  const [endDate, setEndDate] = useState<Date | undefined>(() =>
    dataRange.finalDate ? new Date(dataRange.finalDate) : undefined,
  );

  // Manipulador de mudança de agrupamento (dia, mês, ano)
  const handleUnitChange = (value: string) => {
    setDataRange((prev) => ({
      ...prev,
      unit: value as AnalyticsUnit,
    }));
  };

  // Aplica as datas selecionadas
  const handleApplyDateRange = (newStart?: Date, newEnd?: Date) => {
    setStartDate(newStart);
    setEndDate(newEnd);

    setDataRange((prev) => ({
      ...prev,
      initDate: newStart ? startOfDay(newStart).toISOString() : "",
      finalDate: newEnd ? endOfDay(newEnd).toISOString() : "",
    }));
  };

  // Limpa o filtro de período (volta ao padrão do Umami - últimos 7 dias)
  const handleClearDates = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setDataRange((prev) => ({
      ...prev,
      initDate: "",
      finalDate: "",
    }));
  };

  // Atalhos rápidos de intervalo
  const applyPreset = (days: number) => {
    const end = new Date();
    const start = subDays(end, days);
    handleApplyDateRange(start, end);
  };

  // Consolidação dos dados para o Recharts (mesclando pageviews e sessions pelo timestamp X)
  const chartData = useMemo(() => {
    if (!pageViews) return [];

    const dataMap = new Map<
      string,
      { date: string; pageviews: number; sessions: number }
    >();

    (pageViews.pageviews || []).forEach((item) => {
      dataMap.set(item.x, {
        date: item.x,
        pageviews: item.y,
        sessions: 0,
      });
    });

    (pageViews.sessions || []).forEach((item) => {
      const existing = dataMap.get(item.x);
      if (existing) {
        existing.sessions = item.y;
      } else {
        dataMap.set(item.x, {
          date: item.x,
          pageviews: 0,
          sessions: item.y,
        });
      }
    });

    return Array.from(dataMap.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
  }, [pageViews]);

  // Totais calculados do período atual
  const totalPageviews = useMemo(
    () => chartData.reduce((acc, curr) => acc + curr.pageviews, 0),
    [chartData],
  );

  const totalSessions = useMemo(
    () => chartData.reduce((acc, curr) => acc + curr.sessions, 0),
    [chartData],
  );

  // Formatação do eixo X conforme o agrupamento
  const formatXAxis = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (!isValid(date)) return dateStr;

      if (dataRange.unit === "month") {
        return format(date, "MMM/yy", { locale: ptBR });
      }
      if (dataRange.unit === "year") {
        return format(date, "yyyy", { locale: ptBR });
      }
      return format(date, "dd/MM", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  // Formatação do título no Tooltip
  const formatTooltipLabel = (label: string) => {
    try {
      const date = new Date(label);
      if (!isValid(date)) return label;

      if (dataRange.unit === "month") {
        return format(date, "MMMM 'de' yyyy", { locale: ptBR });
      }
      if (dataRange.unit === "year") {
        return format(date, "yyyy", { locale: ptBR });
      }
      return format(date, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch {
      return label;
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Grid com os Dois Gráficos Separados */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* GRÁFICO 1: VISUALIZAÇÕES DE PÁGINAS */}
        <Card className="w-full shadow-xs flex flex-col justify-between">
          <CardHeader className="gap-6 p-0">
            <div className="flex items-center border-b px-6 pb-6 justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Eye className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">
                    Visualizações de Páginas
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Total de telas e páginas carregadas
                  </CardDescription>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
                  {isPageViewsLoading ? (
                    <Skeleton className="h-6 w-16 ml-auto" />
                  ) : (
                    totalPageviews.toLocaleString("pt-BR")
                  )}
                </div>
                <span className="text-[11px] text-muted-foreground">
                  no período
                </span>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row flex-wrap lg:items-center justify-between px-8">
              {/* Controles: Agrupamento e Intervalo de Datas */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Controle de Agrupamento */}
                <Tabs
                  value={dataRange.unit}
                  onValueChange={handleUnitChange}
                  className="w-auto"
                >
                  <TabsList className="h-9">
                    <TabsTrigger value="day" className="text-xs px-3">
                      Dia
                    </TabsTrigger>
                    <TabsTrigger value="month" className="text-xs px-3">
                      Mês
                    </TabsTrigger>
                    <TabsTrigger value="year" className="text-xs px-3">
                      Ano
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-2 text-xs text-muted-foreground">
                {/* Seletor de Data Inicial */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 text-xs justify-start font-normal gap-1.5"
                    >
                      <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      {startDate ? (
                        format(startDate, "dd/MM/yyyy")
                      ) : (
                        <span className="text-muted-foreground">
                          Data Inicial
                        </span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      locale={ptBR}
                      onSelect={(date) => {
                        if (date) {
                          handleApplyDateRange(date, endDate);
                        }
                      }}
                      disabled={(date) => (endDate ? date > endDate : false)}
                    />
                  </PopoverContent>
                </Popover>

                <span className="text-xs text-muted-foreground">até</span>

                {/* Seletor de Data Final */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 text-xs justify-start font-normal gap-1.5"
                    >
                      <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      {endDate ? (
                        format(endDate, "dd/MM/yyyy")
                      ) : (
                        <span className="text-muted-foreground">
                          Data Final
                        </span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      locale={ptBR}
                      onSelect={(date) => {
                        if (date) {
                          handleApplyDateRange(startDate, date);
                        }
                      }}
                      disabled={(date) =>
                        startDate ? date < startDate : false
                      }
                    />
                  </PopoverContent>
                </Popover>

                {/* Botão de Limpar Filtro de Datas se algum estiver selecionado */}
                {(startDate || endDate) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearDates}
                    className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground"
                    title="Restaurar período padrão"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
                <span>Atalhos:</span>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => applyPreset(7)}
                  className="text-[11px] h-6 px-2"
                >
                  7 dias
                </Button>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => applyPreset(30)}
                  className="text-[11px] h-6 px-2"
                >
                  30 dias
                </Button>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => applyPreset(90)}
                  className="text-[11px] h-6 px-2"
                >
                  90 dias
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            {isPageViewsLoading ? (
              <div className="flex flex-col gap-2 w-full h-65 justify-center items-center">
                <Skeleton className="h-55 w-full rounded-lg" />
              </div>
            ) : chartData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-65 text-center text-muted-foreground gap-2">
                <p className="text-sm font-medium">Nenhum dado encontrado</p>
                <p className="text-xs">
                  Sem visualizações registradas no intervalo selecionado.
                </p>
              </div>
            ) : (
              <ChartContainer
                config={pageviewsConfig}
                className="aspect-auto h-65 w-full"
              >
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="fillPageviewsOnly"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="var(--color-pageviews)"
                        stopOpacity={0.4}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--color-pageviews)"
                        stopOpacity={0.02}
                      />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    vertical={false}
                    strokeDasharray="3 3"
                    className="stroke-muted/50"
                  />

                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={20}
                    tickFormatter={formatXAxis}
                  />

                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    allowDecimals={false}
                  />

                  <ChartTooltip
                    cursor={{
                      stroke: "rgba(100, 116, 139, 0.2)",
                      strokeWidth: 1,
                    }}
                    content={
                      <ChartTooltipContent
                        indicator="dot"
                        labelFormatter={(value) =>
                          formatTooltipLabel(String(value))
                        }
                      />
                    }
                  />

                  <Area
                    type="monotone"
                    dataKey="pageviews"
                    stroke="var(--color-pageviews)"
                    strokeWidth={2}
                    fill="url(#fillPageviewsOnly)"
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </AreaChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* GRÁFICO 2: VISITAS / SESSÕES ÚNICAS */}
        <Card className="w-full shadow-xs flex flex-col justify-between">
          <CardHeader className="p-0">
            <div className="flex items-center justify-between px-6 pb-6 border-b">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">
                    Visitas Únicas (Sessões)
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Visitantes únicos navegando no site
                  </CardDescription>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                  {isPageViewsLoading ? (
                    <Skeleton className="h-6 w-16 ml-auto" />
                  ) : (
                    totalSessions.toLocaleString("pt-BR")
                  )}
                </div>
                <span className="text-[11px] text-muted-foreground">
                  no período
                </span>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row flex-wrap lg:items-center justify-between px-8">
              {/* Controles: Agrupamento e Intervalo de Datas */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Controle de Agrupamento */}
                <Tabs
                  value={dataRange.unit}
                  onValueChange={handleUnitChange}
                  className="w-auto"
                >
                  <TabsList className="h-9">
                    <TabsTrigger value="day" className="text-xs px-3">
                      Dia
                    </TabsTrigger>
                    <TabsTrigger value="month" className="text-xs px-3">
                      Mês
                    </TabsTrigger>
                    <TabsTrigger value="year" className="text-xs px-3">
                      Ano
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-2 text-xs text-muted-foreground">
                {/* Seletor de Data Inicial */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 text-xs justify-start font-normal gap-1.5"
                    >
                      <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      {startDate ? (
                        format(startDate, "dd/MM/yyyy")
                      ) : (
                        <span className="text-muted-foreground">
                          Data Inicial
                        </span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      locale={ptBR}
                      onSelect={(date) => {
                        if (date) {
                          handleApplyDateRange(date, endDate);
                        }
                      }}
                      disabled={(date) => (endDate ? date > endDate : false)}
                    />
                  </PopoverContent>
                </Popover>

                <span className="text-xs text-muted-foreground">até</span>

                {/* Seletor de Data Final */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 text-xs justify-start font-normal gap-1.5"
                    >
                      <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      {endDate ? (
                        format(endDate, "dd/MM/yyyy")
                      ) : (
                        <span className="text-muted-foreground">
                          Data Final
                        </span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      locale={ptBR}
                      onSelect={(date) => {
                        if (date) {
                          handleApplyDateRange(startDate, date);
                        }
                      }}
                      disabled={(date) =>
                        startDate ? date < startDate : false
                      }
                    />
                  </PopoverContent>
                </Popover>

                {/* Botão de Limpar Filtro de Datas se algum estiver selecionado */}
                {(startDate || endDate) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearDates}
                    className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground"
                    title="Restaurar período padrão"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
                <span>Atalhos:</span>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => applyPreset(7)}
                  className="text-[11px] h-6 px-2"
                >
                  7 dias
                </Button>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => applyPreset(30)}
                  className="text-[11px] h-6 px-2"
                >
                  30 dias
                </Button>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => applyPreset(90)}
                  className="text-[11px] h-6 px-2"
                >
                  90 dias
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            {isPageViewsLoading ? (
              <div className="flex flex-col gap-2 w-full h-65 justify-center items-center">
                <Skeleton className="h-55 w-full rounded-lg" />
              </div>
            ) : chartData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-65 text-center text-muted-foreground gap-2">
                <p className="text-sm font-medium">Nenhum dado encontrado</p>
                <p className="text-xs">
                  Sem visitas registradas no intervalo selecionado.
                </p>
              </div>
            ) : (
              <ChartContainer
                config={sessionsConfig}
                className="aspect-auto h-65 w-full"
              >
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="fillSessionsOnly"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="var(--color-sessions)"
                        stopOpacity={0.4}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--color-sessions)"
                        stopOpacity={0.02}
                      />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    vertical={false}
                    strokeDasharray="3 3"
                    className="stroke-muted/50"
                  />

                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={20}
                    tickFormatter={formatXAxis}
                  />

                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    allowDecimals={false}
                  />

                  <ChartTooltip
                    cursor={{
                      stroke: "rgba(100, 116, 139, 0.2)",
                      strokeWidth: 1,
                    }}
                    content={
                      <ChartTooltipContent
                        indicator="dot"
                        labelFormatter={(value) =>
                          formatTooltipLabel(String(value))
                        }
                      />
                    }
                  />

                  <Area
                    type="monotone"
                    dataKey="sessions"
                    stroke="var(--color-sessions)"
                    strokeWidth={2}
                    fill="url(#fillSessionsOnly)"
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </AreaChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
