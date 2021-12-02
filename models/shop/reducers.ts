export const incrementProductReducer = (
  state: any,
  payload: { type: string; quantity: number }
) => {
  const draft = state[payload.type];
  return {
    ...state,
    [payload.type]: { ...draft, quantity: draft.quantity + payload.quantity },
  };
};

export const removeProductQuantityReducer = (
  state: any,
  payload: { type: string; quantity: number }
) => {
  const draft = state[payload.type];
  return {
    ...state,
    [payload.type]: {
      ...draft,
      quantity: draft.quantity - payload.quantity,
    },
  };
};
