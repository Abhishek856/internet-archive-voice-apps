const axios = require('axios');
const _ = require('lodash');
const util = require('util');

const config = require('../config');
const endpointProcessor = require('../network/endpoint-processor');
const delayedPromise = require('../utils/delay');
const { debug, error } = require('../utils/logger')('ia:provider:albums');
const objToLowerCase = require('../utils/map-to-lowercases');

const { buildQueryCondition } = require('./advanced-search');
const orders = require('./orders');

/**
 * Fetch details about Album
 *
 * @param app
 * @param id {string} id of album
 * @param {number} [retry]
 * @param {number} [delay] delay between requests
 * @returns {Promise}
 */
function fetchAlbumDetails (app, id, { retry = 0, delay = 1000 } = {}) {
  debug('fetch album details', id);

  return axios.get(
    endpointProcessor.preprocess(
      config.endpoints.COLLECTION_URL, app, { id }
    )
  )
    .catch((error) => {
      if (retry > 0) {
        return delayedPromise(delay)
          .then(() => fetchAlbumDetails(id, { retry: retry - 1 }));
      } else {
        return Promise.reject(error);
      }
    })
    .then(res => {
      debug(`we got album ${id} res:`, res);
      const json = res.data;
      return {
        id,
        collections: _.uniq(json.metadata
          .collection
          .filter(c => !c.startsWith('fav-'))),
        creator: json.metadata.creator,
        year: extractYear(json.metadata),
        coverage: json.metadata.coverage,
        title: json.metadata.title,
        songs: json.files
        // usually songs don't have 'creator' field as well
          .filter(f => f.format === 'VBR MP3' && f.title)
          .map(f => ({
            filename: f.name,
            title: f.title,
          }))
      };
    });
}

/**
 * Fetch some albums of artist/creator by its collection id
 * not all artists have dedicated collection
 * so we use fetchAlbumsByQuery instead
 *
 * @param app
 * @param {string} id - identifier of creator
 * @param {number} limit
 * @param {number} page
 * @param {string} order - by default we fetch the most popular
 */
function fetchAlbumsByCreatorId (app, id, {
  limit = 3,
  page = 0,
  order = 'best',
  fields = 'identifier,coverage,title,year',
} = {}) {
  debug(`fetch albums of ${id}`);
  const iaOrder = orders[order];
  return axios.get(
    endpointProcessor.preprocess(
      config.endpoints.COLLECTION_ITEMS_URL, app,
      {
        id,
        limit,
        page,
        order: iaOrder,
        fields,
      }
    )
  )
    .then(res => {
      const json = res.data;
      debug(`fetch ${json.response.docs.length} albums`);
      return {
        items: json.response.docs.map(a => ({
          identifier: a.identifier,
          coverage: a.coverage,
          subject: a.subject,
          title: a.title,
          year: extractYear(a),
        })),
        total: json.response.numFound,
      };
    })
    .catch(e => {
      error(`Get error on fetching albums of artist ${id}, error:`, e);
      return Promise.reject(e);
    });
}

/**
 * Fetch some albums by query
 *
 * @param app
 * @param {Object} query
 * @param {string} query.collectionId
 * @param {string} query.coverage
 * @param {string} query.creator
 * @param {number} query.year
 *
 * @param {number} query.limit
 * @param {number} query.page
 * @param {string} query.order
 *
 * @return {Promise}
 */
function fetchAlbumsByQuery (app, query) {
  query = Object.assign({}, {
    fields: 'identifier,coverage,title,year',
    limit: 3,
  }, objToLowerCase(query));

  // create search query
  const condition = buildQueryCondition(query);
  debug(`condition ${condition}`);

  debug('Fetch albums by', query);

  const iaOrder = orders[query.order];
  return axios.get(
    endpointProcessor.preprocess(
      config.endpoints.QUERY_COLLECTIONS_URL,
      app,
      { ...query, order: iaOrder, condition },
    )
  )
    .then(res => {
      if (!res.data.response) {
        error('we got empty response!', res.data);
        return {
          items: [],
          total: 0,
        };
      }

      return {
        items: res.data.response.docs.map(a => Object.assign({}, a, {
          year: extractYear(a),
        })),
        total: res.data.response.numFound,
      };
    })
    .catch(e => {
      error(
        'Get error on fetching albums of artist by:', util.inspect(query)
      );
      return Promise.reject(e);
    });
}

/**
 * Extract year from metadata
 *
 * @param metadata
 * @returns {Number|undefined}
 */
function extractYear (metadata) {
  if (metadata.year) {
    return parseInt(metadata.year);
  }

  if (metadata.date) {
    return (new Date(metadata.date)).getFullYear();
  }

  return undefined;
}

module.exports = {
  extractYear,
  fetchAlbumDetails,
  fetchAlbumsByCreatorId,
  fetchAlbumsByQuery,
};
