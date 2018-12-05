/**
 * Netflix Viewing Activity
 * by Sander Laarhoven
 * https://github.com/lesander/netflix-viewing-activity
 */

/* Oddly enough, Netflix seems to be using both ReactJS AND jQuery on _some_
   parts of their front-end website.
   We include the slim build of jQuery to make sure it's always present. */

/* When the DOM has been loaded, we alter the UI of Netflix a little,
   allowing the user to download their viewing or rating history. */
$(() => {

  // Create a navigagion tab in the main index navbar.
  $(`.tabbed-primary-navigation`).append(`
    <li class="navigation-tab">
      <a href="/viewingactivity">My Activity</a>
    </li>
  `)

  // Create a navigation tab on the viewing activity page.
  $(`.aro-genre-list > ul`).append(`
    <li>
      <a href="/viewingactivity" class="va-active">My Activity</a>
    </li>
  `)

  // Create a download button on the viewing activity page.
  if (document.location.pathname === '/viewingactivity') {
    $(`h1`).append(`
      <div class="va-dl">
        <button class="va-button va-button-blue va-button-small" id="va-download">Download</button>
      </div>
    `)
  }

  // Warn the user for Netflix's own limited downloader.
  $(`.viewing-activity-footer-download`).text(`Download limited information from Netflix`)

  // Attatch an event listener to the download button.
  $(document).on(`click`, `#va-download`, viewDownloadModal)

  // Attach an event listener to the close button.
  $(document).on(`click`, `.va-b-cancel`, hideDownloadModal)

  // Attach an event listener to the final download button.
  $(document).on(`click`, `.va-b-download`, downloadHistory)

  // Attach an event listener to the close button for errors.
  $(document).on(`click`, `.va-b-cancel`, hideDownloadModal)
})


/**
 * Display a nice modal to select what to download.
 * @return {boolean}
 */
const viewDownloadModal = () => {

  // If the modal element already exists,
  // we do not need to create it again but just show it.
  let modal = $(`.va-modal-download`)
  if ($(modal).length) return $(modal).show()

  $(`body`).append(`
    <div class="va-modal va-modal-download">
      <div class="va-modal-contents">
        <div class="va-modal-title">
          Download
          <select class="va-input" name="va-type">
            <option value="viewingactivity" selected>Watching</option>
            <option value="ratinghistory">Ratings</option>
          </select>
          Activity
        </div>
        <div class="va-modal-body">
          <p>
            We will attempt to download all history related to your selected option.
            Depending on your history, this might take a little while.<br>
            Once complete, your history will be downloaded to your computer.
          </p>

          <label>Please select an output file format</label>
          <select class="va-input" name="va-format">
            <option value="csv">CSV</option>
            <option value="json">JSON</option>
          </select>

        </div>
        <div class="va-modal-footer">
          <button class="va-button va-b-cancel">Cancel</button>
          <button class="va-button va-b-download">Download</button>
        </div>
      </div>
    </div>
  `)
}

/**
 * Hide the download modal.
 * @return {boolean}
 * Display a nice modal to show the end-user an error.
 * @param  {Object} err
 * @return {void}
 */
const viewCriticalError = (err) => {

  // If the modal element already exists,
  // we do not need to create it again but just show it.
  let errorModal = $(`.va-modal-error`)
  if ($(errorModal).length) return $(errorModal).show()

  $(`body`).append(`
    <div class="va-modal va-modal-error">
      <div class="va-modal-contents">
        <div class="va-modal-title" style="padding-bottom:1em;">
          <h2>
            <strong>Netflix Viewing Activity</strong> has encountered an error
          </h2>
        </div>
        <div class="va-modal-body">
          <p>
            We haven't seen this problem before. It looks like Netflix
            has changed something on this page, and now the extension
            is unable to fetch some important things.
            The technical error is shown below.
          </p>
          <p>
            <pre class="va-modal-error-message"></pre>
          </p>
        </div>
        <div class="va-modal-footer">
          <button class="va-button va-button-small va-b-cancel">Close</button>
          <button
            class="va-button va-button-blue va-button-small"
            onclick="window.open('https://github.com/lesander/netflix-viewing-activity/issues', '_blank')"
          >Report Issue</button>
        </div>
      </div>
    </div>
  `)

  // Set the detailed error message.
  $(`.va-modal-error-message`).text(err)
}

