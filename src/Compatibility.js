/**
 * Handle compatibility between standalone and Rodan versions of Neon.
 * Ideally the rest of the program doesn't need to know which version it's in.
 * @module Compatibility
 */

import * as Notification from './Notification.js';
const $ = require('jquery');

/**
 * The modes to run Neon in.
 * Either standalone (0), rodan (1), demo/pages (2), or local (3)
 */
export const modes = {
  standalone: 0,
  rodan: 1,
  pages: 2,
  local: 3
};

var mode;
var db;

/**
 * Set the mode to run Neon in.
 * @see module:Compatibility.modes
 * @param {number} currentMode
*/
export function setMode (currentMode) {
  mode = currentMode;
}

/**
 * Return the mode Neon is in.
 * @returns {number}
 */
export function getMode () {
  return mode;
}

/**
 * Let Compatibility use an initialized PouchDB
 * @param {object} pouchDB
*/
export function setDB (pouchDB) {
  db = pouchDB;
}

/**
 * Compatible save file function.
 * @param {string} filename - The path for the MEI file.
 * @param {string} mei - The MEI data.
 */
export function saveFile (filename, mei) {
  var pathSplit = filename.split('/');
  let file = pathSplit[pathSplit.length - 1];

  if (mode === modes.standalone) {
    $.ajax(
      {
        type: 'POST',
        url: '/save/' + file,
        data: {
          'meiData': mei,
          'fileName': filename
        },
        success: () => { Notification.queueNotification('File Saved'); },
        error: (jqXHR, textStatus, errorThrown) => { Notification.queueNotification(textStatus + ' Error: ' + errorThrown); }
      }
    );
  } else if (mode === modes.rodan) {
    $.ajax({
      'type': 'POST',
      'data': JSON.stringify({ 'user_input': mei, 'mode': 'autosave' }),
      'contentType': 'application/json',
      'success': () => { Notification.queueNotification('File Saved'); },
      'error': (jqXHR, textStatus, errorThrown) => { Notification.queueNotification(textStatus + ' Error: ' + errorThrown); }
    });
  } else if (mode === modes.pages) {
    let temp = document.createElement('a');
    temp.setAttribute('href', 'data:application/mei+xml;charset=utf-8,' + encodeURIComponent(mei));
    temp.setAttribute('download', file);
    temp.style.display = 'none';
    document.body.append(temp);
    temp.click();
    document.body.removeChild(temp);
  } else if (mode === modes.local) {
    db.get('mei').then((doc) => {
      doc.data = mei;
      return db.put(doc);
    }).catch((err) => { console.log(err); }).then(() => { Notification.queueNotification('File Saved'); });
  } else {
    console.error('Unsupported or unset mode!');
  }
}

/**
 * Compatible revert function.
 * @param {string} filename
 */
export function revertFile (filename) {
  if (mode === modes.standalone) {
    var pathSplit = filename.split('/');
    let file = pathSplit[pathSplit.length - 1];
    $.ajax({
      type: 'POST',
      url: '/revert/' + file,
      success: () => { window.location.reload(); }
    });
  } else if (mode === modes.rodan) {
    $.ajax({
      type: 'POST',
      data: JSON.stringify({ 'user_input': '', 'mode': 'revert' }),
      contentType: 'application/json',
      success: () => { window.location.reload(); }
    });
  } else if (mode === modes.pages) {
    window.location.reload(); // No actions since the source file can't be overwritten
  } else if (mode === modes.local) {
    db.get('mei.original').then((original) => {
      return db.get('mei').then((doc) => {
        doc.data = original.data;
        return db.put(doc);
      });
    }).then(() => { window.location.reload(); }).catch((err) => { console.log(err); });
  } else {
    console.error('Unsupported or unset mode!');
  }
}

/**
 * Compatible autosave function.
 * @param {string} filename
 * @param {string} mei
 */
export function autosave (filename, mei) {
  var pathSplit = filename.split('/');
  let file = pathSplit[pathSplit.length - 1];

  if (mode === modes.standalone) {
    $.ajax({
      'type': 'POST',
      'url': '/autosave/' + file,
      'data': {
        'data': mei
      },
      error: () => { console.error('Could not autosave ' + file); }
    });
  } else if (mode === modes.rodan) {
    $.ajax({
      'type': 'POST',
      'data': JSON.stringify({ 'user_input': mei, 'mode': 'autosave' }),
      'contentType': 'application/json'
    });
  } else if (mode === modes.pages) {
    // Do nothing this will be called no matter what
  } else if (mode === modes.local) {
    db.get('mei').then((doc) => {
      doc.data = mei;
      return db.put(doc);
    }).catch((err) => { console.log(err); });
  } else {
    console.error('Unsupported or unset mode!');
  }
}

/**
 * Finalize the editing in the Neon2 job in Rodan.
 * This should not be run outside of Rodan.
 * @param {string} mei
 */
export function finalize (mei) {
  if (mode === modes.standalone) {
    console.error('This should not be called in standalone mode. Please report this.');
  } else if (mode === modes.rodan) {
    $.ajax({
      type: 'POST',
      data: JSON.stringify({ 'user_input': mei, 'mode': 'finalize' }),
      contentType: 'application/json',
      success: function () { window.close(); },
      error: (jqXHR, textStatus, errorThrown) => { Notification.queueNotification(textStatus + ' Error: ' + errorThrown); }
    });
  } else if (mode === modes.pages) {
    console.error('This should not be called in pages mode. Please report this.');
  } else if (mode === modes.local) {
    console.error('This should not be called in local mode. Please report this.');
  } else {
    console.error('Unsupported or unset mode!');
  }
}