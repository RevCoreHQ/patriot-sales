import type { AppSettings } from '@/types';

export const DEFAULT_SETTINGS: AppSettings = {
  company: {
    name: 'Rock N Roll Stoneworks',
    tagline: 'Premium Outdoor Spaces. Zero Subcontractors. Built to Last.',
    phone: '303-587-3035',
    email: 'rnrstoneworks@gmail.com',
    address: '12420 Arapahoe Road, Lafayette, CO 80026',
    website: 'rnrstoneworks.com',
    license: 'ICPI Certified · Belgard Authorized · 2-Year Install Guarantee · Belgard Lifetime Warranty',
  },
  salesRep: {
    name: 'Sales Representative',
    phone: '303-587-3035',
    email: 'rnrstoneworks@gmail.com',
    title: 'Outdoor Living Specialist',
  },
  pricing: {
    taxRate: 4.9,
    defaultMarkup: 20,
    laborRate: 85,
    demolitionRate: 2.5,
    quoteValidDays: 30,
    materialPrices: {},
    addonPrices: {},
  },
  financing: [
    { id: 'fin-12', label: '12 Months', termMonths: 12, apr: 7.99 },
    { id: 'fin-24', label: '24 Months', termMonths: 24, apr: 9.99 },
    { id: 'fin-36', label: '36 Months', termMonths: 36, apr: 11.99 },
    { id: 'fin-60', label: '60 Months', termMonths: 60, apr: 13.99 },
  ],
  presentation: {
    accentColor: '#f59e0b',
    showFinancing: true,
  },
  notifications: {
    enabled: false,
    reminders: {
      followUpDays: 3,
      quoteExpiryDays: 2,
    },
  },
};
