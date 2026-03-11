import type { FinancingCalculation } from '@/types';

export function calculateMonthlyPayment(
  principal: number,
  apr: number,
  termMonths: number
): number {
  if (apr === 0) return principal / termMonths;
  const monthlyRate = apr / 100 / 12;
  const payment =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
    (Math.pow(1 + monthlyRate, termMonths) - 1);
  return Math.round(payment * 100) / 100;
}

export function calculateFinancing(
  projectTotal: number,
  downPaymentPercent: number,
  apr: number,
  termMonths: number
): FinancingCalculation {
  const downPayment = projectTotal * (downPaymentPercent / 100);
  const financed = projectTotal - downPayment;
  const monthlyPayment = calculateMonthlyPayment(financed, apr, termMonths);
  const totalCost = downPayment + monthlyPayment * termMonths;
  const totalInterest = totalCost - projectTotal;

  return {
    principal: projectTotal,
    downPayment,
    financed,
    apr,
    termMonths,
    monthlyPayment,
    totalCost,
    totalInterest,
  };
}
