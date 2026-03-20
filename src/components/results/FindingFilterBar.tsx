"use client";

import { useTranslation } from "react-i18next";
import type { FindingFilters } from "@/hooks/useFindingFilters";
import type { AdversaryTier, TemporalityClass } from "@/lib/types";

const ADVERSARY_TIERS: AdversaryTier[] = ["passive_observer", "kyc_exchange", "state_adversary"];
const TEMPORALITY_CLASSES: TemporalityClass[] = ["historical", "ongoing_pattern", "active_risk"];

const ADV_LABELS: Record<AdversaryTier, string> = {
  passive_observer: "Public",
  kyc_exchange: "KYC",
  state_adversary: "State",
};

const TEMP_LABELS: Record<TemporalityClass, string> = {
  historical: "Past",
  ongoing_pattern: "Pattern",
  active_risk: "Active",
};

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-[10px] px-2 py-0.5 rounded border transition-colors cursor-pointer ${
        active
          ? "bg-surface-elevated text-foreground border-card-border"
          : "bg-transparent text-muted/50 border-card-border/50 line-through"
      }`}
    >
      {label}
    </button>
  );
}

export function FindingFilterBar({ filters }: { filters: FindingFilters }) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-1">
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-muted uppercase tracking-wider mr-1">
          {t("results.filterByAdversary", { defaultValue: "Filter by adversary" })}
        </span>
        {ADVERSARY_TIERS.map((tier) => (
          <FilterChip
            key={tier}
            label={t(`adversary.${tier}`, { defaultValue: ADV_LABELS[tier] })}
            active={filters.activeAdversary.has(tier)}
            onClick={() => filters.toggleAdversary(tier)}
          />
        ))}
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-muted uppercase tracking-wider mr-1">
          {t("results.filterByTemporality", { defaultValue: "Filter by temporality" })}
        </span>
        {TEMPORALITY_CLASSES.map((cls) => (
          <FilterChip
            key={cls}
            label={t(`temporality.${cls}`, { defaultValue: TEMP_LABELS[cls] })}
            active={filters.activeTemporality.has(cls)}
            onClick={() => filters.toggleTemporality(cls)}
          />
        ))}
      </div>
      {filters.isFiltering && (
        <span className="text-[10px] text-muted italic">
          {t("results.filterNote", { defaultValue: "Score includes all findings" })}
        </span>
      )}
    </div>
  );
}
