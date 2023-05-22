<script>
export default {
  data() {
    return {
      show: true
    }
  }
}
</script>

<template>

<!--  <Transition name="bounce" appear>-->
<!--    <p style="text-align: center;">hello</p>-->
<!--  </Transition>-->

  <!--  <Transition name="bounce">-->
  <!--    <p v-if="show" style="text-align: center;">-->
  <!--      Hello here is some bouncy text!-->
  <!--    </p>-->
  <!--  </Transition>-->

<!--  <button @click="show = !show">Toggle</button>-->
  <transition appear enter-active-class="fadeIn" style="transition-delay: 3.5s">
    <p>hello</p>
  </transition>

  <!--  <transition-->
  <!--    appear-->
  <!--    enter-active-class="animated fadeInRight"-->
  <!--    leave-active-class="animated fadeOut">-->
  <!--    <q-btn-->
  <!--      color="secondary"-->
  <!--      icon="mail"-->
  <!--      label="Email"-->
  <!--    />-->
  <!--  </transition>-->

  <!--  <transition name="delayed-appear" appear>-->
  <!--    <q-btn class="fit text-warning"-->
  <!--           outline-->
  <!--           data-testid="createFirstTabsetBtn"-->
  <!--           label="create your first tabset"></q-btn>-->
  <!--  </transition>-->

</template>

<style scoped>
.v-enter-active,
.v-leave-active {
  transition: opacity 0.5s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}

.v-enter-to {
  opacity: 100%;
}

.delayed-appear-enter-active {
  transition: all 3s ease-in;
  transition-delay: 3s
}

.delayed-appear-enter-from,
.delayed-appear-leave-to {
  opacity: 0
}

/*
  Enter and leave animations can use different
  durations and timing functions.
*/
.fade-in-right-enter-active {
  transition: all 10.3s ease-out;
  transition-delay: 5s;
}

.slidefade-leave-active {
  transition: all 0.8s cubic-bezier(1, 0.5, 0.8, 1);
}

.slidefade-enter-from,
.slidefade-leave-to {
  transform: translateX(20px);
  opacity: 0;
}

.bounce-enter-active {
  animation: bounce-in 0.5s;
}

.bounce-leave-active {
  animation: bounce-in 0.5s reverse;
}

@keyframes bounce-in {
  0% {
    transform: scale(0);
  }
  50% {
    transform: scale(10.25);
  }
  100% {
    transform: scale(1);
  }
}

</style>
