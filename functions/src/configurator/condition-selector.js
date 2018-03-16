const math = require('mathjs');

/**
 * Choose one which satisfies context
 *
 * @param options {Array.<Object>}
 * @param context {Object}
 * @returns {string}
 */
function process (options, context) {
  if (!context || typeof context !== 'object') {
    throw new Error('context argument should be defined');
  }
  return options
    .filter(({condition}) => math.eval(condition, context))[0];
}

module.exports = {
  process,
};
