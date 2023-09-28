/**
 * mocha BDD tests with boolean pre-condition
 */

const noop = () => {}

const describeBool = (trueish) => trueish ? describe : describe.skip
describeBool.only = (trueish) => trueish ? describe.only : noop
describeBool.skip = (trueish) => describe.skip

const itBool = (trueish) => trueish ? it : it.skip
itBool.only = (trueish) => trueish ? it.only : noop
itBool.skip = (trueish) => it.skip

module.exports = {
  describeBool,
  itBool
}
