const dialog = require('../../dialog');
const dialogState = require('../../state/dialog');
const playback = require('../../state/playback');
const playlist = require('../../state/playlist');
const query = require('../../state/query');
const strings = require('../../strings');
const { debug } = require('../../utils/logger')('ia:actions:playback/_helpers');

const defaultHelper = require('../_helpers');
const feederFromPlaylist = require('../_high-order-handlers/middlewares/feeder-from-playlist');
const fulfilResolvers = require('../_high-order-handlers/middlewares/fulfil-resolvers');
const nextSong = require('../_high-order-handlers/middlewares/next-song');
const mapPlatformToSlots = require('../_high-order-handlers/middlewares/map-platform-to-slots');
const playSongMiddleware = require('../_high-order-handlers/middlewares/play-song');
const previousSong = require('../_high-order-handlers/middlewares/previous-song');
const renderSpeech = require('../_high-order-handlers/middlewares/render-speech');
const mapSongDataToSlots = require('../_high-order-handlers/middlewares/song-data');

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
 * Enqueue next record without moving to the next playlist item
 *
 * @param ctx
 * @returns {Promise}
 */
function enqueue (ctx) {
  return feederFromPlaylist.middleware()({
    ...ctx,
    playlist,
    query,
    //   skip: 'forward',
    //   enqueue: true
  })
    .then(mapPlatformToSlots())
    .then(ctx => ({
      ...ctx,
      slots: {
        ...ctx.slots,
        previousTrack: playlist.getCurrentSong(ctx.app),
      },
    }))
    .then(nextSong({
      // we need just fetch next song,
      // and on AMAZON.StartIntent we finally move there
      move: false,
    }))
    .then(mapSongDataToSlots({
      // map next (enqueued) song
      type: 'next',
    }))
    .then(fulfilResolvers())
    .then(renderSpeech())
    .then(playSongMiddleware({
      // Alexa doesn't allow any response except of media response
      // when we add to queue
      mediaResponseOnly: true,
    }));
}

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
  const { skip = null } = ctx;
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
        return skipHandlers[skip](ctx);
      }
      return ctx;
    })
    .then(mapSongDataToSlots())
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
  return playSong(Object.assign({}, ctx, {
    offset: playback.getOffset(ctx.app),
    skip: null
  }))
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
  enqueue,
  playSong,
  resume,
  simpleResponseAndResume,
};
