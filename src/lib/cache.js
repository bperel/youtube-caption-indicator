const cacheTtl = 3600;

const getCacheValue = (key, callback) => {
  if (typeof GM_getValue === 'function') {
    callback(JSON.parse(GM_getValue(key)));
  } else if (typeof browser === 'object') {
    browser.storage.sync.get(key, function(value) {
      callback(value[key]);
    });
  } else if (typeof chrome === 'object') {
    chrome.storage.sync.get(key, function(value) {
      callback(value[key]);
    });
  } else {
    console.error('No suitable cache provider!');
  }
};

const setCacheValue = (key, value, wasAlreadyInCache, callback) => {
  let object;
  if (typeof GM_setValue === 'function') {
    GM_setValue(key, JSON.stringify(value));
    callback(wasAlreadyInCache);
  } else if (typeof browser === 'object') {
    object = {};
    object[key] = value;
    browser.storage.sync.set(object, function() {
      callback(wasAlreadyInCache);
    });
  } else if (typeof chrome === 'object') {
    object = {};
    object[key] = value;
    chrome.storage.sync.set(object, function() {
      callback(wasAlreadyInCache);
    });
  } else {
    console.error('No suitable cache provider!');
  }
};

export { cacheTtl, getCacheValue, setCacheValue };
