import { describe, expect, it } from 'vitest';

import {
  calculateAllInclusivePrice,
  DEFAULT_COMMISSION_RATE,
  FIXED_PLATFORM_COMMISSION_PERCENT,
} from '../services/pricingService.js';

describe('fixed sender pricing', () => {
  it('adds exactly 15% Bago commission to the traveler rate', () => {
    const result = calculateAllInclusivePrice(5000, {
      platformCommissionPercent: FIXED_PLATFORM_COMMISSION_PERCENT,
      processingFeePercent: 0,
      fxBufferPercent: 0,
    });

    expect(DEFAULT_COMMISSION_RATE).toBe(0.15);
    expect(result.platformCommission).toBe(750);
    expect(result.processingFee).toBe(0);
    expect(result.senderShippingFee).toBe(5750);
  });
});
