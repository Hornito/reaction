import importAsString from "@reactioncommerce/api-utils/importAsString.js";
import insertPrimaryShop from "@reactioncommerce/api-utils/tests/insertPrimaryShop.js";
import Factory from "/tests/util/factory.js";
import { ReactionAPICore } from "@reactioncommerce/api-core";

const ArchiveProductsMutation = importAsString("./archiveProducts.graphql");

jest.setTimeout(300000);

const internalShopId = "123";
const internalProductId = "999";
const opaqueProductId = "cmVhY3Rpb24vcHJvZHVjdDo5OTk="; // reaction/product:999
const opaqueShopId = "cmVhY3Rpb24vc2hvcDoxMjM="; // reaction/shop:123
const internalVariantIds = ["875", "874", "925"];

const shopName = "Test Shop";

const mockProduct = {
  _id: internalProductId,
  ancestors: [],
  title: "Fake Product",
  shopId: internalShopId,
  isDeleted: false,
  isVisible: true,
  supportedFulfillmentTypes: ["shipping"],
  type: "simple"
};

const mockVariant = {
  _id: internalVariantIds[0],
  ancestors: [internalProductId],
  attributeLabel: "Variant",
  title: "Fake Product Variant",
  shopId: internalShopId,
  isDeleted: false,
  isVisible: true,
  type: "variant"
};

const mockOptionOne = {
  _id: internalVariantIds[1],
  ancestors: [internalProductId, internalVariantIds[0]],
  attributeLabel: "Option",
  title: "Fake Product Option One",
  shopId: internalShopId,
  isDeleted: false,
  isVisible: true,
  type: "variant"
};

const expectedArchivedProduct = {
  products: [
    {
      isDeleted: true,
      isVisible: true,
      shop: {
        _id: opaqueShopId
      },
      title: "Fake Product"
    }]
};

const adminGroup = Factory.Group.makeOne({
  _id: "adminGroup",
  createdBy: null,
  name: "admin",
  permissions: ["reaction:legacy:products/archive"],
  slug: "admin",
  shopId: internalShopId
});

let testApp;
let mutate;
beforeAll(async () => {
  testApp = new ReactionAPICore();
  await testApp.start();
  mutate = testApp.mutate(ArchiveProductsMutation);
  await insertPrimaryShop(testApp.context, { _id: internalShopId, name: shopName });
  await testApp.collections.Groups.insertOne(adminGroup);
  await testApp.collections.Products.insertOne(mockProduct);
  await testApp.collections.Products.insertOne(mockVariant);
  await testApp.collections.Products.insertOne(mockOptionOne);

  await testApp.setLoggedInUser({
    _id: "123",
    groups: [adminGroup._id]
  });
});

// There is no need to delete any test data from collections because
// testApp.stop() will drop the entire test database. Each integration
// test file gets its own test database.
afterAll(() => testApp.stop());

// archive a product and its' variants and options
test("expect a product and all variants and options to be archived using `[productIds]` as input", async () => {
  let result;
  try {
    result = await mutate({ input: { productIds: [opaqueProductId], shopId: opaqueShopId } });
  } catch (error) {
    expect(error).toBeUndefined();
    return;
  }
  expect(result).toEqual({ archiveProducts: expectedArchivedProduct });
});
