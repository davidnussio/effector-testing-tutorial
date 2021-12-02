import {
  combine,
  createEffect,
  createEvent,
  createStore,
  guard,
  sample,
} from "effector";
import { loadProductApi } from "./api";
import {
  incrementProductReducer,
  removeProductQuantityReducer,
} from "./reducers";
import { CartProduct, CartProducts, DeliveryCountry, Product } from "./types";

export const addProductQuantity = createEvent<CartProduct>();
export const removeProductQuantity = createEvent<CartProduct>();
export const executeRemoveProductQuantity = createEvent<CartProduct>();
export const selectDeliveryCountry = createEvent<DeliveryCountry>();
export const resetDeliveryCountry = createEvent<void>();
export const emptyCart = createEvent<void>();

// Effects
export const loadProductTypeFx = createEffect<string, Product>({
  sid: "loadProductTypeFx",
});

loadProductTypeFx.use(loadProductApi);

// Stores
export const $product = createStore<Product>({
  maxCards: 1,
  upgradeAbo: "standard",
  abo: { unitAmount: 0 },
  cards: {
    sponsor: {
      unitAmount: 0,
    },
    logo: {
      unitAmount: 0,
    },
    graphic: {
      unitAmount: 0,
    },
  },
  deliveryCountry: {
    CH: {
      unitAmount: 0,
    },
    IT: {
      unitAmount: 0,
    },
  },
}).on(loadProductTypeFx.doneData, (_, payload) => payload);

export const $cart = createStore<CartProducts>({
  sponsor: { quantity: 0 },
  logo: { quantity: 0 },
  graphic: { quantity: 0 },
})
  .on(executeRemoveProductQuantity, removeProductQuantityReducer)
  .on(addProductQuantity, incrementProductReducer)
  .reset(emptyCart);

export const $countryDelivery = createStore({
  deliveryCountry: "NONE",
  unitAmount: 0,
}).reset(resetDeliveryCountry);

export const $totalNumberOfCards = $cart.map((cart) => {
  return Object.values(cart).reduce((acc, { quantity }) => acc + quantity, 0);
});

export const $cartCartTotal = combine($cart, $product, (cart, product) => {
  return Object.entries(cart).reduce((acc, [type, { quantity }]) => {
    const cardType = product?.cards[type as "sponsor" | "logo" | "graphic"];
    if (cardType) {
      return acc + quantity * cardType.unitAmount;
    }
    return acc;
  }, 0);
});

export const $cartSubTotal = combine(
  $cartCartTotal,
  $product,
  (cartCartTotal, product) => {
    return cartCartTotal + product.abo.unitAmount;
  }
);

export const $cartTotal = combine(
  $cartSubTotal,
  $countryDelivery,
  (cartSubTotal, countryDelivery) => cartSubTotal + countryDelivery.unitAmount
);

export const $reachMaximumNumberOfCardLimit = combine(
  $totalNumberOfCards,
  $product,
  (totalNumberOfCards, product) =>
    product.maxCards < totalNumberOfCards
      ? {
          reached: true,
          maxCards: product.maxCards,
          upgradeAbo: product.upgradeAbo,
        }
      : { reached: false }
);

export const $canCheckout = combine(
  $countryDelivery,
  $reachMaximumNumberOfCardLimit,
  (countryDelivery, reachMaximumNumberOfCardLimit) =>
    countryDelivery.deliveryCountry !== "NONE" &&
    reachMaximumNumberOfCardLimit.reached === false
);

// Bind

sample({
  source: $product,
  clock: selectDeliveryCountry,
  fn: (product, deliveryCountry) => {
    return {
      deliveryCountry,
      unitAmount: product.deliveryCountry[deliveryCountry].unitAmount,
    };
  },
  target: $countryDelivery,
});

guard({
  clock: removeProductQuantity,
  filter: sample({
    source: $cart,
    clock: removeProductQuantity,
    fn: (cart, payload) => cart[payload.type].quantity - payload.quantity >= 0,
  }),
  target: executeRemoveProductQuantity,
});
