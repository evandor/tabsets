<template>
  <q-page class="flex flex-center bg-grey-1">



    <q-card class="q-pa-md" style="max-width: 800px; width: 90vw; max-height: 90vh;">
      <q-card-section class="row items-center justify-between">
        <div class="text-h6">Disclaimer
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section class="scroll" style="max-height: 70vh;">
        <div>
          <p><strong>Legal disclaimer</strong></p>
          <p>The contents of these pages were prepared with utmost care. Nonetheless, we cannot assume liability for the
            timeless accuracy, correctness and completeness of the information.<br><br>

            Our website contains links to external websites. The content of these websites has not been investigated or
            analyzed by us, and we do not warrant the adequacy, accuracy, reliability or completeness of any information
            on hyperlinked or referenced websites and disclaim any liability for any and all of their content.
            Responsibility for the contents of the linked pages is always held by the provider or operator of the pages.
          </p>

          <p><strong>Copyright</strong></p>
          <p>The content and works created by the page operators and presented on these pages is governed by German
            copyright law. Reproduction, processing, dissemination and any type of use beyond what is permitted under
            copyright requires written authorisation from the respective author and/or the creator. Downloads and copies
            of these pages are only meant for private use and exclude any commercial use. In so far as the contents on
            this page were not created by the operator, third-party copyrights are respected. In particular, the content
            of third parties is identified as such. Should you nevertheless become aware of an infringement of
            copyright, we kindly request that you inform us. As soon as we become aware of breaches of law, we will
            immediately remove such contents.</p>

          <p><strong>Data Protection</strong></p>
          <p>In general, when visiting our website no personal data are saved. However, these data can be given on a
            voluntary basis (e.g. name or email address). No data will be passed on to third parties without your
            consent. We point out that in regard to unsecured data transmission in the internet (e.g. via email),
            security cannot be guaranteed. Such data could possibly be accessed by third parties. <br><br>

            The use of contact data published within the framework of the imprint regulations by third parties for
            sending non-requested advertising material and information is hereby explicitly prohibited. The site
            operators expressly reserve the right to take legal action if unsolicited promotional information such as
            spam emails are sent.</p>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right">
        <q-btn flat label="back" color="secondary" @click="goBack" />
      </q-card-actions>
    </q-card>

  </q-page>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

function goBack() {
  router.back();
}
</script>
