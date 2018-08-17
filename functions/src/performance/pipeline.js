const {info, timer} = require('../utils/logger')('ia:performance:pipeline');

let coldStart;
let currentStage = null;
let currentStageTimer = null;

/**
 * Track stages of pipeline, and thier performance
 *
 * @param newStage
 */
function stage (newStage) {
  if (currentStage === newStage) {
    return;
  }

  let ms;
  if (currentStageTimer) {
    ms = currentStageTimer();
  }

  switch (newStage) {
    case module.exports.START:
      coldStart = true;
      break;
    case module.exports.PROCESS_REQUEST:
      if (coldStart) {
        coldStart = false;
        info(`${ms} ms cold start`);
      } else {
        info('warm start');
      }

      break;
  }

  currentStage = newStage;
  currentStageTimer = timer.start(currentStage);
}

module.exports = {
  /**
   * enum stages
   */
  // wait for the next request
  IDLE: 'idle',
  // process income request
  PROCESS_REQUEST: 'process request',
  // boot stage of the app
  START: 'start',

  stage,
};
