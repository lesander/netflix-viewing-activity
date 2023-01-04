$(() => {

    // Path: src\js\test.js

    // Test Button
    if (document.location.pathname === '/viewingactivity') {
        $(`h1`).append(`
        <div class="va-dl">
            <button class="va-button va-button-blue va-button-small" id="va-test">Test</button>
        </div>
        `)
    }

    // Test Button
    $(document).on(`click`, `#va-test`, test)
})


/**
 * Request history from the Netflix API.
 * @param  {Resource} event jQuery Event Resource
 * @return {void}
 */
const test = async (event) => {
  // Switch button State
  let test = window.$r.state.pageToggle
  if(test === 'rate'){
    console.log('rate')
  }else if(test === 'view'){
    console.log('view')
  }else{
    console.log('other')
  }
}

test