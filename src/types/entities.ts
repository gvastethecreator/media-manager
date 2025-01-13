export interface BaseEntityCreate {
  name: string
  emoji?: string
  color?: string
  description?: string | null
  shortcut?: string | null
  sortBy?: string
  filters?: string
}

export interface AlbumCreate extends BaseEntityCreate {
  sortBy: string
  filters: string
}

export interface CharacterCreate extends BaseEntityCreate {
  level: number
  class: string
  race: string
  alignment: string
  backstory: string
  stats: string
  sortBy: string
  filters: string
}

export interface PlaceCreate extends BaseEntityCreate {
  region: string
  type: string
  climate: string
  population: number
  government: string
  dangers: string
  resources: string
  lore: string
  history: string
  stats: string
  sortBy: string
  filters: string
}

export interface ObjectCreate extends BaseEntityCreate {
  type: string
  rarity: string
  properties: string
  requirements: string
  origin: string
  stats: string
  sortBy: string
  filters: string
}