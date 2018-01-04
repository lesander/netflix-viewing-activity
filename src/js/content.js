/**
 * Netflix Viewing Activity
 * by Sander Laarhoven
 * https://github.com/lesander/netflix-viewing-activity
 */

/*
  This script runs when we land on a netflix page.
  We will append inject.js to the DOM of the page,
  so we can access window variables.
 */

const scripts = [
  'src/js/lib/jquery.min.js',
  'src/js/lib/papaparse.min.js'
]

for (var i = 0; i < scripts.length; i++) {
  let script = document.createElement('script')
  script.src = chrome.extension.getURL(scripts[i]);
  document.body.appendChild(script)
}

// Append inject.js to the DOM of the webpage after 200ms.
// This is a dirty hack since jQuery is unpredictable as to when
// it has finished loading.
setTimeout(() => {
  let script = document.createElement('script')
  script.src = chrome.extension.getURL('src/js/inject.js');
  document.body.appendChild(script)
}, 200)
