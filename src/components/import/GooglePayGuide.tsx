import React from 'react';
import { ShieldCheck, AlertCircle, FileSpreadsheet, ArrowRight } from 'lucide-react';

interface GooglePayGuideProps {
  onOpenImportModal: () => void;
}

export const GooglePayGuide: React.FC<GooglePayGuideProps> = ({ onOpenImportModal }) => {
  return (
    <div className="bg-white border border-charcoal-200 rounded-lg p-6 shadow-subtle space-y-6">
      {/* Title & Trust Philosophy */}
      <div className="border-b border-charcoal-100 pb-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-forest-700" />
          <h3 className="text-base font-semibold text-charcoal-900">
            Payment Sources & Google Pay Integration
          </h3>
        </div>
        <p className="text-xs text-charcoal-500 mt-1 leading-relaxed">
          How SpendSense safely incorporates transactions from Google Pay, UPI, and bank accounts without compromising privacy.
        </p>
      </div>

      {/* Honest Technical Transparency Notice */}
      <div className="p-4 rounded-md border border-charcoal-200 bg-paper-50 space-y-2 text-xs">
        <div className="flex items-center gap-2 text-charcoal-900 font-semibold">
          <AlertCircle className="w-4 h-4 text-charcoal-600 shrink-0" />
          <span>Security & Direct Access Transparency</span>
        </div>
        <p className="text-charcoal-600 leading-relaxed">
          Google Pay processes peer-to-peer and merchant payments directly through UPI and tokenized bank rails.
          <strong> Google does not provide a public client-side web API</strong> that allows third-party websites to extract your real-time transaction ledger.
        </p>
        <div className="pt-2 text-charcoal-600">
          <p className="font-semibold text-charcoal-800 mb-1">Our Architectural Guarantee:</p>
          <ul className="list-disc list-inside space-y-0.5 text-charcoal-600 pl-1">
            <li>We <strong>never</strong> ask for your Google credentials, passwords, or two-factor codes.</li>
            <li>We <strong>never</strong> request or store UPI PINs or debit card security codes.</li>
            <li>We <strong>do not</strong> silently scrape or intercept private SMS feeds.</li>
            <li>We <strong>do not</strong> fake a live connection when none exists.</li>
          </ul>
        </div>
      </div>

      {/* Recommended Supported Workflows */}
      <div className="space-y-4">
        <h4 className="text-xs font-semibold text-charcoal-700 uppercase tracking-wider">
          Supported Import Workflows
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Method 1: Statement / UPI Export CSV */}
          <div className="p-4 rounded-md border border-charcoal-200 bg-white hover:border-forest-700/50 transition-colors space-y-2">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-forest-700" />
              <h5 className="text-xs font-semibold text-charcoal-900">
                1. Bank Statement or Google Pay Export
              </h5>
            </div>
            <p className="text-[11px] text-charcoal-600 leading-relaxed">
              Export your monthly statement (CSV or Excel) from your bank app (HDFC, SBI, ICICI, Axis, Chase, etc.) or Google Takeout.
              Our parser automatically maps columns and flags duplicate transactions.
            </p>
            <button
              type="button"
              onClick={onOpenImportModal}
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-forest-800 hover:text-forest-900"
            >
              <span>Launch CSV Import</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Method 2: Rapid Manual Logging */}
          <div className="p-4 rounded-md border border-charcoal-200 bg-white hover:border-forest-700/50 transition-colors space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-forest-800 text-white flex items-center justify-center font-bold text-[10px]">
                +
              </div>
              <h5 className="text-xs font-semibold text-charcoal-900">
                2. Instant Purchase Logging
              </h5>
            </div>
            <p className="text-[11px] text-charcoal-600 leading-relaxed">
              Whenever you complete a payment in Google Pay, open SpendSense and tap <strong>Add expense</strong>.
              With numeric optimization, recording a purchase takes less than 5 seconds.
            </p>
            <span className="inline-block text-[11px] font-medium text-forest-700 mt-2">
              Available instantly on any mobile or desktop browser
            </span>
          </div>
        </div>
      </div>

      {/* Future Account Aggregator / Open Banking Pathway */}
      <div className="border-t border-charcoal-100 pt-4 text-xs text-charcoal-500 space-y-1">
        <p className="font-semibold text-charcoal-800">
          Future Institutional Pathway (RBI Account Aggregator / Open Banking)
        </p>
        <p className="leading-relaxed">
          SpendSense includes modular backend hooks designed for regulated Account Aggregator frameworks (such as Sahamati / Setu / Plaid). When an enterprise API key is provisioned, users can optionally grant cryptographic, read-only consent to sync accounts securely.
        </p>
      </div>
    </div>
  );
};
