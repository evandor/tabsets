<template>
    <q-banner rounded  style="border:1px solid orange">On this settings page, you can
      adjust your sharing experience
    </q-banner>

    <div class="row items-baseline q-ma-md q-gutter-lg">
      <div class="col-3">
        Nickname
      </div>
      <div class="col-7">
        <q-input color="primary" filled v-model="nickname" label="">
          <template v-slot:prepend>
            <q-icon name="ios_share"/>
          </template>
        </q-input>
      </div>
      <div class="col"></div>

      <div class="col-3">
        Avatar
      </div>
      <div class="col-7">
        <q-input type="url" color="primary" filled v-model="avatar" label="">
          <template v-slot:prepend>
            <q-icon name="ios_share"/>
          </template>
        </q-input>
      </div>
      <div class="col text-right">
        <q-avatar>
          <img :src="avatar">
        </q-avatar>
      </div>



<!--      <div class="col-3">-->
<!--        Installation ID-->
<!--      </div>-->
<!--      <div class="col-7">-->
<!--        {{ installationId }}-->
<!--      </div>-->
<!--      <div class="col">-->

<!--      </div>-->

    </div>


</template>

<script lang="ts" setup>

</script>
