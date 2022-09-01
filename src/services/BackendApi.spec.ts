import {describe, expect, it} from '@jest/globals';
import {BackendApi} from "src/services/BackendApi";

describe("API", () => {

  it("get all products", async () => {
    const products = [
      {
        "id": "9",
        "type": "CREDIT_CARD",
        "name": "GEM Visa",
        "version": "v2"
      },
      {
        "id": "10",
        "type": "CREDIT_CARD",
        "name": "28 Degrees",
        "version": "v1"
      }
    ];
    // nock(API.url)
    //   .get('/products')
    //   .reply(200,
    //     products,
    //     {'Access-Control-Allow-Origin': '*'});
    // const respProducts = new BackendApi("null", "null").getTabsets("username");
    // expect(respProducts).toEqual(products);
  });

  // test("get product ID 50", async () => {
  //   const product = {
  //     "id": "50",
  //     "type": "CREDIT_CARD",
  //     "name": "28 Degrees",
  //     "version": "v1"
  //   };
  //   nock(API.url)
  //     .get('/products/50')
  //     .reply(200, product, {'Access-Control-Allow-Origin': '*'});
  //   const respProduct = await API.getProduct("50");
  //   expect(respProduct).toEqual(product);
  // });
});
