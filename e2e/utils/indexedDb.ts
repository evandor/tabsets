export function useIndexedDb() {
  let db: any
  let dbNamespace: any

  function setupDB(namespace: string) {
    console.log('======')
    return new Promise<any>(function (resolve, reject) {
      if (namespace != dbNamespace) {
        db = null
      }
      dbNamespace = namespace

      // If setupDB has already been run and the database was set up, no need to
      // open the database again; just resolve and return!
      if (db) {
        resolve(db)
        return
      }

      let dbName = namespace == '' ? 'myDatabase' : 'myDatabase_' + namespace
      let dbReq = indexedDB.open(dbName, 2)

      // Fires when the version of the database goes up, or the database is
      // created for the first time
      dbReq.onupgradeneeded = function (event: any) {
        db = event.target!.result

        // Create an object store named notes, or retrieve it if it already
        // exists. Object stores in databases are where data are stored.
        let notes
        if (!db.objectStoreNames.contains('notes')) {
          notes = db.createObjectStore('notes', { autoIncrement: true })
        } else {
          notes = dbReq.transaction!.objectStore('notes')
        }
      }

      // Fires once the database is opened (and onupgradeneeded completes, if
      // onupgradeneeded was called)
      dbReq.onsuccess = function (event: any) {
        // Set the db variable to our database so we can use it!
        db = event.target!.result
        resolve(db)
      }

      // Fires when we can't open the database
      dbReq.onerror = function (event: any) {
        reject(`error opening database ${event.target!.errorCode}`)
      }
    })
  }

  return {
    setupDB,
  }
}
