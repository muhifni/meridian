/**
 * Smart Wallet Evolution
 *
 * Automatically discovers high-quality LP wallets from study data and
 * prunes underperforming ones. Runs at the end of each screening cycle.
 *
 * Add criteria:
 *   - win_rate >= 0.70
 *   - total_positions >= 2  (enough sample to trust)
 *   - avg_pnl_pct >= 20%
 *
 * Remove criteria:
 *   - win_rate < 0.40 AND total_positions_observed >= 5
 *   - not seen in any pool for > 30 days (stale)
 *
 * Limits:
 *   - Max 30 wallets total
 *   - Manually-added wallets (source !== "auto") are never auto-removed
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { log } from "./logger.js";
import { addSmartWallet, removeSmartWallet, listSmartWallets } from "./smart-wallets.js";
import { studyTopLPers } from "./tools/study.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WALLETS_PATH = path.join(__dirname, "smart-wallets.json");

const MAX_WALLETS          = 30;
const MIN_WIN_RATE_ADD     = 0.70;
const MIN_POSITIONS_ADD    = 2;
const MIN_AVG_PNL_ADD      = 20;   // percent
const MAX_WIN_RATE_REMOVE  = 0.40;
const MIN_POSITIONS_REMOVE = 5;    // need enough data before removing
const STALE_DAYS           = 30;

/**
 * Run wallet evolution for a list of pool addresses (top candidates from screening).
 * Discovers new wallets from study data, prunes bad ones.
 *
 * @param {string[]} poolAddresses - Pool addresses to study (top 3 from screening)
 * @returns {{ added: string[], removed: string[], skipped: number }}
 */
export async function evolveSmartWallets(poolAddresses = []) {
  const result = { added: [], removed: [], skipped: 0 };
  if (!poolAddresses.length) return result;

  // ── 1. Discover candidates from study data ──────────────────────
  const discovered = new Map(); // address → best summary seen across pools

  for (const poolAddr of poolAddresses.slice(0, 3)) {
    try {
      const study = await studyTopLPers({ pool_address: poolAddr, limit: 6 });
      for (const lper of study.lpers || []) {
        const s = lper.summary;
        if (!lper.owner) continue;

        const existing = discovered.get(lper.owner);
        // Keep the entry with the most positions seen (most data)
        if (!existing || s.total_positions > existing.total_positions) {
          discovered.set(lper.owner, {
            address: lper.owner,
            win_rate: s.win_rate ?? 0,
            total_positions: s.total_positions ?? 0,
            avg_pnl_pct: s.avg_open_pnl_pct ?? 0,
            preferred_strategy: s.preferred_strategy,
            pool: poolAddr,
            pool_name: study.pool_name,
          });
        }
      }
    } catch (err) {
      log("wallet_evo", `Study failed for ${poolAddr.slice(0, 8)}: ${err.message}`);
    }
  }

  // ── 2. Add qualifying new wallets ───────────────────────────────
  const { wallets: current } = listSmartWallets();
  const currentAddresses = new Set(current.map((w) => w.address));

  for (const [address, data] of discovered) {
    if (currentAddresses.has(address)) {
      // Already tracked — update stats silently
      _updateWalletStats(address, data);
      result.skipped++;
      continue;
    }

    const qualifies =
      data.win_rate >= MIN_WIN_RATE_ADD &&
      data.total_positions >= MIN_POSITIONS_ADD &&
      data.avg_pnl_pct >= MIN_AVG_PNL_ADD;

    if (!qualifies) continue;

    // Check capacity
    const { wallets: fresh } = listSmartWallets();
    if (fresh.length >= MAX_WALLETS) {
      log("wallet_evo", `Wallet list full (${MAX_WALLETS}) — skipping ${address.slice(0, 8)}`);
      break;
    }

    const safeName = (data.pool_name || "pool").replace(/[^a-zA-Z0-9]/g, "").slice(0, 10);
    const name = `auto_${safeName}_${address.slice(0, 6)}`;

    const addResult = addSmartWallet({
      name,
      address,
      category: "alpha",
      type: "lp",
      source: "auto",
      stats: {
        win_rate: data.win_rate,
        total_positions_observed: data.total_positions,
        avg_pnl_pct: data.avg_pnl_pct,
        preferred_strategy: data.preferred_strategy,
        first_seen_pool: data.pool,
        last_seen: new Date().toISOString(),
      },
    });

    if (addResult.success) {
      log("wallet_evo", `Added ${name} — win_rate=${(data.win_rate * 100).toFixed(0)}%, positions=${data.total_positions}, avg_pnl=${data.avg_pnl_pct.toFixed(1)}%`);
      result.added.push(name);
    }
  }

  // ── 3. Prune underperforming / stale wallets ────────────────────
  const { wallets: afterAdd } = listSmartWallets();
  const staleThreshold = Date.now() - STALE_DAYS * 24 * 60 * 60 * 1000;

  for (const wallet of afterAdd) {
    // Never auto-remove manually-added wallets
    if (wallet.source !== "auto") continue;

    const stats = wallet.stats || {};
    const positions = stats.total_positions_observed ?? 0;
    const winRate   = stats.win_rate ?? 1; // default to good if no data yet
    const lastSeen  = stats.last_seen ? new Date(stats.last_seen).getTime() : Date.now();

    const isUnderperforming = winRate < MAX_WIN_RATE_REMOVE && positions >= MIN_POSITIONS_REMOVE;
    const isStale = lastSeen < staleThreshold;

    if (isUnderperforming || isStale) {
      const reason = isUnderperforming
        ? `win_rate ${(winRate * 100).toFixed(0)}% < ${MAX_WIN_RATE_REMOVE * 100}% after ${positions} positions`
        : `not seen in ${STALE_DAYS} days`;
      log("wallet_evo", `Removing ${wallet.name} — ${reason}`);
      removeSmartWallet({ address: wallet.address });
      result.removed.push(wallet.name);
    }
  }

  if (result.added.length || result.removed.length) {
    const { wallets: final } = listSmartWallets();
    log("wallet_evo", `Evolution complete — added: ${result.added.length}, removed: ${result.removed.length}, total: ${final.length}`);
  }

  return result;
}

/**
 * Update stats on an already-tracked auto wallet when we see it again in study data.
 * Merges new observations using a rolling weighted average.
 */
function _updateWalletStats(address, newData) {
  try {
    if (!fs.existsSync(WALLETS_PATH)) return;
    const data = JSON.parse(fs.readFileSync(WALLETS_PATH, "utf8"));
    const wallet = data.wallets.find((w) => w.address === address);
    if (!wallet || wallet.source !== "auto") return;

    const stats = wallet.stats || {};
    const prevN = stats.total_positions_observed ?? 0;
    const newN  = newData.total_positions;
    if (newN <= prevN) return; // no new data

    // Rolling weighted average — weight toward newer data proportionally
    const weight = newN / (prevN + newN);
    stats.win_rate    = _lerp(stats.win_rate    ?? newData.win_rate,    newData.win_rate,    weight);
    stats.avg_pnl_pct = _lerp(stats.avg_pnl_pct ?? newData.avg_pnl_pct, newData.avg_pnl_pct, weight);
    stats.total_positions_observed = Math.max(prevN, newN);
    stats.last_seen = new Date().toISOString();
    wallet.stats = stats;

    fs.writeFileSync(WALLETS_PATH, JSON.stringify(data, null, 2));
  } catch { /* non-critical — don't break screening */ }
}

function _lerp(a, b, t) {
  return Number(((1 - t) * (a ?? b) + t * b).toFixed(4));
}
