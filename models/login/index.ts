import { createEffect, createEvent, createStore, sample } from "effector";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const userDb = {
  "user_1@example.com": { currency: "CHF", password: "pwd1" },
  "user_2@example.com": { currency: "EURO", password: "pwd2" },
};

export const loginFx = createEffect<
  {
    login: keyof typeof userDb;
    password: string;
  },
  { settings: { currency: string; password: string } },
  Error
>({
  sid: "auth/loginFx",
});

loginFx.use(async ({ login, password }) => {
  await sleep(30);
  if (!userDb[login]) {
    throw new Error("Invalid user");
  }
  const userData = userDb[login];

  if (userData.password !== password) {
    throw new Error("Invalid password");
  }

  return { settings: userData };
});

// Event of currency change
export const changeCurrency = createEvent();

// Currency store
export const $currency = createStore("")
  // just save the payload of event to a store
  .on(changeCurrency, (_, newCurrency) => newCurrency);

sample({
  // After login request successfully ends
  source: loginFx.doneData,
  // get a currency from a result
  fn: (data) => data.settings.currency ?? "TBH",
  // and can event changeCurrency with it
  target: changeCurrency,
});
