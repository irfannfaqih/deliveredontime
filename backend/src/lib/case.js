export const toCamel = o => {
  if (Array.isArray(o)) return o.map(toCamel)
  if (o && typeof o === 'object') {
    const r = {}
    for (const k of Object.keys(o)) {
      const ck = k.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
      r[ck] = toCamel(o[k])
    }
    return r
  }
  return o
}

export const mapCustomerRow = r => {
  const c = toCamel(r)
  if (r.nama_customer !== undefined) c.namaCustomer = r.nama_customer
  if (r.no_hp !== undefined) c.noHp = r.no_hp
  return c
}

export const mapDeliveryRow = r => {
  const c = toCamel(r)
  if (r.sent_date !== undefined) c.sentDate = r.sent_date
  if (r.delivered_date !== undefined) c.deliveredDate = r.delivered_date
  if (r.actual_delivery_date !== undefined) c.actualDeliveryDate = r.actual_delivery_date
  return c
}