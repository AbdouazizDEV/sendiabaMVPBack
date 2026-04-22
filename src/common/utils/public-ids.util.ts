/** Ex: USR-4012 -> usr_4012 */
export function publicUserId(user: { referenceCode: string }): string {
  const body = user.referenceCode.replace(/^USR-/i, '').toLowerCase();
  return `usr_${body}`;
}

/** Ex: ART-3018 -> a3018, ART-2 -> a2 */
export function publicArtisanId(artisan: { referenceCode: string }): string {
  const num = parseInt(artisan.referenceCode.replace(/^ART-/i, ''), 10);
  return `a${num}`;
}

/** Ex: PRD-12 -> p12, PRD-1 -> p1 */
export function publicProductId(product: { referenceCode: string }): string {
  const num = parseInt(product.referenceCode.replace(/^PRD-/i, ''), 10);
  return `p${num}`;
}

/** a3018 -> ART-3018, a2 -> ART-2 */
export function parseArtisanPublicId(id: string): string | null {
  const m = /^a(\d+)$/i.exec(id.trim());
  if (!m) {
    return null;
  }
  const num = parseInt(m[1], 10);
  if (Number.isNaN(num)) {
    return null;
  }
  return `ART-${num}`;
}

/** p12 -> PRD-12, p1 -> PRD-1 */
export function parseProductPublicId(id: string): string | null {
  const m = /^p(\d+)$/i.exec(id.trim());
  if (!m) {
    return null;
  }
  const num = parseInt(m[1], 10);
  if (Number.isNaN(num)) {
    return null;
  }
  return `PRD-${num}`;
}

/** Ex: cuid -> cmd_x8a91k2p (stable). */
export function publicOrderId(order: { id: string }): string {
  return `cmd_${order.id.slice(-8)}`;
}

/** Ex: cmd_x8a91k2p -> x8a91k2p */
export function parsePublicOrderId(orderId: string): string | null {
  const match = /^cmd_([a-z0-9]{4,32})$/i.exec(orderId.trim());
  if (!match) {
    return null;
  }
  return match[1];
}
