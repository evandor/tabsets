import {installQuasarPlugin} from '@quasar/quasar-app-extension-testing-unit-vitest';
import {DOMWrapper, mount, shallowMount, VueWrapper} from '@vue/test-utils';
import {afterEach, beforeAll, beforeEach, describe, expect, it, vi} from 'vitest';
import {createPinia, setActivePinia} from "pinia";
import Features from "src/features/components/Features.vue";

installQuasarPlugin();

describe('Features', () => {

  let wrapper: VueWrapper<any, any> = null as unknown as VueWrapper

  beforeEach(async () => {
    setActivePinia(createPinia())
    wrapper = mount(Features);
  })

  it('should be mounted', async () => {
    console.log("html", wrapper.html())
    expect(wrapper.text()).toContain("Recommended Features");
    expect(wrapper.text()).toContain("Optional Features");
  });


})
