<template>
  <q-page class="flex flex-center bg-grey-1">

    <q-card class="q-pa-md" style="max-width: 800px; width: 90vw; max-height: 90vh;">
      <q-card-section class="row items-center justify-between">
        <div class="text-h6">Privacy
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section class="scroll" style="max-height: 70vh;">
        <div>
          <p><strong>Privacy Notice</strong></p>
          <p>We take the protection of your personal data very seriously. In accordance with the European General Data
            Protection Regulation (GDPR), we are committed to ensuring that your personal data is collected, processed,
            and stored in a lawful, transparent, and secure manner.
          </p>

          <p><strong>Data Collection and Usage</strong></p>
          <p>We only collect personal data when it is necessary for the use of our services, such as when you register,
            use our features, or contact us. This data may include your name, email address, usage data, and technical
            information (e.g. browser type, device type, IP address).</p>

          <p><strong>Analytics and Cookies</strong></p>
          <p>We use third-party services such as Google Analytics to understand how visitors use our site and to
            improve your experience. These services may use cookies and similar technologies to collect anonymized usage
            data.<br>

            By using our website, you consent to the use of these tools. You can revoke or manage your consent at any
            time by adjusting your browser settings or using our cookie banner.
          </p>
          <p><strong>Data Security</strong></p>
          <p>Your data is stored securely and will never be shared with third parties without your explicit consent,
            unless required by law.
          </p>
          <p><strong>Your Rights</strong></p>
          <p>In accordance with GDPR, you have the right to:
          <ul>
            <li>Access your stored personal data</li>
            <li>Request correction or deletion</li>
            <li>Restrict or object to data processing</li>
            <li>Lodge a complaint with a data protection authority</li>
          </ul>

          If you have any questions or concerns about your personal data, feel free to contact us at
          <i>info@bibbly.cloud</i>.
          </p>
          <p>Last updated: July 2025</p>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right">
        <q-btn flat label="Back" color="secondary" @click="goBack" />
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
