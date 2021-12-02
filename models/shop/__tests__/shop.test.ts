import { allSettled, fork } from "effector";
import {
  $canCheckout,
  $cart,
  $cartSubTotal,
  $cartTotal,
  $reachMaximumNumberOfCardLimit,
  $totalNumberOfCards,
  addProductQuantity,
  CartProduct,
  emptyCart,
  loadProductTypeFx,
  removeProductQuantity,
  resetDeliveryCountry,
  selectDeliveryCountry,
} from "..";

const deliveryCountry = {
  CH: {
    unitAmount: 0,
  },
  IT: {
    unitAmount: 500,
  },
};

const mockProducts = {
  standard: {
    maxCards: 10,
    upgradeAbo: "pro",
    abo: {
      unitAmount: 3600,
    },
    cards: {
      sponsor: {
        unitAmount: 4000,
      },
      logo: {
        unitAmount: 4500,
      },
      graphic: {
        unitAmount: 5000,
      },
    },
    deliveryCountry,
  },
  pro: {
    maxCards: 50,
    upgradeAbo: "enterprise",
    abo: {
      unitAmount: 7200,
    },
    cards: {
      sponsor: {
        unitAmount: 3500,
      },
      logo: {
        unitAmount: 4000,
      },
      graphic: {
        unitAmount: 4500,
      },
    },
    deliveryCountry,
  },
};

const identity = <T>(x: T) => x;

describe("Shopping cart", () => {
  beforeEach(() => {
    emptyCart();
  });

  test("Add sponsor items", () => {
    addProductQuantity({ type: "sponsor", quantity: 1 });
    addProductQuantity({ type: "sponsor", quantity: 3 });
    expect($cart.getState().sponsor).toEqual({ quantity: 4 });
  });

  test("Add and remove sponsor items", () => {
    addProductQuantity({ type: "sponsor", quantity: 10 });
    removeProductQuantity({ type: "sponsor", quantity: 3 });
    expect($cart.getState().sponsor).toEqual({
      quantity: 7,
    });
  });

  test("Remove items when there aren't cards into shopping cart", () => {
    removeProductQuantity({ type: "sponsor", quantity: 3 });
    removeProductQuantity({ type: "logo", quantity: 3 });
    removeProductQuantity({ type: "sponsor", quantity: 3 });

    expect($cart.getState()).toMatchInlineSnapshot(`
      Object {
        "graphic": Object {
          "quantity": 0,
        },
        "logo": Object {
          "quantity": 0,
        },
        "sponsor": Object {
          "quantity": 0,
        },
      }
    `);
  });

  test("Add multiple types items to cart", () => {
    addProductQuantity({ type: "sponsor", quantity: 1 });
    addProductQuantity({ type: "sponsor", quantity: 3 });
    addProductQuantity({ type: "logo", quantity: 3 });
    addProductQuantity({ type: "logo", quantity: 2 });
    addProductQuantity({ type: "graphic", quantity: 5 });

    expect($cart.getState()).toMatchInlineSnapshot(`
      Object {
        "graphic": Object {
          "quantity": 5,
        },
        "logo": Object {
          "quantity": 5,
        },
        "sponsor": Object {
          "quantity": 4,
        },
      }
    `);
  });

  test("Add and remove multiple types items to cart", () => {
    addProductQuantity({ type: "sponsor", quantity: 1 });
    addProductQuantity({ type: "sponsor", quantity: 3 });
    addProductQuantity({ type: "logo", quantity: 3 });
    addProductQuantity({ type: "logo", quantity: 2 });
    addProductQuantity({ type: "graphic", quantity: 5 });

    removeProductQuantity({ type: "sponsor", quantity: 1 });
    removeProductQuantity({ type: "logo", quantity: 1 });
    removeProductQuantity({ type: "graphic", quantity: 1 });

    expect($cart.getState()).toMatchInlineSnapshot(`
      Object {
        "graphic": Object {
          "quantity": 4,
        },
        "logo": Object {
          "quantity": 4,
        },
        "sponsor": Object {
          "quantity": 3,
        },
      }
    `);
  });

  test("Count cart items", () => {
    addProductQuantity({ type: "sponsor", quantity: 10 });
    removeProductQuantity({ type: "sponsor", quantity: 3 });
    addProductQuantity({ type: "sponsor", quantity: 5 });
    expect($totalNumberOfCards.getState()).toEqual(12);
  });
});

describe("Checkout scenario with 2 x sponsor, 4 x logo and 3 x graphic", () => {
  jest.fn().mockReturnValueOnce(mockProducts).mockReturnValueOnce(mockProducts);

  const scope = fork({
    handlers: new Map([
      [
        loadProductTypeFx,
        jest.fn((type: keyof typeof mockProducts) => mockProducts[type]),
      ],
    ]),
  });

  beforeEach(async () => {
    await allSettled(emptyCart, { scope });
    await allSettled(resetDeliveryCountry, { scope });

    await allSettled(loadProductTypeFx, { params: "standard", scope });

    await Promise.all(
      [
        identity<CartProduct>({ type: "sponsor", quantity: 2 }),
        identity<CartProduct>({ type: "logo", quantity: 4 }),
        identity<CartProduct>({ type: "graphic", quantity: 3 }),
      ].map((params) =>
        allSettled(addProductQuantity, {
          params,
          scope,
        })
      )
    );
  });

  test("Calculate cart without abo subtotal", async () => {
    expect(scope.getState($cartSubTotal)).toMatchInlineSnapshot(`44600`);
  });

  test("Calculate cart total without delivery country selected", async () => {
    expect(scope.getState($cartTotal)).toMatchInlineSnapshot(`44600`);
  });

  test("Calculate cart total with country delivery with zero fee", async () => {
    await allSettled(selectDeliveryCountry, { params: "CH", scope });

    expect(scope.getState($cartTotal)).toMatchInlineSnapshot(`44600`);
  });

  test("Calculate cart total with country delivery with 500 fee", async () => {
    await allSettled(selectDeliveryCountry, { params: "IT", scope });

    expect(scope.getState($cartTotal)).toMatchInlineSnapshot(`45100`);
  });

  test("With 10 cards should not reach maxCard limit", async () => {
    await allSettled(addProductQuantity, {
      params: { type: "sponsor", quantity: 1 },
      scope,
    });

    expect(scope.getState($reachMaximumNumberOfCardLimit))
      .toMatchInlineSnapshot(`
      Object {
        "reached": false,
      }
    `);
  });

  test("With 11 cards should reach maxCard limit", async () => {
    await allSettled(addProductQuantity, {
      params: { type: "sponsor", quantity: 2 },
      scope,
    });

    expect(scope.getState($reachMaximumNumberOfCardLimit))
      .toMatchInlineSnapshot(`
      Object {
        "maxCards": 10,
        "reached": true,
        "upgradeAbo": "pro",
      }
    `);
  });

  test("Cannot checkout because delivery country has not been selected", async () => {
    expect(scope.getState($canCheckout)).toBeFalsy();
  });

  test("Cannot checkout because has been reached maxCard", async () => {
    await allSettled(addProductQuantity, {
      params: identity<CartProduct>({ type: "sponsor", quantity: 2 }),
      scope,
    });

    await allSettled(selectDeliveryCountry, { params: "CH", scope });

    expect(scope.getState($canCheckout)).toBeFalsy();
  });

  test("Enable checkout only when maxCard doesn't reach and delivery country has been selected", async () => {
    await allSettled(selectDeliveryCountry, { params: "IT", scope });

    expect(scope.getState($canCheckout)).toBeTruthy();
  });
});
