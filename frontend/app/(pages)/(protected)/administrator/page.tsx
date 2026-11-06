"use client";

import { PainelHeader } from "@/components/painel-header";
import { AnalyticsCard } from "@/components/public/init-analytics-card";
import { MostViewArticlesCard } from "@/components/public/init-mostview-articles-card";
import { MostViewPagesCard } from "@/components/public/init-mostview-pages-card";

export default function AdministratorHome() {
  return (
    <section className="">
      <PainelHeader title="" mode="welcome" />
      <div className="p-2 w-full space-y-4">
        <AnalyticsCard />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <MostViewArticlesCard />
          <MostViewPagesCard />
        </div>
      </div>
    </section>
  );
}
