import { boot } from "quasar/wrappers";
import Vueform from "@vueform/vueform";
import vueformConfig from "../../vueform.config"

export default boot(({ app }) => {
  console.log(Vueform, vueformConfig);
  app.use(Vueform, vueformConfig);
});
