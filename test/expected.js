const tf = require('typeforce')
const Foo = tf.String
const Bar = { boop: tf.Number }
const Message = { error: tf.maybe(tf.String), parts: tf.arrayOf({ text: tf.String }) }
const Coordinate2 = tf.allOf({ x: tf.Number }, { y: tf.Number })
const Coordinate3 = tf.allOf({ x: tf.Number }, tf.allOf({ y: tf.Number }, { z: tf.Number }))
const Box = { vertices: tf.arrayOf(Coordinate3), indexes: tf.arrayOf(tf.Number), origin: tf.allOf({ time: tf.Number }, Coordinate3) }
const Mapping = tf.map(tf.Boolean, tf.String)
const FlagNames = tf.anyOf(tf.value('version'), tf.value('print'), tf.value('daemon'), tf.value('verbose'))
const Flags = tf.map(tf.Boolean, FlagNames)
const FlagsLoose = tf.allOf({ verbose: tf.Boolean }, tf.map(tf.Boolean, tf.String))
const Colors = tf.anyOf(tf.value('Blue'), tf.value('Green'), tf.value('Red'))
const Parens = tf.anyOf(tf.value('AB'), tf.value('C'))
const Prop = Box['origin']
const MaybeStr = tf.anyOf(tf.String, tf.value(null))
module.exports = {
  Message,
  Colors
}
