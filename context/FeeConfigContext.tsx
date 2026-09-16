import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api } from '../api/client';
import { useMySubscriptionsQuery } from '../api/subscriptions';

// Ported from MboaTrustFrontend/src/feeConfig.tsx — same real backend sync,
// same shared calculator every fee-bearing screen should call rather than
// computing its own fee math (a hardcoded/fabricated rate previously shown
// on FundProjectScreen — 2.5% "add on top" — didn't match the real backend
// behavior at all: the funder is charged exactly the amount they enter, and
// a 2%-by-default *deducted* fee determines how much actually reaches
// escrow; see projectController.fundProject + feeService.calculateFee).

export interface ForeignCurrency {
  code: string;
  label: string;
  /** Mock rate: how many XAF 1 unit of this currency buys. */
  xafRate: number;
}

export interface FeeConfig {
  transactionFeeRate: number; // milestone release platform fee, e.g. 0.03 = 3%
  fundingFeeRate: number; // fee taken when a funder sends money into escrow, e.g. 0.02 = 2%
  contractorSuccessFeeRate: number; // contractor milestone payout success fee, e.g. 0.05 = 5%
  landSuccessFeeRate: number; // land sale success fee, e.g. 0.02 = 2%
  verifierVisitFee: number; // flat, XAF — in-person verifier visit add-on (funding + land)
  perBidFee: number; // flat, XAF — per-bid fee for contractors without an active Pro Contractor subscription
  listingFee: number; // flat, XAF — publish a land listing
  foreignCurrencies: ForeignCurrency[];
}

export const DEFAULT_FEE_CONFIG: FeeConfig = {
  transactionFeeRate: 0.03,
  fundingFeeRate: 0.02,
  contractorSuccessFeeRate: 0.03,
  landSuccessFeeRate: 0.03,
  verifierVisitFee: 15000,
  perBidFee: 2000,
  listingFee: 20000,
  foreignCurrencies: [
    { code: 'EUR', label: 'Euro (EUR)', xafRate: 655.96 },
    { code: 'USD', label: 'US Dollar (USD)', xafRate: 610.25 },
  ],
};

interface FeeConfigContextValue {
  config: FeeConfig;
}

const FeeConfigContext = createContext<FeeConfigContextValue>({ config: DEFAULT_FEE_CONFIG });

interface BackendFeeConfig { feeType: string; value: number; isFlat: boolean }

export function FeeConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<FeeConfig>(DEFAULT_FEE_CONFIG);

  // transactionFeeRate/landSuccessFeeRate/contractorSuccessFeeRate all sync
  // to the one real backend rate that actually gets charged on release —
  // feeService.calculateFee('milestone_release', ...) is the only fee
  // applied when escrow pays out, whether the payee is a contractor
  // (tender) or a land seller (land_purchase). fundingFeeRate syncs to the
  // real project_funding rate charged when a funder sends money in. The
  // remaining flat fees (verifierVisitFee, perBidFee, listingFee) have no
  // backend config route to sync from — they stay local, hand-kept in sync
  // with the equivalent server-side constants, same as web.
  useEffect(() => {
    api.get<{ data: BackendFeeConfig[] }>('/fee-config').then(({ data }) => {
      const milestoneRelease = data.data.find((c) => c.feeType === 'milestone_release');
      const projectFunding = data.data.find((c) => c.feeType === 'project_funding');
      setConfig((c) => ({
        ...c,
        ...(milestoneRelease ? { transactionFeeRate: milestoneRelease.value, landSuccessFeeRate: milestoneRelease.value, contractorSuccessFeeRate: milestoneRelease.value } : {}),
        ...(projectFunding ? { fundingFeeRate: projectFunding.value } : {}),
      }));
    }).catch((err) => console.error('[feeConfig] failed to load real fee rates', err));
  }, []);

  return <FeeConfigContext.Provider value={{ config }}>{children}</FeeConfigContext.Provider>;
}

export const useFeeConfig = () => useContext(FeeConfigContext);

export function pct(rate: number) {
  const p = rate * 100;
  return `${Number.isInteger(p) ? p : Math.round(p * 10) / 10}%`;
}

export interface FeeResult {
  kind: 'percentage' | 'flat';
  mode: 'deduct' | 'add';
  amount: number;
  feeRate?: number;
  feeAmount: number;
  resultAmount: number;
  amountLabel: string;
  feeLabel: string;
  resultLabel: string;
}

