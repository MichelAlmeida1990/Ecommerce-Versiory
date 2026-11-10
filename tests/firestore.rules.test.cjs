const { after, before, test } = require("node:test");
const assert = require("node:assert/strict");
const {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} = require("@firebase/rules-unit-testing");
const { doc, getDoc, setDoc } = require("firebase/firestore");
const fs = require("node:fs");
const path = require("node:path");

const projectId = "demo-versiory";
let testEnv;

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId,
    firestore: {
      rules: fs.readFileSync(path.join(__dirname, "..", "firestore.rules"), "utf8"),
    },
  });
});

after(async () => {
  await testEnv.cleanup();
});

test("public users cannot read private product fields or read/create orders", async () => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "tenants/shop/products/1"), { name: "Produto" });
    await setDoc(doc(context.firestore(), "tenants/shop/categories/cat"), { name: "Categoria" });
    await setDoc(doc(context.firestore(), "tenants/shop/coupons/promo"), { codigo: "PROMO" });
    await setDoc(doc(context.firestore(), "tenants/shop/orders/secret"), { customerEmail: "a@example.com" });
  });

  const visitor = testEnv.unauthenticatedContext().firestore();
  const staff = testEnv.authenticatedContext("staff", {
    role: "seller",
    tenantId: "shop",
  }).firestore();
  await assertFails(getDoc(doc(visitor, "tenants/shop/products/1")));
  await assertSucceeds(getDoc(doc(visitor, "tenants/shop/categories/cat")));
  await assertFails(getDoc(doc(visitor, "tenants/shop/coupons/promo")));
  await assertSucceeds(getDoc(doc(staff, "tenants/shop/coupons/promo")));
  await assertFails(getDoc(doc(visitor, "tenants/shop/orders/secret")));
  await assertFails(setDoc(doc(visitor, "tenants/shop/orders/new"), { customerEmail: "x@example.com" }));
});

test("customers can access only their UID profile and cart", async () => {
  const owner = testEnv.authenticatedContext("customer-a", {
    email: "a@example.com",
  }).firestore();
  const other = testEnv.authenticatedContext("customer-b").firestore();

  await assertSucceeds(setDoc(doc(owner, "tenants/shop/customers/customer-a"), {
    uid: "customer-a",
    email: "a@example.com",
    name: "A",
    addresses: [],
  }));
  await assertFails(getDoc(doc(other, "tenants/shop/customers/customer-a")));
  await assertFails(setDoc(doc(owner, "tenants/shop/customers/customer-a"), {
    uid: "customer-a",
    password: "forbidden",
  }));

  await assertSucceeds(setDoc(doc(owner, "tenants/shop/carts/customer-a"), { items: [] }));
  await assertFails(getDoc(doc(other, "tenants/shop/carts/customer-a")));
});

test("staff claims are restricted to their tenant", async () => {
  const staff = testEnv.authenticatedContext("staff-a", {
    role: "seller",
    tenantId: "shop-a",
  }).firestore();
  await assertSucceeds(setDoc(doc(staff, "tenants/shop-a/products/1"), { name: "Produto" }));
  await assertFails(setDoc(doc(staff, "tenants/shop-b/products/1"), { name: "Produto" }));
  await assertSucceeds(setDoc(doc(staff, "tenants/shop-a/orders/1"), { customerEmail: "a@example.com" }));
});
