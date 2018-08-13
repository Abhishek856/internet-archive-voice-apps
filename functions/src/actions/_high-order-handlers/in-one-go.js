const {debug, warning} = require('../../utils/logger')('ia:actions:in-one-go');

const constants = require('../../constants');
const errors = require('../../errors');
const fsm = require('../../state/fsm');

const acknowledge = require('./middlewares/acknowledge');
const ask = require('./middlewares/ask');
const copyArgumentToSlots = require('./middlewares/copy-arguments-to-slots');
const copyDefaultsToSlots = require('./middlewares/copy-defaults-to-slots');
const feederFromSlotScheme = require('./middlewares/feeder-from-slots-scheme');
const fulfilResolvers = require('./middlewares/fulfil-resolvers');
const parepareSongData = require('./middlewares/song-data');
const playlistFromFeeder = require('./middlewares/playlist-from-feeder');
const playSong = require('./middlewares/play-song');
const renderSpeech = require('./middlewares/render-speech');
const repairBrokenSlots = require('./middlewares/repair-broken-slots');
const suggestions = require('./middlewares/suggestions');

/**
 * High-order handler
 * for construction in-on-go intent handler
 *
 * @param playlist - storage for playlist chunk
 * @param strings - strings and configuration of handler
 * @param query - storage for search query data
 * @returns {{handler: handler}}
 */
function build ({playlist, strings, query}) {
  debug(`build handler "${strings.name}"`);

  if (!strings.slots) {
    warning('Missed slots');
  }

  if (!strings.slots) {
    warning('missed fulfillments');
  }

  /**
   * handle "in one go" action
   *
   * @param app
   * @returns {Promise.<T>}
   */
  function handler (app) {
    debug(`start handler "${strings.name}"`);
    const slotScheme = strings;

    if (app.isNewSession()) {
      // this action is exposed outside as in-one-go-action
      // so for Alexa we should clean its attributes
      debug(`it is new session we should drop all sessions's attributes`);
      app.persist.dropAll();
    }

    // pipeline of action handling
    return copyArgumentToSlots()({app, slotScheme, playlist, query})
      .then(copyDefaultsToSlots())
      // expose slots
      .then(ctx => Object.assign({}, ctx, {slots: ctx.query.getSlots(ctx.app)}))
      // expose current platform to the slots
      .then(ctx =>
        Object.assign({}, ctx, {
          slots: Object.assign(
            {}, ctx.slots, {platform: app.platform || 'assistant'}
          )
        })
      )
      .then(feederFromSlotScheme())
      .then(playlistFromFeeder())
      .then(acknowledge({speeches: 'slotScheme.fulfillment.speech'}))
      .then(parepareSongData())
      .then(fulfilResolvers())
      .then(renderSpeech())
      .then(playSong())
      .catch((error) => {
        debug(`we don't have playlist (or it is empty)`);

        if (error instanceof errors.HTTPError) {
          // don't handle http error here
          // because we are handling it on upper level
          return Promise.reject(error);
        }

        const context = error.context;
        const brokenSlots = context ? context.newValues : {};
        const slots = context ? context.slots : {};

        // we shouldn't exclude collections and creators
        // because without them we would have too broad scope
        const exclude = Object.keys(brokenSlots)
          // .filter(name => ['collectionId', 'creator'].indexOf(name) < 0);
          .filter(name => ['collectionId'].indexOf(name) < 0);

        fsm.transitionTo(app, constants.fsm.states.SEARCH_MUSIC);

        return repairBrokenSlots()(Object.assign({}, context, {
          brokenSlots,
          // drop any acknowledges before
          speech: [],
          suggestions: [],
          slots: Object.assign({}, slots, {
            suggestions: [],
          }),
        }))
          .then(suggestions({exclude}))
          .then(fulfilResolvers())
          .then(renderSpeech())
          // TODO: should clean broken slots from queue state
          .then(ask());
      });
  }

  return {
    handler,
  };
}

module.exports = {
  build,
};