export function calculateFee(params: {
  amount?: number;
  feeRate?: number;
  flatFee?: number;
  amountLabel?: string;
  feeLabel: string;
  resultLabel: string;
  mode?: 'deduct' | 'add';
}): FeeResult {
  const {
    amount = 0,
    feeRate,
    flatFee,
    amountLabel = 'Amount',
    feeLabel,
    resultLabel,
  } = params;
  const kind: FeeResult['kind'] = feeRate !== undefined ? 'percentage' : 'flat';
  const mode = params.mode ?? (kind === 'percentage' ? 'deduct' : 'add');
  const feeAmount = kind === 'percentage' ? Math.round(amount * (feeRate ?? 0)) : Math.round(flatFee ?? 0);
  const resultAmount = mode === 'deduct' ? amount - feeAmount : amount + feeAmount;

  return { kind, mode, amount, feeRate, feeAmount, resultAmount, amountLabel, feeLabel, resultLabel };
}

/**
 * Pillar-specific convenience calculators, all built on `calculateFee` and all
 * reading live rates from FeeConfigContext. This is the single call site every
 * screen should use — no screen computes fee math on its own.
 */
export function useFeeCalculation() {
  const { config } = useFeeConfig();
  const { data: subscriptions = [] } = useMySubscriptionsQuery();
  const hasProContractorPlan = subscriptions.some((s) => s.planType === 'pro_contractor' && s.status === 'active');

  return useMemo(() => ({
    config,

    /** Funding pillar — releasing an approved milestone from escrow. */
    milestoneRelease: (amount: number, amountLabel = 'Milestone amount') =>
      calculateFee({
        amount, feeRate: config.transactionFeeRate, mode: 'deduct', amountLabel,
        feeLabel: `Platform fee (${pct(config.transactionFeeRate)})`,
        resultLabel: 'Contractor receives',
      }),

    /** Funding pillar — sending money into escrow. The funder is charged
     * `amount`, but only `resultAmount` (net of fee) is credited to the
     * project — see projectController.fundProject. */
    projectFunding: (amount: number, amountLabel = 'Amount to send') =>
      calculateFee({
        amount, feeRate: config.fundingFeeRate, mode: 'deduct', amountLabel,
        feeLabel: `Platform fee (${pct(config.fundingFeeRate)})`,
        resultLabel: 'Reaches escrow',
      }),

    /** Funding + land pillar — optional in-person verifier visit add-on. */
    verifierVisit: () =>
      calculateFee({
        flatFee: config.verifierVisitFee, mode: 'add',
        amountLabel: 'Verifier visit fee',
        feeLabel: 'In-person verifier visit',
        resultLabel: 'Add-on cost',
      }),

    /** Contractor pillar — per-bid fee, waived for an active Pro Contractor
     * subscription. */
    perBid: () =>
      calculateFee({
        flatFee: hasProContractorPlan ? 0 : config.perBidFee, mode: 'add',
        amountLabel: 'Per-bid fee',
        feeLabel: hasProContractorPlan ? 'Included in Pro Contractor plan' : 'Per-bid fee',
        resultLabel: 'Total to submit bid',
      }),

    /** Contractor pillar — success fee on a milestone payout. */
    contractorPayout: (amount: number, amountLabel = 'Milestone payout') =>
      calculateFee({
        amount, feeRate: config.contractorSuccessFeeRate, mode: 'deduct', amountLabel,
        feeLabel: `Platform success fee (${pct(config.contractorSuccessFeeRate)})`,
        resultLabel: 'You receive',
      }),

    /** Land pillar — publishing a listing. */
    listingFee: () =>
      calculateFee({
        flatFee: config.listingFee, mode: 'add',
        amountLabel: 'Listing fee',
        feeLabel: 'Platform listing fee',
        resultLabel: 'Total to publish',
      }),

    /** Land pillar — success fee once a sale completes. */
    landSale: (amount: number, amountLabel = 'Sale price') =>
      calculateFee({
        amount, feeRate: config.landSuccessFeeRate, mode: 'deduct', amountLabel,
        feeLabel: `Platform success fee (${pct(config.landSuccessFeeRate)})`,
        resultLabel: 'Seller receives',
      }),
  }), [config, hasProContractorPlan]);
}
