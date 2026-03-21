import type { AppSettings } from '@/types';

export const DEFAULT_SETTINGS: AppSettings = {
  team: [
    { id: 'tm-1', name: 'Timothy', role: 'admin', phone: '336-479-6059', email: 'timothy@patriotroofingandhomerepair.com' },
  ],
  company: {
    name: 'Patriot Roofing & Home Repairs',
    tagline: 'Protecting Homes with Quality Roofing & Repairs',
    phone: '336-479-6059',
    email: 'timothy@patriotroofingandhomerepair.com',
    address: '316 W Davidson Ave, Lexington, NC 27295',
    website: 'patriotroofingandhomerepair.com',
    license: 'Licensed & Insured · GAF Certified · Workmanship Guarantee',
  },
  salesRep: {
    name: 'Timothy',
    phone: '336-479-6059',
    email: 'timothy@patriotroofingandhomerepair.com',
    title: 'Roofing Specialist',
  },
  pricing: {
    taxRate: 6.75,
    defaultMarkup: 20,
    laborRate: 75,
    demolitionRate: 1.5,
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
    accentColor: '#fb8e28',
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
