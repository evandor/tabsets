import {describe, expect, it} from '@jest/globals';
import {BackendApi} from "src/services/BackendApi";
import {PactV3, MatchersV3, V3MockServer} from '@pact-foundation/pact';

// Create a 'pact' between the two applications in the integration we are testing
const provider = new PactV3({
  dir: 'pacts',//path.resolve(process.cwd(), 'pacts'),
  consumer: 'MyConsumer',
  provider: 'MyProvider',
});

describe("API", () => {

  const dogExample = { dog: 1 };
  const EXPECTED_BODY = MatchersV3.eachLike(dogExample);

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

    provider
      .given('I have a list of dogs')
      .uponReceiving('a request for all dogs with the builder pattern')
      .withRequest({
        method: 'GET',
        path: '/tabsets',
        //query: { from: 'today' },
        //headers: { Accept: 'application/json' },
      })
      .willRespondWith({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: EXPECTED_BODY,
      });

    // @ts-ignore
    return provider.executeTest((mockserver:V3MockServer) => {
      // Act: test our API client behaves correctly
      //
      // Note we configure the DogService API client dynamically to
      // point to the mock service Pact created for us, instead of
      // the real one
      const backendApi = new BackendApi(mockserver.url, "");
      backendApi.getTabsets('today')
        .then(res => {
          expect(res.data[0]).toEqual({})
        })

      // Assert: check the result

      //return Promise.resolve()
    });

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
