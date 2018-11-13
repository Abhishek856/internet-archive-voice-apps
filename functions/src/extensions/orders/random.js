class RandomOrderStrategy {
  clampCursorSongPosition () {

  }

  /**
   * Get paging for fetching data from source
   *
   * @param app
   * @param cursor
   * @param feederConfig
   * @returns {{limit: number, page: number}}
   */
  getPage ({ app, cursor, feederConfig }) {
    return {
      // size of chunk
      limit: feederConfig.chunk.albums,
      page: 0,
    };
  }

  /**
   * Do we have previous item
   *
   * Should always have previous item if feeder is valid
   *
   * @param app
   * @param slots
   * @param playlist
   * @returns {boolean}
   */
  hasPrevious ({ app, query, playlist }) {
    return !playlist.isEmpty(app);
  }

  /**
   * Do we have next item
   *
   * Should always have next item if feeder is valid
   *
   * @param app
   * @param slots
   * @param playlist
   * @returns {boolean}
   */
  hasNext ({ app, query, playlist }) {
    return !playlist.isEmpty(app);
  }

  /**
   * Move source cursor to the next position.
   *
   * We don't need it for the random strategy.
   * Because we allow to fetch similar things again
   */
  moveSourceCursorToTheNextPosition () {

  }

  /**
   * Move source cursor to the previous position.
   *
   * We don't need it for the random strategy.
   * Because we allow to fetch similar things again
   */
  moveSourceCursorToThePreviousPosition () {

  }

  /**
   * Update cursor total.
   *
   * We don't need it for the random strategy.
   */
  updateCursorTotal () {

  }

  /**
   * Songs postprocessing
   *
   * Suffle songs
   *
   * @param songs
   * @returns {Array}
   */
  songsPostProcessing ({ songs }) {
    return songs.sort(() => Math.random() - 0.5);
  }
}

module.exports = new RandomOrderStrategy();
