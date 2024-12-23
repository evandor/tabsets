// const translate = require("fix-esm").require("translate");

const translate = require('translate-google')

const source = require('../../../src/i18n/en/en.json')
const german = require('../../../src/i18n/de/de.json')

translate.engine = 'deepl'
translate.key = process.env.DEEPL_KEY

const keys = Object.keys(source)

console.log('=== de ===')

let de = '{'
console.log('{')
const germanKeys = Object.keys(german)
for (const k of keys) {
  if (germanKeys.indexOf(k) >= 0) {
    //console.log(" \"" + k + "\": \"check: "+german[k]+"\",");
  } else {
    // console.log("translate", translate)
    // const translation =  translate(source[k], "bg")
    translate(source[k], { from: 'en', to: 'de' }).then((res) => de.concat(res))
    //console.log(" \"" + k + "\": \""+translation+"\",");
  }
}
console.log('}')
console.log(de)
// console.log("=== ja ===")
//
// console.log("{")
// for (const k of keys) {
//   const text = "text"//await translate(englishIn[k], "ja");
//   console.log(" \"" + k + "\": \""+text+"\",");
// }
// console.log("}")
//
