export function useJestHelper() {

  const dbInit = async function (request:any) {
    const db = request.result;
    //tabsetsDbStore =
    db.createObjectStore("tabsets");
    db.createObjectStore("content");
    db.createObjectStore("thumbnails");
    db.createObjectStore("mhtml");
    db.createObjectStore("logs", { autoIncrement: true });
    // store.createIndex("by_title", "title", {unique: true});
    // store.put({title: "Quarry Memories", author: "Fred", isbn: 123456});
    //IndexedDbPersistenceService.init();
  }



  return {
    dbInit
  }
}
