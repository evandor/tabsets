
class Navigation {

  openOrCreateTab(withUrl: string) {
    //console.log("hier", withUrl)
    let found = false;
    chrome.tabs.query({currentWindow: true}, (t: chrome.tabs.Tab[]) => {
      t.filter(r => r.url && !r.url.startsWith("chrome"))
        .map(r => {
          if (withUrl === r.url) {
            found = true
            chrome.tabs.highlight({tabs: r.index});
          }
        });
    });
    console.log("found", found)
    if (!found) {
      chrome.tabs.create({
        active: false,
        pinned: false,
        url: withUrl
      })
        .catch(e => {
          console.log("got error", e)
        })
    }
  }


}

export default new Navigation();

