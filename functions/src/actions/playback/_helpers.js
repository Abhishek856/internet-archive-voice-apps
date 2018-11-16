const _ = require('lodash');

const dialog = require('../../dialog');
const dialogState = require('../../state/dialog');
const playlist = require('../../state/playlist');
const query = require('../../state/query');
const strings = require('../../strings');
const { debug } = require('../../utils/logger')('ia:actions:playback/_helpers');

const defaultHelper = require('../_helpers');
const feederFromPlaylist = require('../_high-order-handlers/middlewares/feeder-from-playlist');
const fulfilResolvers = require('../_high-order-handlers/middlewares/fulfil-resolvers');
const nextSong = require('../_high-order-handlers/middlewares/next-song');
const playSongMiddleware = require('../_high-order-handlers/middlewares/play-song');
const previousSong = require('../_high-order-handlers/middlewares/previous-song');
const parepareSongData = require('../_high-order-handlers/middlewares/song-data');
const renderSpeech = require('../_high-order-handlers/middlewares/render-speech');

/**
 * map skip name to skip behaviour
 *
 * @type {{back: *, forward: *}}
 */
const skipHandlers = {
  'back': previousSong(),
  'forward': nextSong(),
};

/**
 * play one song
 *
 * @param ctx
 * @param {boolean} ctx.enqueue - add next song in the queue (we should pass previous track)
 * @param {boolean} ctx.skip - skip back, forward
 * @returns {Promise}
 */
function playSong (ctx) {
  debug('playSong');
  debug(ctx);
  const { enqueue = false, skip = null } = ctx;
  return feederFromPlaylist.middleware()(Object.assign({}, ctx, { query, playlist }))
    // expose current platform to the slots
    .then(ctx =>
      Object.assign({}, ctx, {
        slots: Object.assign(
          {}, ctx.slots, { platform: ctx.app.platform || 'assistant' }
        )
      })
    )
    .then(ctx => {
      if (skip) {
        // we need previous track token for Alexa playback
        if (enqueue) {
          const previousTrack = playlist.getCurrentSong(ctx.app);
          ctx = Object.assign({}, ctx);
          _.set(ctx, ['slots', 'previousTrack'], previousTrack);
        }
        return skipHandlers[skip](ctx);
      }
      return ctx;
    })
    .then(parepareSongData())
    .then(fulfilResolvers())
    .then(renderSpeech())
    // Alexa doesn't allow any response except of media response
    .then(playSongMiddleware(ctx));
}

/**
 * resume track playback
 *
 * @param ctx
 * @returns {Promise.<T>}
 */
function resume (ctx) {
  debug('resume');
  return playSong(Object.assign({}, ctx, { skip: null }))
    .catch(err => {
      if (err instanceof feederFromPlaylist.EmptyFeederError) {
        debug('playlist is empty');
        dialog.ask(ctx.app, dialog.merge(
          strings.intents.resume.empty,
          dialogState.getReprompt(ctx.app)
        ));
      } else {
        debug('it could be an error:', err);
        return dialog.ask(ctx.app, dialog.merge(
          strings.intents.resume.fail,
          dialogState.getReprompt(ctx.app)
        ));
      }
    });
}

function simpleResponseAndResume (app, scheme, extra = {}, defaultResponse = {}) {
  defaultHelper.simpleResponse(app, scheme, extra, defaultResponse);
  return resume({ app });
}

module.exports = {
  playSong,
  resume,
  simpleResponseAndResume,
};
