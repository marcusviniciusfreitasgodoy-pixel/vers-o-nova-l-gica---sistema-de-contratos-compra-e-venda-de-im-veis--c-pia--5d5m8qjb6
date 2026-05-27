export const parseCurrency = (val: string | null | undefined): number => {
  if (!val) return 0
  if (typeof val === 'number') return val

  const clean = String(val).trim()
  if (!clean) return 0

  if (/^-?\d+(\.\d+)?$/.test(clean) && !clean.includes(',')) {
    return parseFloat(clean)
  }

  const digits = clean.replace(/[^\d-]/g, '')
  if (!digits) return 0
  return parseInt(digits, 10) / 100
}

export const formatCurrency = (val: number | string | null | undefined): string => {
  if (val === undefined || val === null || val === '') return ''

  let num: number
  if (typeof val === 'string') {
    const clean = val.trim()
    if (/^-?\d+(\.\d+)?$/.test(clean) && !clean.includes(',')) {
      num = parseFloat(clean)
    } else {
      num = parseInt(clean.replace(/[^\d-]/g, '') || '0', 10) / 100
    }
  } else {
    num = val
  }

  if (isNaN(num)) return ''
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
