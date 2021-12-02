import { produce } from "immer";
import { CartProducts, CartProductType } from "./types";

export const incrementProductReducer = (
  state: any,
  payload: { type: CartProductType; quantity: number }
) => {
  return produce<CartProducts>(state, (draft) => {
    draft[payload.type].quantity += payload.quantity;
  });
};

export const removeProductQuantityReducer = (
  state: any,
  payload: { type: CartProductType; quantity: number }
) => {
  return produce<CartProducts>(state, (draft) => {
    draft[payload.type].quantity -= payload.quantity;
  });
};
