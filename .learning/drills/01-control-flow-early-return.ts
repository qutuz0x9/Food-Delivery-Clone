// Drill 01: control flow and early return
// From: the recurring mistake "one response per request" (errorHandler reviews, 2026-10-22 and 2026-10-25): a
// branch sent a response but didn't stop, so the code after it ran too and answered a second time.
// Goal: every path sends exactly ONE response, and a branch that answers also ends the function.
//
// Run: npx tsx .learning/drills/01-control-flow-early-return.ts
// Done when the last line says "All checks passed". Then: /feature-build drill check

// A tiny stand-in for Express's `res`. Like the real one, it throws if you answer twice
// (Express says "Cannot set headers after they are sent to the client").
interface FakeResponse {
  readonly sent: { status: number; body: string }[];
  send(status: number, body: string): void;
}

const createResponse = (): FakeResponse => {
  const sent: { status: number; body: string }[] = [];
  return {
    sent,
    send(status, body) {
      if (sent.length > 0) {
        throw new Error(
          `Response already sent (${sent[0]?.status}); tried to send ${status} too`,
        );
      }
      sent.push({ status, body });
    },
  };
};

// ---------------------------------------------------------------------------------------------------------------
// Exercise 1: a coffee order. Answer with exactly one of:
//   - quantity is 0 or less       → 400 "Quantity must be at least 1"
//   - quantity is more than stock → 409 "Only <stock> left"
//   - otherwise                   → 201 "Ordered <quantity> x <drink>"
// LEARN-TODO (drill): one response per path; a branch that answers must stop the function
export function orderCoffee(
  drink: string,
  quantity: number,
  stock: number,
  res: FakeResponse,
): void {
  if (quantity <= 0) {
    res.send(400, "Quantity must be at least 1");
    return;
  }
  if (quantity > stock) {
    res.send(409, `Only ${stock} left`);
    return;
  }
  res.send(201, `Ordered ${quantity} x ${drink}`);
}

// ---------------------------------------------------------------------------------------------------------------
// Exercise 2: an error handler for the coffee shop, like errorHandler but smaller.
//   - a ShopError          → its own status and message
//   - a SyntaxError        → 400 "Malformed request"
//   - anything else        → 500 "Something went wrong"
export class ShopError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// LEARN-TODO (drill): check the most specific error first, and make sure only one branch answers
export function handleShopError(err: unknown, res: FakeResponse): void {
  if (err instanceof ShopError) {
    res.send(err.status, err.message);
    return;
  }
  if (err instanceof SyntaxError) {
    res.send(400, "Malformed request");
    return;
  }
  res.send(500, "Something went wrong");
}

// ---------------------------------------------------------------------------------------------------------------
// Exercise 3: guard clauses. Return the FIRST problem with the cart, or "ok":
//   - no items          → "Cart is empty"
//   - total under 50    → "Minimum order is 50"
//   - shop is closed    → "Shop is closed"
//   - otherwise         → "ok"
// LEARN-TODO (drill): no else and no nesting: each check returns as soon as it finds a problem
export function checkoutProblem(
  items: number,
  total: number,
  shopOpen: boolean,
): string {
  if (items === 0) return "Cart is empty";
  if (total < 50) return "Minimum order is 50";
  if (!shopOpen) return "Shop is closed";
  return "ok";
}

// ===============================================================================================================
// Checks: don't change anything below this line.
import assert from "node:assert/strict";

let failed = 0;
const check = (name: string, run: () => void): void => {
  try {
    run();
    console.log(`✓ ${name}`);
  } catch (error) {
    failed += 1;
    console.log(
      `✗ ${name}\n    ${error instanceof Error ? error.message : String(error)}`,
    );
  }
};

const sendOne = (
  act: (res: FakeResponse) => void,
): { status: number; body: string } => {
  const res = createResponse();
  act(res);
  assert.equal(res.sent.length, 1, "expected exactly one response");
  return res.sent[0]!;
};

check("orderCoffee: 0 cups → 400, one response", () => {
  assert.deepEqual(
    sendOne((res) => orderCoffee("latte", 0, 5, res)),
    { status: 400, body: "Quantity must be at least 1" },
  );
});
check("orderCoffee: more than stock → 409, one response", () => {
  assert.deepEqual(
    sendOne((res) => orderCoffee("latte", 9, 3, res)),
    { status: 409, body: "Only 3 left" },
  );
});
check("orderCoffee: a normal order → 201, one response", () => {
  assert.deepEqual(
    sendOne((res) => orderCoffee("latte", 2, 3, res)),
    { status: 201, body: "Ordered 2 x latte" },
  );
});
check("orderCoffee: a negative quantity is a 400, not a 409", () => {
  assert.equal(sendOne((res) => orderCoffee("mocha", -1, 0, res)).status, 400);
});
check("handleShopError: a ShopError → its own status and message", () => {
  assert.deepEqual(
    sendOne((res) =>
      handleShopError(new ShopError(404, "Drink not found"), res),
    ),
    {
      status: 404,
      body: "Drink not found",
    },
  );
});
check("handleShopError: a SyntaxError → 400", () => {
  assert.deepEqual(
    sendOne((res) => handleShopError(new SyntaxError("Unexpected token"), res)),
    {
      status: 400,
      body: "Malformed request",
    },
  );
});
check(
  "handleShopError: anything else → 500, without leaking the message",
  () => {
    const sent = sendOne((res) =>
      handleShopError(new Error("db password is hunter2"), res),
    );
    assert.deepEqual(sent, { status: 500, body: "Something went wrong" });
  },
);
check("handleShopError: a thrown string → 500", () => {
  assert.equal(sendOne((res) => handleShopError("oops", res)).status, 500);
});
check("checkoutProblem: the first problem wins", () => {
  assert.equal(checkoutProblem(0, 0, false), "Cart is empty");
  assert.equal(checkoutProblem(2, 30, false), "Minimum order is 50");
  assert.equal(checkoutProblem(2, 80, false), "Shop is closed");
  assert.equal(checkoutProblem(2, 80, true), "ok");
});

console.log(
  failed === 0 ? "\nAll checks passed" : `\n${failed} check(s) failed`,
);
process.exitCode = failed === 0 ? 0 : 1;
