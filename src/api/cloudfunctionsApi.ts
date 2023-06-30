import {api} from "boot/axios";
import {Category} from "src/models/Category";
import {uid} from "quasar";
import {Tab} from "src/models/Tab";
import ChromeApi from "src/services/ChromeApi";
import {TAXONOMY} from "boot/constants";

export function cloudFunctionsApi() {

  const backendUrl = "https://us-central1-tabsets-backend-prd.cloudfunctions.net/app"

  const getCategories = async (): Promise<Category[]> => {
    const categories = await api.get(`${backendUrl}/webshrinker/categories/${TAXONOMY}`)
    console.log("cats", categories.data)
    const result: Category[] = []
    categories.data.forEach((e:object) => {
      const data = e['data' as keyof object]
      const urls: object[] = data['urls']
      const tabs: Tab[] = []
      urls.forEach(u => {
        const tab = new Tab(uid(), ChromeApi.createChromeTabObject(
          u['title' as keyof object],
          u['url' as keyof object],
          u['favIconUrl' as keyof object]
        ))
        tab.description = u['description' as keyof object]
        tabs.push(tab)
      })
      //console.log("cat", new Category(e['id' as keyof object],e['id' as keyof object], tabs))
      result.push(new Category(e['id' as keyof object],e['id' as keyof object], tabs))
    })
    return result
  }

    // api.post(`${backendUrl}/webshrinker/analyze`,
  //   {
  //     url: origin,
  //     taxonomy: 'iabv1', // 'iabv1' or 'webshrinker'
  //     title: this.tab.chromeTab.title,
  //     favIconUrl: this.tab.chromeTab.favIconUrl,
  //     description: this.tab.description
  //   })
  //   .then((res) => {
  //     console.log("res", res)
  //   })
  //   .catch((err) => console.log("got error", err))

  return {
    getCategories
  }
}

