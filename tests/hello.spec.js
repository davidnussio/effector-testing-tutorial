const { fork, allSettled } = require("effector");
import { $currency, loginFx } from "../models/login";

describe("User flow", () => {
  test("should set default currency after login", async () => {
    const login = "user_1@example.com";
    const password = "pwd1";
    // Fork application and create an isolated scope
    const scope = fork({
      handlers: new Map([
        // Replace original handler in this scope
        // [loginFx, jest.fn(() => ({ settings: { currency: "CHF" } }))],
      ]),
    });

    // Start logixFx on the scope
    // and wait for computations env
    await allSettled(loginFx, {
      params: { login, password },
      scope,
    });

    // Check a store state on the scope
    expect(scope.getState($currency)).toBe("CHF");
  });
  test("should set default currency after login", async () => {
    const login = "user_2@example.com";
    const password = "pwd2";
    // Fork application and create an isolated scope
    const scope = fork({
      handlers: new Map([
        // Replace original handler in this scope
        [loginFx, jest.fn(() => ({ settings: { currency: "EURO" } }))],
      ]),
    });

    // Start logixFx on the scope
    // and wait for computations env
    await allSettled(loginFx, {
      params: { login, password },
      scope,
    });

    // Check a store state on the scope
    expect(scope.getState($currency)).toBe("EURO");
  });
});
