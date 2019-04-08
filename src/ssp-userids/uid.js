/**
 * This script returns the ssp buyer user id's. 
 * Usage: 
 * Load the script on the page from jsDelivr <TODO update url here>
 * window.pbs.getBuyerUids(function(error, uids) {
 *    // use uids here
 * })
 */

import * as commons from './commons';

window.pbs = (window.pbs || {})
window.pbs.getBuyerUids = getBuyerUids;

const ENDPOINT = 'https://prebid.adnxs.com/pbs/v1/getuids';
const STORAGE_KEY = 'ssp-buyeruids';
const REFRESH_IN_DAYS = 14;

/**
 * This functions calls the callback when buyer userid's is ready
 * @param {function} callback 
 */
export function getBuyerUids(callback) {
  let uidData = commons.getDataFromLocalStorage(STORAGE_KEY);
  if (hasInvalidData(uidData)) {
    loadData(callback);
  } else {
    try {
      uidData = JSON.parse(uidData);
    } catch (e) {
      callback(e, null);
      return;
    }
    delete uidData.lastUpdated;
    callback(null, uidData);
  }
}

/**
 * Gets the data from prebid server getuid endpoint and store it in local storage
 * @param {function} callback 
 */
export function loadData(callback) {
  function saveData(response) {
    try {
      response = JSON.parse(response);
      response['lastUpdated'] = commons.timestamp();
      commons.setDataInLocalStorage(STORAGE_KEY, JSON.stringify(response));
      delete response.lastUpdated;
      callback(null, response);
    } catch (e) {
      callback(e, null);
    }
  }

  let uidData = commons.getDataFromLocalStorage(STORAGE_KEY);
  if (hasInvalidData(uidData)) {
    commons.ajax(ENDPOINT, saveData, null, {
      withCredentials: true
    });
  }
}

/**
 * Check whether buyer id data is not null and is not expired
 * @param {Object} uidData 
 * @returns {boolean}
 */
function hasInvalidData(uidData) {
  return !uidData || commons.timestamp() > uidData.lastUpdated + REFRESH_IN_DAYS * 24 * 60 * 60 * 1000
}

function noop() {}
loadData(noop);