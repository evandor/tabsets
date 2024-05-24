import {installQuasarPlugin} from '@quasar/quasar-app-extension-testing-unit-vitest';
import {DOMWrapper, mount, shallowMount, VueWrapper} from '@vue/test-utils';
import {afterEach, beforeAll, beforeEach, describe, expect, it, vi} from 'vitest';
import {createPinia, setActivePinia} from "pinia";
import Features from "src/features/components/Features.vue";
import {useFeaturesStore} from "src/features/stores/featuresStore";
import InMemoryFeaturesPersistence from "src/features/persistence/InMemoryFeaturesPersistence";
import {FeatureIdent} from "src/models/FeatureIdent";

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

  it('color green for active feature, grey otherwise', async () => {
    await useFeaturesStore().initialize(InMemoryFeaturesPersistence)
    useFeaturesStore().activateFeature(FeatureIdent.TOP10)
    wrapper = mount(Features);
    const firstFeature = wrapper.find('div.q-list > div').html()
    expect(firstFeature).toContain("Top 10 Tabs");
    expect(firstFeature).toContain("text-green");

    const secondFeature = wrapper.find('div.q-list > div:nth-child(2)').html()
    expect(secondFeature).toContain("Windows Management");
    expect(secondFeature).toContain("text-grey");
  });


})
