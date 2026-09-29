import type { FinanceAlertRecord, RiskLevel, SyncStatus } from '../../dataset/researchFinanceMock'

export function formatCurrency(value: number, fractionDigits = 2) {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value)
}

export function formatPlainAmount(value: number, fractionDigits = 2) {
  return new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value)
}

export function formatPercent(rate: number, fractionDigits = 1) {
  return `${(rate * 100).toFixed(fractionDigits)}%`
}

export function toProgressPercent(rate: number) {
  return Math.max(0, Math.min(100, Number((rate * 100).toFixed(1))))
}

export function getRiskTagType(level: RiskLevel) {
  if (level === 'WARNING') {
    return 'danger'
  }

  return level === 'ATTENTION' ? 'warning' : 'success'
}

export function getAlertTagType(level: FinanceAlertRecord['level']) {
  if (level === 'HIGH') {
    return 'danger'
  }

  return level === 'WARNING' ? 'warning' : 'info'
}

export function getSyncTagType(status: SyncStatus) {
  if (status === 'SUCCESS') {
    return 'success'
  }

  if (status === 'FAILED') {
    return 'danger'
  }

  if (status === 'DELAYED') {
    return 'warning'
  }

  return 'info'
}
