export type Audience = 'MBBS' | 'NEET-PG' | 'both'
export type GateType = 'free' | 'basic' | 'pro' | 'addon'
export type CardStatus = 'draft' | 'published'

export interface QuickCardImagePaths {
  front: string
  back?: string
  thumb?: string
}

export interface QuickCard {
  id: string
  feature: string
  cardId: string
  title: string
  tags: string[]
  audience: Audience
  imagePaths: QuickCardImagePaths
  storageProvider: 'firebase'
  order: number
  status: CardStatus
  isFree: boolean
  blurData?: string
  createdAt?: any
}

export interface FeatureSettings {
  visible: boolean
  gate: GateType
}

export interface CardImageUrls {
  front?: string
  back?: string
  thumb?: string
  locked: boolean
}

export interface CardState {
  bookmarked?: boolean
  revised?: boolean
  feature?: string
}
