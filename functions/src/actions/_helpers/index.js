const mustache = require('mustache');
const path = require('path');

const selectors = require('../../configurator/selectors');
const dialog = require('../../dialog');
const { getLastPhrase } = require('../../state/dialog');
const { getCurrentSong } = require('../../state/playlist');
const { getSlots } = require('../../state/query');

/**
 * Substitute context to scheme
 *
 * @param scheme
 * @param ctx
 * @returns {{speech: *}}
 */
function substitute (scheme, ctx) {
  return {
    speech: mustache.render(scheme.speech, ctx),
  };
}

module.exports = {
  /**
   * Strip file name from full path to get the name of action
   *
   * @param filename {string}
   * @returns {string}
   */
  actionNameByFileName: (filename, root = path.resolve(__dirname, '..')) =>
    path.relative(root, filename.replace(path.extname(filename), '')).split(path.sep),

  substitute,

  /**
   * Generate simple response to user based on scheme and existing context
   *
   * @param app
   * @param scheme
   * @param extra
   * @param defaultResponse
   */
  simpleResponse: (app, scheme, extra = {}, defaultResponse = {}) => {
    const ctx = Object.assign({}, extra, {
      last: getLastPhrase(app),
      slots: getSlots(app),
      playback: getCurrentSong(app),
    });

    dialog.ask(app, Object.assign({}, defaultResponse, substitute(selectors.find(scheme, ctx), ctx)));
  }
};
