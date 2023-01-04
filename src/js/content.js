/**
 * Netflix Viewing Activity
 * https://github.com/lesander/netflix-viewing-activity
 * Created by @lesander
 * Updated by @ramazansancar (https://github.com/ramazansancar/netflix-viewing-activity) - 2023-01-04
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
  script.src = chrome.runtime.getURL(scripts[i]);
  document.body.appendChild(script)
}

const styles = [
  "src/css/main.css",
  "src/css/buttons.css",
  "src/css/loader.css"
]

for (var i = 0; i < styles.length; i++) {
  let style = document.createElement('link')
  style.type = 'text/css';
  style.rel = 'stylesheet';
  style.href = chrome.runtime.getURL(styles[i]);
  document.head.appendChild(style)
}


// Append inject.js to the DOM of the webpage after 200ms.
// This is a dirty hack since jQuery is unpredictable as to when
// it has finished loading.
setTimeout(() => {
  let scripttest = document.createElement('script')
  scripttest.src = chrome.runtime.getURL('src/js/test.js');
  document.body.appendChild(scripttest)
}, 200)

setTimeout(() => {
  let script = document.createElement('script')
  script.src = chrome.runtime.getURL('src/js/inject.js');
  document.body.appendChild(script)
}, 200)
