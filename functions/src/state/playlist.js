const { debug, warning } = require('../utils/logger')('ia:state:playlist');

const { getData, setData } = require('./helpers').group('playlist');

/**
 * Selector. Current song in the Playlist
 *
 * @param app
 * @returns {null|{id: string, title: string}}
 */
function getCurrentSong (app) {
  const playlist = getData(app);
  if (!(playlist && playlist.items)) {
    return null;
  }

  return playlist.items[playlist.current];
}

/**
 * Get next song in playlist
 *
 * @param app
 * @returns {*}
 */
function getNextSong (app) {
  const playlist = getData(app);
  if (!(playlist && playlist.items)) {
    return null;
  }

  return playlist.items[playlist.current + 1];
}

/**
 * Selector. Do we have next song
 *
 * @param app
 * @returns {boolean}
 */
function hasNextSong (app) {
  const playlist = getData(app);
  return playlist.items ? playlist.current < playlist.items.length - 1 : false;
}

/**
 * Do we have previous song
 *
 * @param app
 * @returns {boolean}
 */
function hasPreviousSong (app) {
  const playlist = getData(app);
  return !!playlist.items && playlist.current > 0;
}

/**
 * Reducer: Create new playlist
 *
 * @param app
 * @param {Array} items - new songs
 * @param {Object} [extra] - extra options
 */
function create (app, items, extra = {}) {
  const res = setData(app, Object.assign({}, getData(app), { extra }, {
    current: 0,
    items,
  }));

  if (!res) {
    if (items.length > 1) {
      debug(`get half of items and try again. from ${items.length} to ${items.length / 2}`);
      create(app, items.slice(0, items.length / 2), extra);
    } else {
      warning('there is nothing to half in items');
    }
  }
}

/**
 * get extra parameters
 *
 * @param app
 */
function getExtra (app) {
  return getData(app).extra;
}

/**
 * set extra parameters
 *
 * @param app
 * @param extra
 */
function setExtra (app, extra) {
  setData(app, Object.assign({}, getData(app), { extra }));
}

/**
 * get feeder name
 *
 * @param app
 * @returns {*}
 */
function getFeeder (app) {
  return getData(app).feederName;
}

/**
 * set feeder name
 *
 * @param app
 * @param feederName
 */
function setFeeder (app, feederName) {
  setData(app, Object.assign({}, getData(app), { feederName }));
}

/**
 * Is playlist empty
 *
 * @param app
 * @returns {boolean}
 */
function isEmpty (app) {
  const playlist = getData(app);
  return playlist.items ? playlist.items.length === 0 : true;
}

/**
 * Should we loop
 *
 * @param app
 * @returns {boolean}
 */
function isLoop (app) {
  return !!getData(app).loop;
}

/**
 * set loop on/off
 *
 * @param app
 * @param loopOn
 */
function setLoop (app, loopOn) {
  const playlist = getData(app);
  setData(app, { ...playlist, loop: loopOn });
}

/**
 * Move current position to the song
 *
 * @param app
 * @param song
 */
function moveTo (app, song) {
  const playlist = getData(app);
  setData(app, { ...playlist, current: playlist.items.indexOf(song) });
}

/**
 * Reducer: Choose next song
 *
 * @param app
 */
function next (app) {
  const playlist = getData(app);
  let current = playlist.current + 1;
  if (current >= playlist.items.length) {
    if (playlist.loop) {
      current = 0;
    } else {
      current = playlist.items.length - 1;
    }
  }
  setData(app, { ...playlist, current });
}

/**
 * Reducer: Choose previous song
 *
 * @param app
 */
function previous (app) {
  const playlist = getData(app);
  let current = playlist.current - 1;
  if (current < 0) {
    if (playlist.loop) {
      current = playlist.items.length - 1;
    } else {
      current = 0;
    }
  }
  setData(app, { ...playlist, current });
}

/**
 * Shift current position in chunk
 *
 * @param app
 * @param value
 */
function shift (app, value) {
  const playlist = getData(app);
  setData(app, Object.assign({}, playlist, {
    current: playlist.current + value,
  }));
}

/**
 * Get playlist items
 *
 * @param app
 * @return {Array}
 */
function getItems (app) {
  return getData(app).items;
}

/**
 * Get playlist item by token
 *
 * @param app
 * @param token
 * @returns {*}
 */
function getItemByToken (app, token) {
  return getData(app).items.find(i => i.audioURL === token);
}

/**
 * update items in playlist
 *
 * @param app
 * @param items
 */
function updateItems (app, items) {
  setData(app, Object.assign({}, getData(app), {
    items,
  }));
}

module.exports = {
  getCurrentSong,
  getItems,
  getItemByToken,
  getNextSong,
  isEmpty,
  isLoop,
  setLoop,
  create,
  getExtra,
  setExtra,
  getFeeder,
  setFeeder,
  hasNextSong,
  hasPreviousSong,
  moveTo,
  next,
  previous,
  shift,
  updateItems,
};
