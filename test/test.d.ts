type Foo = string
type Bar = {
  boop: number
}

export interface Message {
  error?: string
  parts: {
    text: string
  }[]
}

type Coordinate2 = { x: number } & { y: number }
type Coordinate3 = { x: number } & ({ y: number } & { z: number })

interface Box {
  vertices: Coordinate3[]
  indexes: number[]
  origin: {
    time: number
  } & Coordinate3
}

type Mapping = {
  [key: string]: boolean
}

type FlagNames = 'version' | 'print' | 'daemon' | 'verbose'
type Flags = {
  [key in FlagNames]?: boolean
}

type FlagsLoose = {
  verbose: boolean
  [key: string]: boolean
}

export type Colors = 'Blue' | 'Green' | 'Red'
type Parens = ('AB') | ('C')
type Prop = Box['origin']
type MaybeStr = string | null
