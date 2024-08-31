/**
 * noop service to satisfy submodules dependencies
 */
class FirebaseServices {

  init() {
  }

  getAuth() {
    return null
  }

  getFirestore(): any {
    return null
  }

  getStorage() {
    return null
  }

}

export default new FirebaseServices();
