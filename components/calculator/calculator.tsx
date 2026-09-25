"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { calculateCampaign, reachCurve } from "@/lib/calc";
import { MAX_CHANNELS, STORAGE_KEY, defaultConfig, newChannel, sanitizeConfig } from "@/lib/defaults";
import type { CampaignConfig, Channel } from "@/lib/types";
import { Benchmarks } from "./benchmarks";
import { ChannelManager } from "./channel-manager";
import { ConfigCards } from "./config-cards";
import { EmailPlan } from "./email-plan";
import { Header } from "./header";
import { InterpretationGuide } from "./interpretation-guide";
import { ResultsTabs } from "./results-tabs";
import { SummaryMetrics } from "./summary-metrics";

export function Calculator() {
  const [config, setConfig] = useState<CampaignConfig>(defaultConfig);
  const [loaded, setLoaded] = useState(false);

  // Load saved plan on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const saved = raw ? sanitizeConfig(JSON.parse(raw)) : null;
      if (saved) setConfig(saved);
    } catch {
      // Corrupt or blocked storage — fall back to defaults.
    }
    setLoaded(true);
  }, []);

  // Persist on every change (after the initial load so defaults don't overwrite a saved plan).
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch {
      // Storage full or unavailable — the app still works, it just won't persist.
    }
  }, [config, loaded]);

  // Name the PDF "Incremental Reach Report" when printing.
  useEffect(() => {
    let prev = document.title;
    const before = () => {
      prev = document.title;
      document.title = "Incremental Reach Report";
    };
    const after = () => {
      document.title = prev;
    };
    window.addEventListener("beforeprint", before);
    window.addEventListener("afterprint", after);
    return () => {
      window.removeEventListener("beforeprint", before);
      window.removeEventListener("afterprint", after);
    };
  }, []);

  const result = useMemo(() => calculateCampaign(config), [config]);
  const curve = useMemo(() => reachCurve(config, result), [config, result]);
  const resultById = useMemo(() => new Map(result.channelResults.map((r) => [r.channel.id, r])), [result]);
  const activeChannels = useMemo(() => config.channels.filter((c) => c.enabled), [config.channels]);

  const updateChannel = useCallback((id: string, patch: Partial<Channel>) => {
    setConfig((c) => ({ ...c, channels: c.channels.map((ch) => (ch.id === id ? { ...ch, ...patch } : ch)) }));
  }, []);
  const removeChannel = useCallback((id: string) => {
    setConfig((c) => ({ ...c, channels: c.channels.filter((ch) => ch.id !== id) }));
  }, []);
  const addChannel = useCallback(() => {
    setConfig((c) => (c.channels.length >= MAX_CHANNELS ? c : { ...c, channels: [...c.channels, newChannel(c.channels)] }));
  }, []);

  function reset() {
    if (window.confirm("Reset all inputs to the default plan? Your current channels will be replaced.")) {
      setConfig(defaultConfig());
    }
  }

  async function signOut() {
    await fetch("/api/logout", { method: "POST" }).catch(() => undefined);
    window.location.assign("/login");
  }

  return (
    <div className="min-h-screen">
      <Header onReset={reset} onExport={() => window.print()} onSignOut={signOut} />
      <main className="container space-y-5 py-6 print:max-w-none print:space-y-4 print:px-0 print:py-2">
        <ConfigCards
          universe={config.universe}
          overlapPct={config.overlapPct}
          onUniverse={(universe) => setConfig((c) => ({ ...c, universe }))}
          onOverlap={(overlapPct) => setConfig((c) => ({ ...c, overlapPct }))}
        />
        <ChannelManager
          channels={config.channels}
          universe={config.universe}
          currency={config.currency}
          onCurrency={(currency) => setConfig((c) => ({ ...c, currency }))}
          results={resultById}
          onUpdate={updateChannel}
          onRemove={removeChannel}
          onAdd={addChannel}
        />
        <SummaryMetrics result={result} currency={config.currency} />
        <ResultsTabs
          result={result}
          curve={curve}
          activeChannels={activeChannels}
          overlapPct={config.overlapPct}
          universe={config.universe}
          currency={config.currency}
        />
        <InterpretationGuide />
        <Benchmarks />
        <EmailPlan config={config} />
        <footer className="pb-4 pt-2 text-center text-xs text-muted-foreground">
          Estimates use the Total Overlap Model with a single global overlap assumption. Plans are saved in this browser only.
        </footer>
      </main>
    </div>
  );
}
