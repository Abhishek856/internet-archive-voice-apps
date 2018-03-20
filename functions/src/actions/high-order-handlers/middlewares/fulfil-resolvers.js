const util = require('util');

const templateResolvers = require('../../../configurator/parsers/template-resolvers');
const {debug} = require('../../../utils/logger')('ia:actions:middleware:fulfil-resolvers');

/**
 * Middleware
 * - solve all resolvers in speech attribute
 * - and substitute result
 */
module.exports = () =>
  /**
   * @param app
   * @param speech
   * @param query
   * @returns {Promise}
   */
  args => {
    const {app, speech, query} = args;

    // TODO: should we be limitted by speech only?
    const template = speech;

    debug(`resolve slots for "${template}"`);
    const slots = query.getSlots(app);
    const filledSlots = Object.keys(slots);
    const resolversToProcess = templateResolvers.getTemplateResolvers(template, filledSlots);

    debug('we get resolvers to process:', resolversToProcess);
    return Promise
      .all(
        resolversToProcess
          .map(({handler}) => handler(slots))
      )
      .then(solutions => {
        debug('solutions:', solutions);
        return solutions
        // zip/merge to collections
          .map((res, index) => {
            const resolver = resolversToProcess[index];
            return Object.assign({}, resolver, {result: res});
          })
          // pack result in the way:
          .reduce((acc, resolver) => {
            debug(`we get result resolver.result: ${util.inspect(resolver.result)} to bake for "${resolver.name}"`);
            return Object.assign({}, acc, {
              [resolver.name]: resolver.result,
            });
          }, {});
      })
      .then(slots => {
        return Promise.resolve(Object.assign({}, args, {slots}));
      });
  };
