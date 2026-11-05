"use client";

import { PainelHeader } from "@/components/painel-header";
import { AnalyticsCard } from "@/components/public/init-analytics-card";
import { MostViewArticlesCard } from "@/components/public/init-mostview-articles-card";

export default function AdministratorHome() {
  return (
    <section className="">
      <PainelHeader title="" mode="welcome" />
      <div className="p-2 w-full space-y-4">
        <AnalyticsCard />
        <MostViewArticlesCard />
      </div>
    </section>
  );
}
