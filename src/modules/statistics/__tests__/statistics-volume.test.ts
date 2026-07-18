import { expect, it } from 'vitest';
import type { StatisticsData } from '../domain/statistics';
import { calculateStatistics, resolveStatisticsPeriod } from '../domain/statistics';

it('volume Sprint 8 — 10k contacts, 20k intérêts, 2k factures, 10k lignes, 5k paiements et 20k relances', () => {
  const now = '2026-07-18T10:00:00.000Z';
  const data: StatisticsData = { contacts: [], prospectProfiles: [], clientProfiles: [], locations: [], products: [], prospectInterests: [], followUps: [], invoices: [], invoiceLines: [], payments: [], campaigns: [], campaignRecipients: [] };
  for (let index = 0; index < 10; index += 1) data.products.push({ id: `product-${index}`, name: `Produit ${index}`, normalizedName: `produit ${index}`, type: 'PRODUCT', unitPriceMinor: 1000, currency: 'XOF', currencyScale: 0, isActive: true, createdAt: now, updatedAt: now });
  for (let index = 0; index < 10_000; index += 1) {
    const contactId = `contact-${index}`; const profileId = `prospect-${index}`;
    data.contacts.push({ id: contactId, displayName: `Contact ${index}`, whatsappPhone: `+22177${String(index).padStart(7, '0')}`, normalizedWhatsappPhone: `+22177${String(index).padStart(7, '0')}`, source: index % 2 ? 'WHATSAPP' : 'REFERRAL', createdAt: '2026-07-01T00:00:00.000Z', updatedAt: now });
    data.prospectProfiles.push({ id: profileId, contactId, status: index < 2_000 ? 'CONVERTI' : 'INTERESSE', interestLevel: index % 3 ? 'TIEDE' : 'CHAUD', firstContactDate: '2026-07-01', convertedAt: index < 2_000 ? '2026-07-05T00:00:00.000Z' : undefined, lastStatusChangedAt: now, createdAt: '2026-07-01T00:00:00.000Z', updatedAt: now });
    data.prospectInterests.push({ id: `interest-a-${index}`, prospectProfileId: profileId, productId: `product-${index % 10}`, requestedAt: '2026-07-02T00:00:00.000Z', createdAt: now, updatedAt: now }, { id: `interest-b-${index}`, prospectProfileId: profileId, productId: `product-${(index + 1) % 10}`, requestedAt: '2026-07-03T00:00:00.000Z', createdAt: now, updatedAt: now });
    data.followUps.push({ id: `follow-a-${index}`, contactId, channel: 'PHONE', dueAt: '2026-07-18T12:00:00.000Z', timezone: 'Africa/Dakar', priority: 'NORMAL', status: 'PLANIFIEE', createdAt: now, updatedAt: now }, { id: `follow-b-${index}`, contactId, channel: 'WHATSAPP', dueAt: '2026-07-10T12:00:00.000Z', timezone: 'Africa/Dakar', priority: 'HIGH', status: 'PLANIFIEE', createdAt: now, updatedAt: now });
    if (index < 2_000) {
      const clientId = `client-${index}`; const invoiceId = `invoice-${index}`;
      data.clientProfiles.push({ id: clientId, contactId, convertedAt: '2026-07-05T00:00:00.000Z', createdAt: now, updatedAt: now });
      data.invoices.push({ id: invoiceId, clientProfileId: clientId, status: 'PAYEE', issueDate: '2026-07-06', dueDate: '2026-07-16', currency: 'XOF', currencyScale: 0, companySnapshot: { displayName: 'SAMTECH' }, clientSnapshot: { displayName: `Contact ${index}` }, subtotalMinor: 1000, discountTotalMinor: 0, taxTotalMinor: 0, grandTotalMinor: 1000, paidTotalMinor: 1000, balanceMinor: 0, createdAt: now, updatedAt: now });
      for (let lineIndex = 0; lineIndex < 5; lineIndex += 1) data.invoiceLines.push({ id: `line-${index}-${lineIndex}`, invoiceId, productId: `product-${lineIndex}`, position: lineIndex, designationSnapshot: `Produit ${lineIndex}`, quantityScaled: 1, quantityScale: 0, unitPriceMinor: 200, grossMinor: 200, discountType: 'NONE', discountValue: 0, discountMinor: 0, taxRateBasisPoints: 0, taxMinor: 0, lineTotalMinor: 200, createdAt: now, updatedAt: now });
      data.payments.push({ id: `payment-${index}`, invoiceId, clientProfileId: clientId, paymentDate: '2026-07-07', amountMinor: 1000, currency: 'XOF', currencyScale: 0, method: 'CASH', status: 'ACTIVE', createdAt: now, updatedAt: now });
    }
  }
  for (let index = 2_000; index < 5_000; index += 1) data.payments.push({ id: `payment-${index}`, invoiceId: `invoice-${index % 2_000}`, clientProfileId: `client-${index % 2_000}`, paymentDate: '2026-07-07', amountMinor: 1, currency: 'XOF', currencyScale: 0, method: 'CASH', status: 'REVERSED', reversedAt: now, reversalReason: 'Test volume', createdAt: now, updatedAt: now });
  for (let index = 0; index < 10; index += 1) {
    data.campaigns.push({ id: `campaign-${index}`, name: `Campagne ${index}`, status: index === 0 ? 'EN_COURS' : 'TERMINEE', audienceType: 'PROSPECTS', criteria: {}, messageSnapshot: 'Bonjour', createdAt: now, updatedAt: now });
    for (let recipient = 0; recipient < 10; recipient += 1) data.campaignRecipients.push({ id: `recipient-${index}-${recipient}`, campaignId: `campaign-${index}`, contactId: `contact-${index * 10 + recipient}`, normalizedPhoneSnapshot: '+221770000000', displayNameSnapshot: 'Contact', resolvedMessageSnapshot: 'Bonjour', position: recipient, status: index === 0 && recipient === 0 ? 'A_TRAITER' : 'CONFIRME_CONTACTE', createdAt: now, updatedAt: now });
  }

  const startedAt = performance.now();
  const report = calculateStatistics(data, { period: resolveStatisticsPeriod('CURRENT_MONTH', '2026-07-18'), today: '2026-07-18', primaryCurrency: 'XOF', primaryCurrencyScale: 0 });
  const duration = performance.now() - startedAt;
  console.info(`SPRINT8_VOLUME_DURATION_MS=${duration.toFixed(1)}`);
  expect(report.prospects.total).toBe(10_000); expect(report.demandedProducts.reduce((sum, item) => sum + item.count, 0)).toBe(20_000);
  expect(report.primaryFinancial.billedMinor).toBe('2000000'); expect(report.primaryFinancial.collectedMinor).toBe('2000000');
  expect(report.followUps).toMatchObject({ today: 10_000, overdue: 10_000 }); expect(report.soldProducts.reduce((sum, item) => sum + item.count, 0)).toBe(10_000);
  expect(duration).toBeLessThan(10_000);
}, 20_000);
