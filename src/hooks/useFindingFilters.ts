import { useState, useMemo, useCallback } from "react";
import type { Finding, AdversaryTier, TemporalityClass } from "@/lib/types";
import { highestAdversaryTier } from "@/lib/analysis/finding-metadata";

const ALL_ADVERSARY: AdversaryTier[] = ["passive_observer", "kyc_exchange", "state_adversary"];
const ALL_TEMPORALITY: TemporalityClass[] = ["historical", "ongoing_pattern", "active_risk"];

export interface FindingFilters {
  /** Currently active adversary tiers */
  activeAdversary: Set<AdversaryTier>;
  /** Currently active temporality classes */
  activeTemporality: Set<TemporalityClass>;
  /** Whether any filter is actively narrowing results */
  isFiltering: boolean;
  /** Toggle an adversary tier on/off (won't allow all to be deselected) */
  toggleAdversary: (tier: AdversaryTier) => void;
  /** Toggle a temporality class on/off (won't allow all to be deselected) */
  toggleTemporality: (cls: TemporalityClass) => void;
  /** Apply filters to a list of findings */
  apply: (findings: Finding[]) => Finding[];
}

/** Shared finding filter state for adversary tiers and temporality classes. */
export function useFindingFilters(): FindingFilters {
  const [activeAdversary, setActiveAdversary] = useState<Set<AdversaryTier>>(new Set(ALL_ADVERSARY));
  const [activeTemporality, setActiveTemporality] = useState<Set<TemporalityClass>>(new Set(ALL_TEMPORALITY));

  const isFiltering = activeAdversary.size < ALL_ADVERSARY.length || activeTemporality.size < ALL_TEMPORALITY.length;

  const toggleAdversary = useCallback((tier: AdversaryTier) => {
    setActiveAdversary((prev) => {
      const next = new Set(prev);
      if (next.has(tier)) {
        if (next.size > 1) next.delete(tier);
      } else {
        next.add(tier);
      }
      return next;
    });
  }, []);

  const toggleTemporality = useCallback((cls: TemporalityClass) => {
    setActiveTemporality((prev) => {
      const next = new Set(prev);
      if (next.has(cls)) {
        if (next.size > 1) next.delete(cls);
      } else {
        next.add(cls);
      }
      return next;
    });
  }, []);

  const apply = useCallback((findings: Finding[]) => {
    if (!isFiltering) return findings;
    return findings.filter((f) => {
      if (!f.adversaryTiers?.length || !f.temporality) return true;
      const tier = highestAdversaryTier(f.adversaryTiers);
      if (!activeAdversary.has(tier)) return false;
      if (!activeTemporality.has(f.temporality)) return false;
      return true;
    });
  }, [isFiltering, activeAdversary, activeTemporality]);

  return useMemo(() => ({
    activeAdversary,
    activeTemporality,
    isFiltering,
    toggleAdversary,
    toggleTemporality,
    apply,
  }), [activeAdversary, activeTemporality, isFiltering, toggleAdversary, toggleTemporality, apply]);
}
