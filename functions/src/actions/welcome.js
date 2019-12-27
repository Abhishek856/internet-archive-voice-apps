const _ = require('lodash');

const constants = require('../constants');
const dialog = require('../dialog');
const fsm = require('../state/fsm');
const welcomeStrings = require('../strings').intents.welcome.default;

/**
 * handle welcome intent
 *
 * @param app
 */
function handler (app) {
  const reprompt = welcomeStrings.reprompt || welcomeStrings.speech;

  let speech;
  if (app.isFirstTry && app.isFirstTry()) {
    // TODO: we could have special phrase for user's which come 1st time
    // and also which has been returned
    // for example we could propose to continue playback last played playlist
    speech = _.sample(welcomeStrings.acknowledges) + ' ' + welcomeStrings.speech;
  } else {
    speech = _.sample(welcomeStrings.acknowledges) + ' ' + welcomeStrings.speech;
  }

  // TODO: it would be great to implement some sophisticated
  // behaviour but for the moment we just clean state of the user's session
  // when we return to welcome action

  // so "Resume" intent won't work after that
  // we clean all that information
  app.persist.dropAll();

  fsm.transitionTo(app, constants.fsm.states.WELCOME);

  dialog.ask(app, Object.assign({}, welcomeStrings, { speech, reprompt }));
}

module.exports = {
  handler,
};
