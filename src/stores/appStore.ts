import {defineStore} from 'pinia';
import {computed, ref, watch, watchEffect} from "vue";
import {useRoute, useRouter} from "vue-router";
import {Tab} from "src/models/Tab";
import _ from "lodash"
import {LocalStorage, uid, useQuasar} from "quasar";
import {useUtils} from "src/services/Utils";
import {useTabsStore} from "stores/tabsStore";
import {FeatureIdent} from "src/models/AppFeature";
import {usePermissionsStore} from "stores/permissionsStore";
import {Toast, ToastType} from "src/models/Toast";

export const useAppStore = defineStore('app', () => {

  const key = 'sharing.installation';

  const installationId = ref<string | undefined>(LocalStorage.getItem(key) as string || undefined)

  function getInstallationId() {
    if (installationId.value) {
      return  installationId.value
    }
    const useId = uid()
    installationId.value = useId
    LocalStorage.set(key, useId)
    return useId
  }

  return {
    getInstallationId
  }
})
