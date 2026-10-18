import { FEATURE_BY_PREFIX, type CardFeatureConfig } from './cardFeatures'

export interface ParsedCardFile {
  ok: true
  feature: CardFeatureConfig
  prefix: string
  number: number
  /** e.g. "C7", "PC12" - also used as the Firestore document id */
  cardId: string
  side: 'front' | 'back'
}

export interface ParsedCardFileError {
  ok: false
  reason: string
}

/**
 * C7.png -> lab-decoded, card C7, front
 * M1-back.png -> drug-cards, card M1, back
 * PC3.jpg -> counselling-cards (the whole letter group is the prefix, so PC never collides with P)
 */
export function parseCardFilename(fileName: string): ParsedCardFile | ParsedCardFileError {
  const m = fileName.trim().match(/^([A-Za-z]+)(\d+)(?:[-_ ]?(back))?\.(png|jpe?g|webp)$/i)
  if (!m) {
    return { ok: false, reason: 'Name must look like C7.png or M1-back.png' }
  }
  const prefix = m[1].toUpperCase()
  const feature = FEATURE_BY_PREFIX[prefix]
  if (!feature) {
    return { ok: false, reason: `Unknown prefix "${prefix}"` }
  }
  const number = parseInt(m[2], 10)
  return {
    ok: true,
    feature,
    prefix,
    number,
    cardId: `${prefix}${number}`,
    side: m[3] ? 'back' : 'front',
  }
}

/**
 * Typed names, no extension needed: "c7", "M1 back", "pc 3", "M1-back" all work.
 * Used by the bulk upload when the admin types the name beside each photo.
 */
export function parseCardName(text: string): ParsedCardFile | ParsedCardFileError {
  const t = text.trim()
  if (!t) return { ok: false, reason: 'Type a name like C7 or M1-back' }
  const m = t.match(/^([A-Za-z]+)\s*(\d+)(?:\s*[-_ ]?\s*(back|b))?$/i)
  if (!m) return { ok: false, reason: 'Use a name like C7 or M1-back' }
  const prefix = m[1].toUpperCase()
  const feature = FEATURE_BY_PREFIX[prefix]
  if (!feature) return { ok: false, reason: `Unknown prefix "${prefix}"` }
  const number = parseInt(m[2], 10)
  return { ok: true, feature, prefix, number, cardId: `${prefix}${number}`, side: m[3] ? 'back' : 'front' }
}
