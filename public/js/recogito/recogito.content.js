(function (arg) {

  console.log("1", document.currentScript.dataset.annotations)
  console.log("2", JSON.parse(document.currentScript.dataset.annotations))


  var annotations = Object.values(JSON.parse(document.currentScript.dataset.annotations))

  console.log("annotations", annotations)
  for (a of annotations) {
    console.log(" -> ", a['body'], Object.values(a['body']))
    a['body'] = Object.values(a['body'])
    a['target']['selector'] = Object.values(a['target']['selector'])
  }
  console.log("annotations2", annotations)

  var r = Recogito.init({
    //content: document.getElementById('my-content') // ID or DOM element
    //content: document.getElementsByClassName('help-article').item(0) // ID or DOM element
    content: document.body, // ID or DOM element
    // mode: 'pre'

  });

  // // r.setAnnotations(Object.values(annotations))
  //setTimeout(() => {
    console.log("setting annotations", annotations)
    //r.setAnnotations(annotations)
    Object.values(annotations).forEach(a => {
      console.log("setting annotation", a)
      r.addAnnotation(a)
    })

  //}, 100)

  // Add an event handler
  r.on('createAnnotation', function (annotation) {
    console.log("annotation", annotation)
    annotations.push(annotation)
    const msg = {
      name: 'recogito-annotation-created',
      annotation: annotation,
      url: window.location.href
    }

    console.log("sending", msg)
    //chrome.runtime.sendMessage(msg, (callback) => console.log("callback", callback))
    window.postMessage(msg)
  });
})();
