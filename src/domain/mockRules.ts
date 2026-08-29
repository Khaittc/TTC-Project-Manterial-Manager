// Mock Business Rules & Formatting Utilities
import { MaterialSupplierPrice, PriceTrend, ProjectBOMItem } from './types';

/**
 * Format currency to Vietnamese VND without VAT symbol / standard format
 * e.g. 1.500.000 ₫
 */
export function formatVND(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return '—';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

export const formatCurrency = formatVND;

/**
 * Format number with comma/dot grouping
 */
export function formatQuantity(qty: number | null | undefined): string {
  if (qty === null || qty === undefined || isNaN(qty)) return '0';
  return new Intl.NumberFormat('vi-VN').format(qty);
}

/**
 * Format date string to dd/MM/yyyy
 */
export function formatDate(dateString?: string): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateString;
  }
}

/**
 * Calculate Price Delta and Percentage Change
 */
export function calculatePriceDelta(current: number, previous: number): {
  delta: number;
  percentChange: number;
  percent: number;
  trend: PriceTrend;
} {
  if (!previous || previous <= 0) {
    return {
      delta: 0,
      percentChange: 0,
      percent: 0,
      trend: current > 0 ? 'NO_PRICE' : 'NO_PRICE',
    };
  }

  const delta = current - previous;
  const percentChange = (delta / previous) * 100;
  const roundedPercent = Math.round(percentChange * 10) / 10;

  let trend: PriceTrend = 'UNCHANGED';
  if (delta > 0) trend = 'INCREASED';
  else if (delta < 0) trend = 'DECREASED';

  return {
    delta,
    percentChange: roundedPercent,
    percent: Math.abs(roundedPercent),
    trend,
  };
}

/**
 * Given a list of supplier prices for a material, find Cheapest & Preferred
 */
export function evaluateSupplierPrices(prices: MaterialSupplierPrice[]) {
  if (!prices || prices.length === 0) {
    return {
      cheapestPriceItem: null,
      preferredPriceItem: null,
    };
  }

  const validPrices = prices.filter((p) => p.currentPrice > 0);
  const cheapestPriceItem = validPrices.length > 0
    ? [...validPrices].sort((a, b) => a.currentPrice - b.currentPrice)[0]
    : null;

  const preferredPriceItem = prices.find((p) => p.isPreferred) || null;

  return {
    cheapestPriceItem,
    preferredPriceItem,
  };
}

/**
 * Priority-based Procurement & Delivery Progress Status Resolver for BOM item
 *
 * Priority 1: Return / Exchange exception (RETURN_OR_EXCHANGE)
 * Priority 2: Receiving-derived status (FULLY_RECEIVED / PARTIALLY_RECEIVED)
 * Priority 3: Persisted procurement status (INTERNAL_REVIEW, AWAITING_QUOTATION, AWAITING_PAYMENT, ORDERED)
 * Priority 4: Legacy fallback based on bomItem.status
 */
export function getBOMProcurementStatus(b: ProjectBOMItem): {
  token: string;
  label: string;
  isReceivingDerived: boolean;
} {
  // Priority 1 — Return / Exchange exception
  if (b.procurementStatus === 'RETURN_OR_EXCHANGE') {
    return {
      token: 'RETURN_OR_EXCHANGE',
      label: 'Đang trả / đổi hàng',
      isReceivingDerived: false,
    };
  }

  // Priority 2 — Receiving-derived
  if (b.projectReceivedQty !== undefined && b.projectReceivedQty >= b.bomQty && b.bomQty > 0) {
    return {
      token: 'FULLY_RECEIVED',
      label: 'Đã nhận đủ',
      isReceivingDerived: true,
    };
  }
  if (b.projectReceivedQty !== undefined && b.projectReceivedQty > 0 && b.projectReceivedQty < b.bomQty) {
    return {
      token: 'PARTIALLY_RECEIVED',
      label: `Đã nhận ${b.projectReceivedQty} / ${b.bomQty}`,
      isReceivingDerived: true,
    };
  }

  // Priority 3 — Persisted procurement status
  if (b.procurementStatus === 'INTERNAL_REVIEW') {
    return {
      token: 'INTERNAL_REVIEW',
      label: 'Kiểm tra nội bộ',
      isReceivingDerived: false,
    };
  }
  if (b.procurementStatus === 'AWAITING_QUOTATION') {
    return {
      token: 'AWAITING_QUOTATION',
      label: 'Đang chờ báo giá',
      isReceivingDerived: false,
    };
  }
  if (b.procurementStatus === 'AWAITING_PAYMENT') {
    return {
      token: 'AWAITING_PAYMENT',
      label: 'Chờ thanh toán',
      isReceivingDerived: false,
    };
  }
  if (b.procurementStatus === 'ORDERED') {
    return {
      token: 'ORDERED',
      label: 'Đã đặt hàng',
      isReceivingDerived: false,
    };
  }

  // Priority 4 — Legacy fallback
  if (b.status === 'FULFILLED') {
    return {
      token: 'FULLY_RECEIVED',
      label: 'Đã nhận đủ',
      isReceivingDerived: true,
    };
  }
  if (b.status === 'PARTIALLY_RECEIVED') {
    return {
      token: 'PARTIALLY_RECEIVED',
      label: `Đã nhận ${b.projectReceivedQty || 1} / ${b.bomQty}`,
      isReceivingDerived: true,
    };
  }
  if (b.status === 'PURCHASING') {
    return {
      token: 'ORDERED',
      label: 'Đã đặt hàng',
      isReceivingDerived: false,
    };
  }

  // Default
  return {
    token: 'AWAITING_QUOTATION',
    label: 'Đang chờ báo giá',
    isReceivingDerived: false,
  };
}


