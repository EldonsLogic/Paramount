"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CampaignConfig, CampaignResult, Channel, CurrencyCode, ReachCurvePoint } from "@/lib/types";
import { ChannelRanking } from "./channel-ranking";
import { OverlapMatrix } from "./overlap-matrix";
import { ReachCurve } from "./reach-curve";

interface ResultsTabsProps {
  result: CampaignResult;
  curve: ReachCurvePoint[];
  activeChannels: Channel[];
  config: CampaignConfig;
  universe: number;
  currency: CurrencyCode;
}

// All panels stay mounted so print can show them together; inactive ones are hidden on screen only.
const panel = "data-[state=inactive]:hidden print:!block print:mt-6";

export function ResultsTabs({ result, curve, activeChannels, config, universe, currency }: ResultsTabsProps) {
  const [tab, setTab] = useState("ranking");
  return (
    <Card>
      <CardContent className="p-3 sm:p-5">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid h-auto w-full grid-cols-3 sm:inline-flex sm:w-auto print:hidden">
            <TabsTrigger value="ranking" className="h-full whitespace-normal px-1 text-center text-xs leading-tight sm:px-3 sm:text-sm">
              Channel Ranking
            </TabsTrigger>
            <TabsTrigger value="curve" className="h-full whitespace-normal px-1 text-center text-xs leading-tight sm:px-3 sm:text-sm">
              Reach Curve
            </TabsTrigger>
            <TabsTrigger value="matrix" className="h-full whitespace-normal px-1 text-center text-xs leading-tight sm:px-3 sm:text-sm">
              Overlap Matrix
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ranking" forceMount className={panel}>
            <h3 className="mb-2 hidden text-base font-semibold print:block">Channel Ranking</h3>
            <ChannelRanking result={result} currency={currency} />
          </TabsContent>
          <TabsContent value="curve" forceMount className={`${panel} print-avoid-break`}>
            <h3 className="mb-2 hidden text-base font-semibold print:block">Reach Curve</h3>
            <ReachCurve data={curve} universe={universe} visible={tab === "curve"} />
          </TabsContent>
          <TabsContent value="matrix" forceMount className={`${panel} print-avoid-break`}>
            <h3 className="mb-2 hidden text-base font-semibold print:block">Overlap Matrix</h3>
            <OverlapMatrix channels={activeChannels} config={config} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
