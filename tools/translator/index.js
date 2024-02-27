import translate from "translate";

translate.engine = "deepl";
translate.key = process.env.DEEPL_KEY;

const englishIn = {
  "experimental": "experimental",
  "language": "Language",
  "create_your_first_ts": "Create your first Tabset",
  "welcome_to_tabsets": "Welcome  to Tabsets"
}

// const json = JSON.parse(englishIn)
// console.log("json", json)
const keys = Object.keys(englishIn)

console.log("{")
for (const k of keys) {
  //console.log("translating", k, englishIn[k])
  const text = await translate(englishIn[k], "bg");
  console.log(" \"" + k + "\": \""+text+"\",");
}
console.log("}")

