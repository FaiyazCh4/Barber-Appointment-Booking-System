import React, { useState } from 'react';
import { Mail, CheckCircle2, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { subscribeNewsletter } from '../api/client';

export const NewsletterSignup: React.FC = () => {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@') || !email.includes('.')) {
      setStatus('error');
      setMessage('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setStatus('idle');
    setMessage('');

    try {
      const res = await subscribeNewsletter(email, firstName);
      setStatus('success');
      setMessage(res.message);
      setEmail('');
      setFirstName('');
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-[#181613] border border-[#2E2922] rounded-lg p-6 sm:p-8 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left Column: Heading and Description */}
        <div className="max-w-xl space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#BFA57D]">
            <Sparkles className="w-3.5 h-3.5 text-[#9B8058]" />
            <span>The Salon Circle</span>
          </div>
          <h3 className="font-serif-heading text-xl sm:text-2xl text-[#F5F1EA] tracking-wide font-normal">
            Seasonal Hair Care, Trend Insights & Priority Inquiries
          </h3>
          <p className="text-xs sm:text-sm text-[#A69B8D] leading-relaxed">
            Join our mailing list to receive quarterly styling advice, holiday booking calendar alerts, and bespoke formulation previews from our Bromsgrove team.
          </p>
        </div>

        {/* Right Column: Form or Success Confirmation */}
        <div className="w-full lg:max-w-md">
          {status === 'success' ? (
            <div className="bg-[#1F1C18] border border-emerald-900/60 rounded-md p-4 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="text-xs font-semibold text-emerald-300 block">Subscription Confirmed</span>
                <p className="text-xs text-[#D9D1C5] leading-relaxed">{message}</p>
                <button
                  type="button"
                  onClick={() => setStatus('idle')}
                  className="text-[11px] text-[#BFA57D] hover:underline pt-1 block"
                >
                  Subscribe another email
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-2.5">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8C8273]">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    aria-label="Email address for salon newsletter"
                    className="w-full bg-[#11100E] border border-[#3A342B] focus:border-[#BFA57D] focus:ring-1 focus:ring-[#BFA57D] rounded-md pl-9 pr-3 py-2.5 text-xs text-[#F5F1EA] placeholder-[#6E6557] outline-none transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="bg-[#9B8058] hover:bg-[#856D48] active:bg-[#725C3A] text-[#141414] font-medium text-xs px-5 py-2.5 rounded-md transition-all flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Subscribing...</span>
                    </>
                  ) : (
                    <>
                      <span>Join Circle</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>

              {status === 'error' && (
                <p className="text-xs text-red-400 pl-1">{message}</p>
              )}

              <p className="text-[11px] text-[#736B5E] pl-0.5">
                We strictly protect your privacy. No spam, unsubscribe anytime.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
