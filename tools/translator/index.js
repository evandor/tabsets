import translate from "translate";
import * as fs from 'fs';

translate.engine = "deepl";
translate.key = process.env.DEEPL_KEY;

const englishIn = {
  "activate_bookmarks_integration": "Activate Bookmarks Integration",
  "activate_browser_notifications": "Activate Browser Notifications",
  "add_new_tabset": "Add new Tabset",
  "add_tabset": "Add Tabset",
  "create_your_first_ts": "Create your first Tabset!",
  "documentation": "Documentation",
  "experimental": "experimental",
  "language": "Language",
  "no_space_selected": "No Space selected",
  "no_special_chars_and_length": "Please do not use special Characters, maximum length is 32",
  "optionally": "Optionally",
  "provide_name_add_later": "Provide a name and add tabs later",
  "tabset_name": "Tabset name",
  "welcome_to_tabsets": "Welcome  to Tabsets"
}

const sourceRes = await fetch("https://raw.githubusercontent.com/evandor/tabsets/chrome-extension/src/i18n/en/en.json")
const source = await sourceRes.json()
console.log("source", source)

const deRes = await fetch("https://raw.githubusercontent.com/evandor/tabsets/chrome-extension/src/i18n/de/de.json")
const de = await deRes.json()

const keys = Object.keys(source)

console.log("=== de ===")
let deTranslation = "{\n"
const deKeys = Object.keys(de)
for (const k of keys) {
  if (deKeys.indexOf(k) >= 0) {
    // console.log("  \"" + k + "\": \"" + de[k] + "\",");
    deTranslation += "  \"" + k + "\": \"" + de[k] + "\",\n"
  } else {
    const text = "t"// await translate(englishIn[k], "bg");
    //console.log(" \"" + k + "\": \"" + await translate(source[k], "de") + "\",");
    deTranslation += "  \"" + k + "\": \"" + await translate(source[k], "de")  + "\",\n"
  }
}
//console.log("}")
deTranslation += "}"
deTranslation = deTranslation.replace(",\n}", "\n}")

// console.log("===>", deTranslation)
const translated = JSON.parse(deTranslation)

const orderedTranslated = Object.keys(translated).sort().reduce(
  (obj, key) => {
    obj[key] = translated[key];
    return obj;
  },
  {}
);
console.log("===>", typeof orderedTranslated)


fs.writeFileSync("../../src/i18n/de/de.json", JSON.stringify(orderedTranslated, null,2))

// });

//
// function readTextFile(file, callback) {
//   var rawFile = new XMLHttpRequest();
//   rawFile.overrideMimeType("application/json");
//   rawFile.open("GET", file, true);
//   rawFile.onreadystatechange = function() {
//     if (rawFile.readyState === 4 && rawFile.status == "200") {
//       callback(rawFile.responseText);
//     }
//   }
//   rawFile.send(null);
// }
//
// readTextFile("../../src/i18n/en/en.json", function(text){
//   var data = JSON.parse(text);
//   console.log(data);
// });


// console.log("=== ja ===")
//
// console.log("{")
// for (const k of keys) {
//   const text = await translate(englishIn[k], "ja");
//   console.log(" \"" + k + "\": \""+text+"\",");
// }
// console.log("}")

