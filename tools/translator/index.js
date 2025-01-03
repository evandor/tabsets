import * as fs from 'fs'
import translate from 'translate'

translate.engine = 'deepl'
translate.key = process.env.DEEPL_KEY

const source = JSON.parse(fs.readFileSync('../../src/i18n/en/en.json'))
const de = JSON.parse(fs.readFileSync('../../src/i18n/de/de.json'))
const bg = JSON.parse(fs.readFileSync('../../src/i18n/bg/bg.json'))

// const sourceRes = await fetch("https://raw.githubusercontent.com/evandor/tabsets/chrome-extension/src/i18n/en/en.json")
// // const source = await sourceRes.json()
// console.log("source", source)
//
// const deRes = await fetch("https://raw.githubusercontent.com/evandor/tabsets/chrome-extension/src/i18n/de/de.json")
// const de = await deRes.json()

const keys = Object.keys(source)

async function writeTranslations(fromFile, language) {
  console.log(`=== ${language} ===`)
  let deTranslation = '{\n'
  const deKeys = Object.keys(de)
  for (const k of keys) {
    if (deKeys.indexOf(k) >= 0) {
      deTranslation += '  "' + k + '": "' + fromFile[k] + '",\n'
    } else {
      const text = 't' // await translate(englishIn[k], "bg");
      deTranslation += '  "' + k + '": "' + (await translate(source[k], language)) + '",\n'
    }
  }
  deTranslation += '}'
  deTranslation = deTranslation.replace(',\n}', '\n}')

  const translated = JSON.parse(deTranslation)

  const orderedTranslated = Object.keys(translated)
    .sort()
    .reduce((obj, key) => {
      obj[key] = translated[key]
      return obj
    }, {})
  console.log('===>', typeof orderedTranslated)

  fs.writeFileSync(`../../src/i18n/${language}/${language}.json`, JSON.stringify(orderedTranslated, null, 2))
}

await writeTranslations(de, 'de')
await writeTranslations(bg, 'bg')

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
