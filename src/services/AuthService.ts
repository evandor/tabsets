import {
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  UserCredential
} from 'firebase/auth/web-extension'
import { LocalStorage } from 'quasar'
import { CURRENT_USER_EMAIL } from 'boot/constants'
import { useAuthStore } from 'stores/authStore'
import { NotificationType, useNotificationHandler } from 'src/core/services/ErrorHandler'

export function useAuthService () {

  const { handleError } = useNotificationHandler()

  const signin = async (email: string, password: string, rememberMe: boolean, registerMode: boolean) => {
    // loading.value = true
    const auth = getAuth()
    try {
      let userCredential: UserCredential = null as unknown as UserCredential
      console.log(`signing with ${email} and password length ${password.length}`)
      if (registerMode) {
        userCredential = await createUserWithEmailAndPassword(auth, email, password)
      } else {
        userCredential = await signInWithEmailAndPassword(auth, email, password)
      }
      const user = userCredential.user
      if (rememberMe) {
        LocalStorage.set(CURRENT_USER_EMAIL, email)
      } else {
        LocalStorage.remove(CURRENT_USER_EMAIL)
      }
      await useAuthStore().setUser(user)
      // createGettingStartedTabset()
      // loading.value = false
      // if (inBexMode()) {
      //   await router.push('/popup')
      // } else {
      //   await router.push('/tabsets')
      // }
      // emits('hideLogin')
    } catch (error: any) {
      const errorCode = error.code
      const errorMessage = error.message
      // showResetPassword.value = true
      switch (errorCode) {
        case 'auth/invalid-credential':
          handleError('Invalid Credentials or No Account', NotificationType.NOTIFY)
          break
        default:
          console.error('error', error, typeof error, errorCode, errorMessage)
          handleError(error, NotificationType.NOTIFY)
      }
      //loading.value = false
    }
  }

  return {
    signin
  }
}
