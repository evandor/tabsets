<template>
  <q-item
    clickable
    @click="jumpToTab(url)"
  >
    <q-item-section
      v-if="favIconUrl"
      avatar
    >
      <q-img :src="favIconUrl" height="20px" width="20px"/>
    </q-item-section>

    <q-item-section>
      <q-item-label>{{ title }}</q-item-label>
      <q-item-label caption>{{ url }}</q-item-label>
    </q-item-section>
  </q-item>
</template>

<script setup lang="ts">

export interface TabProps {
  id: number;
  title: string;
  caption?: string;
  url?: string;
  favIconUrl?: string;
}

withDefaults(defineProps<TabProps>(), {
  id: 0,
  caption: '',
  url: '#',
  favIconUrl: '',
});

function jumpToTab(withUrl: string) {
  console.log("hier", withUrl)
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
