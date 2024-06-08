const translate = require("translate");

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

const config = require("../../src/i18n/en/en.json");
console.log("config", config)
const keys = Object.keys(englishIn)

console.log("=== bg ===")

console.log("{")
for (const k of keys) {
  const text = englishIn[k] //await translate(englishIn[k], "bg");
  console.log(" \"" + k + "\": \""+text+"\",");
}
console.log("}")

console.log("=== ja ===")

console.log("{")
for (const k of keys) {
  const text = englishIn[k] //await translate(englishIn[k], "ja");
  console.log(" \"" + k + "\": \""+text+"\",");
}
console.log("}")

