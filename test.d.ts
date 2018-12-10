type Foo = string
type Bar = {
  boop: number
}

interface Message {
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

type Colors = 'Blue' | 'Green' | 'Red'
type Parens = ('AB') | ('C')
type Prop = Box['origin']
