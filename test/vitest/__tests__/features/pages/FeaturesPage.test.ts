import {installQuasarPlugin} from '@quasar/quasar-app-extension-testing-unit-vitest';
import {mount, VueWrapper} from '@vue/test-utils';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {createPinia, setActivePinia} from "pinia";
import FeaturesPage from "src/features/pages/FeaturesPage.vue";
import {useRoute, useRouter} from "vue-router";

installQuasarPlugin()

vi.mock('vue-router')

describe('FeaturesPage', () => {

  let wrapper: VueWrapper<any, any> = null as unknown as VueWrapper

  // @ts-ignore
  useRoute.mockReturnValue({
    params: {
      feature: "top10"
    },
  })

  beforeEach(async () => {
    setActivePinia(createPinia())
    wrapper = mount(FeaturesPage);
  })

  it('should be mounted', async () => {
    console.log("html", wrapper.html())
    expect(wrapper.text()).toContain("Recommended Features");
    expect(wrapper.text()).toContain("Optional Features");
  });


})