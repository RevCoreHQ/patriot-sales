'use client';

import { useWizardStore } from '@/store/wizard';
import { useSettingsStore } from '@/store/settings';
import { buildLineItems, buildPoolLineItems, calculateTotals } from '@/lib/pricing';
import { formatCurrency } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { AnimatedNumber } from '@/components/motion/AnimatedNumber';

export function LiveQuoteSummary() {
  const wizard = useWizardStore();
  const { settings } = useSettingsStore();

  // Build all line items from current state
  const autoItems = buildLineItems(
    wizard.materialSelections,
    wizard.addonSelections,
    wizard.siteConditions,
    settings.pricing.demolitionRate,
    settings.pricing.materialPrices,
    settings.pricing.addonPrices,
  );
  const poolItems = wizard.poolConfig ? buildPoolLineItems(wizard.poolConfig) : [];
  const allItems = [...autoItems, ...poolItems, ...wizard.manualLineItems];

  const { subtotal, discountAmount, taxAmount, total } = wizard.priceOverride
    ? { subtotal: wizard.priceOverride, discountAmount: 0, taxAmount: wizard.priceOverride * (settings.pricing.taxRate / 100), total: wizard.priceOverride * (1 + settings.pricing.taxRate / 100) }
    : calculateTotals(allItems, wizard.discountPercent, settings.pricing.taxRate);

  const clientName = wizard.client.name || 'New Quote';

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-4 border-b border-c-border-inner">
        <div className="text-[10px] font-bold text-c-text-4 uppercase tracking-widest mb-1">Live Summary</div>
        <div className="text-sm font-bold text-c-text truncate">{clientName}</div>
        {wizard.projectTypes.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {wizard.projectTypes.map(pt => (
              <span key={pt} className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full capitalize font-medium">
                {pt.replace(/-/g, ' ')}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Line items */}
      <div className="flex-1 overflow-y-auto px-5 py-3">
        {allItems.length === 0 ? (
          <div className="text-xs text-c-text-5 py-8 text-center">
            Items will appear here as you build your quote.
          </div>
        ) : (
          <div className="space-y-1.5">
            <AnimatePresence initial={false}>
              {allItems.map(item => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-start justify-between gap-2 py-1.5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-c-text-2 truncate">{item.description}</div>
                    {item.unit !== 'flat' && (
                      <div className="text-[10px] text-c-text-4 mt-0.5">
                        {item.quantity} {item.unit} × {formatCurrency(item.unitPrice)}
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-c-text tabular-nums shrink-0">
                    {formatCurrency(item.total)}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Totals */}
      <div className="border-t border-c-border-inner px-5 py-4 space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-c-text-3">Subtotal</span>
          <span className="text-c-text tabular-nums">{formatCurrency(subtotal)}</span>
        </div>
        {wizard.discountPercent > 0 && (
          <div className="flex justify-between text-xs">
            <span className="text-emerald-400">
              Discount ({wizard.discountPercent}%)
            </span>
            <span className="text-emerald-400 tabular-nums">−{formatCurrency(discountAmount)}</span>
          </div>
        )}
        <div className="flex justify-between text-xs">
          <span className="text-c-text-3">Tax ({settings.pricing.taxRate}%)</span>
          <span className="text-c-text tabular-nums">{formatCurrency(taxAmount)}</span>
        </div>
        <div className="h-px bg-c-border-inner" />
        <div className="flex justify-between items-center">
          <span className="text-sm font-bold text-c-text">Total</span>
          <span className="text-2xl font-bold text-amber-400 tabular-nums">
            <AnimatedNumber value={total} format={(n) => formatCurrency(n)} />
          </span>
        </div>
      </div>
    </div>
  );
}
