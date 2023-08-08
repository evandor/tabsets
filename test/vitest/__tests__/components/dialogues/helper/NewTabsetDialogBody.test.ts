import {installQuasarPlugin} from '@quasar/quasar-app-extension-testing-unit-vitest';
import {DOMWrapper, mount, VueWrapper} from '@vue/test-utils';
import {beforeEach, describe, expect, it} from 'vitest';
import {createPinia, setActivePinia} from "pinia";
import IndexedDbPersistenceService from "src/services/IndexedDbPersistenceService";
import NewTabsetDialog from "components/dialogues/NewTabsetDialog.vue";
import {Dialog} from "quasar";
import NewTabsetDialogBody from "components/dialogues/helper/NewTabsetDialogBody.vue";

installQuasarPlugin({plugins: {Dialog}})

// document.body.innerHTML = `
//   <div>
//     <h1>Non Vue app</h1>
//     <div id="app"></div>
//   </div>
//`
const div = document.createElement('div')
div.id = 'root'
document.body.appendChild(div)

describe('NewTabsetDialog', () => {


    beforeEach(async () => {
        setActivePinia(createPinia())
        await IndexedDbPersistenceService.init("db")
    })

    it('should be mounted', async () => {

        const wrapper = mount(NewTabsetDialogBody, {
            props: {},
        });
        expect(wrapper.text()).toContain("Add Tabset");
        expect(wrapper.text()).toContain("Add all open tabs");
    });

    it('should add a new Tabset', async () => {
        const wrapper = mount(NewTabsetDialogBody, {
            props: {},
            attachTo: '#root'
        });
        const input = wrapper.find('[data-testid=newTabsetName]')
        const submitButton = wrapper.find('[data-testid=newTabsetNameSubmit]')
        console.log("attr", submitButton.attributes())

        expect(submitButton.classes('disabled')).toBe(true)

        console.log("props", wrapper.vm.$data)
        await input.setValue("Tabset A")
//await        input.trigger('click')
        //expect(input.element.value).toBe('Tabset A')
        //expect(wrapper.text()).toContain("Tabset A");
        // trigger the element
        expect(submitButton.isVisible()).toBeTruthy()
        console.log("classes", submitButton.classes())
        //expect(submitButton.classes('disabled')).toBe(false)

        await submitButton.trigger('click')
console.log("emitted input", wrapper.emitted().input)
console.log("emitted change", wrapper.emitted().change)
        // assert some action has been performed, like an emitted event.
       // expect(wrapper.emitted()).toHaveProperty('submit')
    });


});
