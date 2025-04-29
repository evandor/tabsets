import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { test } from '@playwright/test'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const filePath = path.join(__dirname, './testdata.single.json')
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))

for (const record of data) {
  test(`testing: ${record.test_case}`, async ({ page }) => {
    const { username } = record
    console.log(username)
  })
}
