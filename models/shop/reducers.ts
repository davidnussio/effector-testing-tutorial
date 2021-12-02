import { produce } from "immer";

export const incrementProductReducer = (
  state: any,
  payload: { type: string; quantity: number }
) => {
  return produce(state, (draft: typeof state) => {
    draft[payload.type].quantity += payload.quantity;
  });
};

export const removeProductQuantityReducer = (
  state: any,
  payload: { type: string; quantity: number }
) => {
  return produce(state, (draft: typeof state) => {
    draft[payload.type].quantity -= payload.quantity;
  });
};
