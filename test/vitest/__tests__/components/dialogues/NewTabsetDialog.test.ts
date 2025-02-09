import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { DOMWrapper, mount, VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { Dialog } from 'quasar'
import NewTabsetDialog from 'src/tabsets/dialogues/NewTabsetDialog.vue'
import { beforeEach, describe, it } from 'vitest'

installQuasarPlugin({ plugins: { Dialog } })

describe('NewTabsetDialog', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
  })

  it('should be mounted', async () => {
    let wrapper: VueWrapper<InstanceType<typeof NewTabsetDialog>>

    wrapper = mount(NewTabsetDialog, {
      props: {},
    })

    const bodyWrapper = new DOMWrapper(document.body)
    // wrapper.vm.isDialogOpen = true;
    //wrapper.vm.$q.dialog.call()
    // `.find()` won't error out even if the element is not found
    // expect(bodyWrapper.find('.q-dialog').exists()).toBeTruthy();
    //wrapper.vm.$q.dialog.call()

    console.log('xxx', wrapper.html())
    /*expect(wrapper.vm.clickCount).toBe(0);
        wrapper.find('.q-item').trigger('click');
        expect(wrapper.vm.clickCount).toBe(1);*/
  })
})
