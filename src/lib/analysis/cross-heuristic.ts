/**
 * Cross-heuristic intelligence barrel export.
 *
 * The implementation has been modularized into cross-heuristic/ subdirectory:
 * - coinjoin-suppressions.ts - CoinJoin/Stonewall finding suppressions
 * - compound-scoring.ts - corroboration boosts and post-mix entity escalation
 * - wallet-rules.ts - wallet fingerprint contradiction detection
 * - behavioral-rollup.ts - multi-signal behavioral fingerprint rollup
 * - deterministic-cap.ts - deterministic failure score cap
 * - utils.ts - shared suppressFinding helper
 * - index.ts - orchestrator + multisig/consolidation dedup + classifyTransactionType
 */
export { applyCrossHeuristicRules, classifyTransactionType } from "./cross-heuristic/index";
