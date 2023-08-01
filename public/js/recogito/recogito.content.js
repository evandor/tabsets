(function (arg) {

  var variable = document.currentScript.dataset.variable;
  var not_a_string = JSON.parse(document.currentScript.dataset.not_a_string);

  console.log("arg", arg,variable, not_a_string)

  var r = Recogito.init({
    //content: document.getElementById('my-content') // ID or DOM element
    content: document.body // ID or DOM element
  });

  r.setAnnotations([])

  // Add an event handler
  r.on('createAnnotation', function (annotation) {
    console.log("annotation", annotation)
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
