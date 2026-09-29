import React, { useState } from 'react';
import {
  Award,
  Sparkles,
  Gift,
  CheckCircle2,
  Lock,
  ChevronRight,
  TrendingUp,
  Star,
  Info,
  Calendar,
  Tag,
  Scissors,
  Copy,
  Check,
} from 'lucide-react';
import type { CustomerLoyaltyData, LoyaltyPerk } from '../types';

interface Props {
  loyalty: CustomerLoyaltyData;
  onBookNext?: () => void;
}

export const LoyaltyRewardsModule: React.FC<Props> = ({ loyalty, onBookNext }) => {
  const [selectedPerk, setSelectedPerk] = useState<LoyaltyPerk | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'perks' | 'activity' | 'earn'>('perks');

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const getTierIcon = (tier: string) => {
    if (tier.includes('Gold') || tier.includes('VIP')) {
      return <Award className="w-5 h-5 text-[#D4AF37]" />;
    }
    if (tier.includes('Silver')) {
      return <Sparkles className="w-5 h-5 text-[#E0E0E0]" />;
    }
    return <Star className="w-5 h-5 text-[#CD7F32]" />;
  };

  return (
    <div className="bg-[#181818] border border-[#2B2925] rounded-sm overflow-hidden shadow-sm">
      {/* Top Banner: Tier & Points Overview */}
      <div className="bg-gradient-to-r from-[#1C1A17] via-[#221F1B] to-[#1C1A17] p-6 sm:p-8 border-b border-[#2E2820]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Left: Tier & Name */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-[#BFA57D] bg-[#2A241C] px-2.5 py-1 rounded-sm border border-[#3E3425]">
                {getTierIcon(loyalty.tier)}
                <span>{loyalty.tier}</span>
              </span>
              <span className="text-[11px] text-[#8C8273]">
                Member #{loyalty.customerId.slice(-6).toUpperCase()}
              </span>
            </div>

            <h3 className="font-serif-heading text-2xl sm:text-3xl text-[#F5F1EA]">
              The Salon Circle Rewards
            </h3>
            <p className="text-xs text-[#A69B8D] max-w-md">
              Earn 1 point for every £1 spent at George Davis Hairdressing. Unlock complimentary treatments, bespoke finishes, and salon credits.
            </p>
          </div>

          {/* Right: Points Balance Box */}
          <div className="bg-[#121211] border border-[#3A3328] rounded-sm p-4 sm:p-5 flex items-center gap-6 shrink-0">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-[#8C8273] block">
                Available Balance
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="font-serif-heading text-3xl sm:text-4xl text-[#F5F1EA] font-mono-numbers">
                  {loyalty.pointsBalance}
                </span>
                <span className="text-xs font-semibold text-[#BFA57D]">pts</span>
              </div>
              <span className="text-[10px] text-[#A69B8D] block mt-0.5">
                {loyalty.totalVisits} visit{loyalty.totalVisits === 1 ? '' : 's'} recorded
              </span>
            </div>

            <div className="border-l border-[#2B2925] pl-6 space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-[#8C8273] block">
                Total Spend
              </span>
              <span className="text-sm font-semibold text-[#D9D1C5] font-mono-numbers block">
                £{loyalty.totalSpend.toFixed(2)}
              </span>
              <span className="text-[10px] text-[#8C8273] block">
                +50 Welcome Bonus
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar towards Next Tier / Perk */}
        <div className="mt-6 pt-6 border-t border-[#262420] space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#D9D1C5] flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-[#BFA57D]" />
              <span>
                Tier Progress:{' '}
                <strong className="text-[#F5F1EA]">{loyalty.tier}</strong> →{' '}
                <span className="text-[#BFA57D]">{loyalty.nextTier}</span>
              </span>
            </span>
            <span className="text-xs font-mono text-[#A69B8D]">
              {loyalty.pointsBalance} / {loyalty.nextTierThreshold} pts ({loyalty.progressPercent}%)
            </span>
          </div>

          <div className="w-full bg-[#11100E] h-2.5 rounded-full overflow-hidden border border-[#2B2925]">
            <div
              className="bg-gradient-to-r from-[#9B8058] to-[#D4AF37] h-full transition-all duration-500 rounded-full"
              style={{ width: `${loyalty.progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#8C8273] pt-0.5">
            {loyalty.pointsToNextReward > 0 ? (
              <span>
                Earn just <strong className="text-[#BFA57D]">{loyalty.pointsToNextReward} more points</strong> on your next visit to unlock the next exclusive perk!
              </span>
            ) : (
              <span className="text-emerald-400 font-medium">
                You have reached maximum tier perks! Redeem any perk below.
              </span>
            )}
            <span className="font-mono text-[10px]">
              Next milestone at {loyalty.nextTierThreshold} pts
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 px-6 sm:px-8 border-b border-[#262420] bg-[#141414] text-xs font-medium">
        <button
          onClick={() => setActiveTab('perks')}
          className={`py-3.5 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'perks'
              ? 'border-[#9B8058] text-[#F5F1EA] font-semibold'
              : 'border-transparent text-[#8C8273] hover:text-[#D9D1C5]'
          }`}
        >
          <Gift className="w-3.5 h-3.5" />
          <span>Exclusive Perks ({loyalty.perks.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={`py-3.5 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'activity'
              ? 'border-[#9B8058] text-[#F5F1EA] font-semibold'
              : 'border-transparent text-[#8C8273] hover:text-[#D9D1C5]'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Points Activity</span>
        </button>
        <button
          onClick={() => setActiveTab('earn')}
          className={`py-3.5 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'earn'
              ? 'border-[#9B8058] text-[#F5F1EA] font-semibold'
              : 'border-transparent text-[#8C8273] hover:text-[#D9D1C5]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>How to Earn</span>
        </button>
      </div>

      {/* Tab 1: Perks Catalogue */}
      {activeTab === 'perks' && (
        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between text-xs text-[#A69B8D]">
            <span>Click any unlocked perk to reveal your salon redemption voucher code.</span>
            <span className="text-[11px] text-[#BFA57D]">Redeemable at reception or checkout</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loyalty.perks.map((perk) => {
              const isUnlocked = perk.unlocked;
              const pointsNeeded = Math.max(0, perk.pointsRequired - loyalty.pointsBalance);

              return (
                <div
                  key={perk.id}
                  onClick={() => isUnlocked && setSelectedPerk(perk)}
                  className={`border rounded-sm p-5 transition-all flex flex-col justify-between ${
                    isUnlocked
                      ? 'bg-[#1C1A17] border-[#3E3529] hover:border-[#9B8058] cursor-pointer shadow-xs'
                      : 'bg-[#141414] border-[#222] opacity-75'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-[10px] uppercase tracking-wider text-[#BFA57D] font-semibold bg-[#26221B] px-2 py-0.5 rounded">
                        {perk.category}
                      </span>
                      {isUnlocked ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-900/60 px-2 py-0.5 rounded-sm">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Unlocked</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-[#8C8273] bg-[#1C1C1C] px-2 py-0.5 rounded-sm border border-[#2B2925]">
                          <Lock className="w-3 h-3" />
                          <span>{pointsNeeded} pts to go</span>
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="font-serif-heading text-lg text-[#F5F1EA]">
                        {perk.title}
                      </h4>
                      <p className="text-xs text-[#A69B8D] leading-relaxed mt-1">
                        {perk.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-[#262420] flex items-center justify-between">
                    <span className="text-xs font-mono font-semibold text-[#D9D1C5]">
                      {perk.pointsRequired} Points
                    </span>

                    {isUnlocked ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPerk(perk);
                        }}
                        className="text-xs font-semibold text-[#141414] bg-[#9B8058] hover:bg-[#856C47] px-3.5 py-1.5 rounded-sm transition-colors flex items-center gap-1"
                      >
                        <span>Claim Voucher</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    ) : (
                      <span className="text-[11px] text-[#736B5E]">
                        Requires {perk.pointsRequired} pts
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Activity History */}
      {activeTab === 'activity' && (
        <div className="p-6 sm:p-8 space-y-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[#BFA57D]">
            Points Earning History
          </h4>

          {loyalty.history.length === 0 ? (
            <div className="bg-[#141414] border border-[#262626] rounded-sm p-6 text-center text-xs text-[#8C8273]">
              <p>Your welcome 50 points have been credited! Points will accrue with each completed salon treatment.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#242424] border border-[#242424] rounded-sm overflow-hidden bg-[#141414]">
              {loyalty.history.map((item, index) => (
                <div key={index} className="p-4 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-[#F5F1EA] block">{item.service_name}</span>
                    <span className="text-[#8C8273] text-[11px]">
                      Ref: {item.booking_reference} · {new Date(item.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-emerald-400 font-semibold block">
                      +{item.points_earned} pts
                    </span>
                    <span className="text-[10px] text-[#8C8273]">
                      £{item.amount.toFixed(2)} spend
                    </span>
                  </div>
                </div>
              ))}
              <div className="p-4 flex items-center justify-between text-xs bg-[#181715]">
                <div>
                  <span className="font-semibold text-[#F5F1EA] block">Salon Circle Welcome Bonus</span>
                  <span className="text-[#8C8273] text-[11px]">Initial member onboarding reward</span>
                </div>
                <div className="text-right">
                  <span className="font-mono text-emerald-400 font-semibold block">
                    +{loyalty.welcomeBonus} pts
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: How to Earn */}
      {activeTab === 'earn' && (
        <div className="p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#141414] border border-[#262626] rounded-sm p-5 space-y-2">
              <div className="w-8 h-8 rounded-full bg-[#26221B] flex items-center justify-center text-[#BFA57D]">
                <Tag className="w-4 h-4" />
              </div>
              <h5 className="font-semibold text-xs text-[#F5F1EA]">Every £1 = 1 Point</h5>
              <p className="text-[11px] text-[#8C8273] leading-relaxed">
                Points automatically accrue on every precision cut, curl specialty session, colour transformation, and hair replacement refusion.
              </p>
            </div>

            <div className="bg-[#141414] border border-[#262626] rounded-sm p-5 space-y-2">
              <div className="w-8 h-8 rounded-full bg-[#26221B] flex items-center justify-center text-[#BFA57D]">
                <Calendar className="w-4 h-4" />
              </div>
              <h5 className="font-semibold text-xs text-[#F5F1EA]">Re-booking Bonus (+25)</h5>
              <p className="text-[11px] text-[#8C8273] leading-relaxed">
                Schedule your next follow-up appointment within 6 weeks to earn a 25-point loyalty boost upon completion.
              </p>
            </div>

            <div className="bg-[#141414] border border-[#262626] rounded-sm p-5 space-y-2">
              <div className="w-8 h-8 rounded-full bg-[#26221B] flex items-center justify-center text-[#BFA57D]">
                <Sparkles className="w-4 h-4" />
              </div>
              <h5 className="font-semibold text-xs text-[#F5F1EA]">Seasonal Perks (+50)</h5>
              <p className="text-[11px] text-[#8C8273] leading-relaxed">
                Receive special surprise point multipliers during your birthday month and seasonal styling masterclasses.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Perk Redemption Voucher Modal */}
      {selectedPerk && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#181818] border border-[#3E3529] rounded-sm max-w-md w-full p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#262420] pb-4">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-[#BFA57D]" />
                <h3 className="font-serif-heading text-xl text-[#F5F1EA]">
                  Redeem Salon Perk
                </h3>
              </div>
              <button
                onClick={() => setSelectedPerk(null)}
                className="text-xs text-[#8C8273] hover:text-white"
              >
                Close
              </button>
            </div>

            <div className="space-y-4 text-xs text-[#D9D1C5]">
              <div className="bg-[#1C1A17] border border-[#3A3328] p-4 rounded-sm space-y-2">
                <span className="text-[10px] uppercase tracking-wider text-[#BFA57D] font-semibold block">
                  Reward Selected
                </span>
                <h4 className="font-serif-heading text-lg text-[#F5F1EA]">
                  {selectedPerk.title}
                </h4>
                <p className="text-xs text-[#A69B8D]">
                  {selectedPerk.description}
                </p>
              </div>

              {/* Voucher Code Box */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase tracking-wider text-[#8C8273] block">
                  Your Reception Voucher Code:
                </span>
                {(() => {
                  const voucherCode = `GD-PERK-${selectedPerk.id.toUpperCase()}-${loyalty.customerId.slice(-4).toUpperCase()}`;
                  const isCopied = copiedCode === voucherCode;
                  return (
                    <div className="flex items-center gap-2 bg-[#11100E] border border-[#3E3529] p-3 rounded-sm font-mono text-sm text-[#F5F1EA] justify-between">
                      <span className="tracking-wider font-semibold text-[#BFA57D]">
                        {voucherCode}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyCode(voucherCode)}
                        className="text-xs text-[#8C8273] hover:text-white flex items-center gap-1 transition-colors"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400 text-[11px]">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span className="text-[11px]">Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })()}
              </div>

              <div className="text-[11px] text-[#8C8273] space-y-1 pt-2">
                <p>• Simply present or mention this voucher code to reception at 14 St John Street or upon checkout.</p>
                <p>• Points are deducted only once the voucher is processed with your stylist.</p>
              </div>
            </div>

            <div className="pt-4 border-t border-[#262420] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedPerk(null)}
                className="px-4 py-2 text-xs font-semibold text-[#141414] bg-[#9B8058] hover:bg-[#856C47] rounded-sm transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
