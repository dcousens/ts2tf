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

type Coordinate = { x: number } & { y: number } // { x: number, y: number }

interface Box {
  vertices: Coordinate[]
  indexes: number[]
  origin: {
    time: number
  } & Coordinate
}

type Colors = 'Blue' | 'Green' | 'Red'
type Prop = Box['origin']