/**
 * Hide the modal.
 * @return {void}
 */
const hideDownloadModal = () => {
  $(`.va-modal:visible`).hide()
  $(`.va-modal-error:visible`).hide()
  hideWorkingAnimation()
  return
}

/**
 * Request history from the Netflix API.
 * @param  {Resource} event jQuery Event Resource
 * @return {Array}
 */
const downloadHistory = async (event) => {

  /* Get the history type and file type from the form select. */
  const type = $(`select[name=va-type]`).val() || 'viewingactivity'
  const file = $(`select[name=va-format]`).val() || 'json'

  /* Find the required API call parameters in Netflix's reactContext. */
  let authUrl, buildIdentifier, apiBaseUrl
  try {
    authUrl = window.netflix.reactContext.models.memberContext.data.userInfo.authURL
    buildIdentifier = window.netflix.reactContext.models.serverDefs.data.BUILD_IDENTIFIER
    apiBaseUrl = decodeURI(window.netflix.reactContext.models.serverDefs.data.API_BASE_URL)
  } catch (err) {
    console.log('[NVA Downloader] authUrl, buildIdentifier or apiBaseUrl locations have changed.', "\n", err)
    viewCriticalError(err)
    throw new Error('Unable to obtain critical API variables. Please report this issue on GitHub.')
  }

  console.debug(`[NVA Downloader] authUrl, buildIdentifier, apiBaseUrl`, authUrl, buildIdentifier, apiBaseUrl)

  /* We set the records amount to infinity for now. Once the API sends back
     less than pageSize results, we stop crawling. */
  const pageSize = 20
  const pagesToLoad = Infinity

  /* Download each page and append the results in to one array.
     By default, no recordsAmount is given, so we continue parsing pages
     until the last result has less records than the given pageSize.
     AFAIK this is also the way Netflix loads all records client-side. */
  let history = []
  for (var i = 0; i < pagesToLoad; i++) {

    const timestamp = + new Date()
    const pageNum = i
    let response

    console.debug(`[NVA Downloader] Parsing ${type} page ${pageNum}`)

    /* Construct the url for our API call and set the appropriate headers.
       Note: the apiBaseUrl begins with a forwards slash. */
    const url = `https://www.netflix.com/api${apiBaseUrl}/` +
                `${buildIdentifier}/${type}` +
                `?pg=${pageNum}&pgSize=${pageSize}&_=${timestamp}` +
                `&authURL=${authUrl}`
    let options = {
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' }
    }

    /* Request the viewing history from Netflix's API. */
    try {
      response = await fetch(url, options)
    } catch (error) {
      console.debug('[NVA Downloader] Fetch Error', error)
      continue
    }

    /* Convert the response body from JSON to an object
       and append each item to the history. */
    const responseObj = await response.json()
    const itemsName = (type === 'viewingactivity' ? 'viewedItems' : 'ratingItems')
    for (var y = 0; y < responseObj[itemsName].length; y++) {
      history.push(responseObj[itemsName][y])
    }

    /* Check how many records we got. If it's less than the set pageSize, we have
       reached the end of the history. */
    if (responseObj[itemsName].length < pageSize) {
      console.debug('[NVA Downloader] Stopping parsing, reached end of history.')
      break
    }

  }

  console.debug(`[NVA Downloader] Final history array has ${history.length} items.`)

  /* Create a CSV or JSON file to download. */
  let data
  if (file === 'json') {

    // Create a data uri with the json object embedded inside.
    data = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(history))}`

  } else {

    // Convert the object to CSV using papaparse (http://papaparse.com).
    const csv = Papa.unparse(history, {
      quotes: true,
      header: true,
      delimiter: ';',
      newline: "\r\n"
    })
    data = `data:text/csv;charset=utf-8,${csv}`

  }

  /* Create an anchor element and click the anchor to start the download.
     I couldn't for some odd reason port this to jQuery oh well.. */
  const fileName = (type === 'viewingactivity' ? 'viewedHistory' : 'ratingHistory') + `.${file}`
  let link = document.createElement(`a`)
  link.setAttribute(`href`, data)
  link.setAttribute(`download`, fileName)
  link.click()
  link.remove()

  /* Return the history array.
     dunno, maybe someone wants to do something with it. */
  return history
}
