<script setup>
import { useData } from 'vitepress';
import { SidePanelPage } from 'src/pages/SidePanelPage.vue';

const { page } = useData()
</script>

<pre>{{ page }}</pre>
