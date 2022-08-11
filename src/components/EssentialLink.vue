<template>
  <q-item
    clickable
    @click="jumpToTab(link)"
  >
    <q-item-section
      v-if="icon"
      avatar
    >
      <q-img :src="icon" height="20px" width="20px"/>
    </q-item-section>

    <q-item-section>
      <q-item-label>{{ title }}</q-item-label>
      <q-item-label caption>{{ caption }}</q-item-label>
    </q-item-section>
  </q-item>
</template>

<script setup lang="ts">
export interface EssentialLinkProps {
  title: string;
  caption?: string;
  link?: string;
  icon?: string;
}

withDefaults(defineProps<EssentialLinkProps>(), {
  caption: '',
  link: '#',
  icon: '',
});

function jumpToTab(withUrl: string) {
  chrome.tabs.query({currentWindow: true}, (t: chrome.tabs.Tab[]) => {
    t.filter(r => !r.url.startsWith("chrome"))
      .map(r => {
        if (withUrl === r.url) {
          chrome.tabs.highlight({tabs: r.index});
        }
      });
  });
}
</script>
