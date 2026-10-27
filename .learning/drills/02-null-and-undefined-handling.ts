// Drill 02: null and undefined handling (`?.`, `??`, and why not `!`)
// From: the Login Customer final review (2026-10-27): `user!.passwordHash` read a field of a value that could be
// null, so an unknown email crashed with a TypeError and answered 500 instead of 401.
// Goal: read a value that may be missing without crashing, give a fallback with `??`, and never use `!` to silence
// TypeScript.
//
// Run: npx tsx .learning/drills/02-null-and-undefined-handling.ts
// Done when the last line says "All checks passed". Then: /feature-build drill check
//
// One rule for the whole file: no non-null assertions (`value!`). A check at the bottom looks for them.

interface Loan {
  readonly title: string;
}

interface Member {
  readonly fullName: string;
  // null = the member removed their nickname; undefined = they never set one; "" = they chose an empty one.
  readonly nickname?: string | null;
  readonly loans?: readonly Loan[];
}

// === exercises start ===========================================================================================

// Exercise 1: the name shown at the top of the library app.
//   - no member (not logged in)            → "Guest"
//   - a member with a nickname             → the nickname, even if it is "" (an empty nickname is their choice)
//   - a member with a null/missing nickname → their fullName
// LEARN-TODO (drill): read through a value that may be null, and fall back only on null/undefined
export function displayName(member: Member | null): string {
  throw new Error("LEARN-TODO");
}

// Exercise 2: the first book a member borrowed, for the "continue reading" box.
//   - no member, no loans list, or an empty list → undefined
//   - otherwise                                   → the title of the first loan
// LEARN-TODO (drill): one expression; it must not throw for any missing piece along the way
export function firstLoanTitle(member: Member | undefined): string | undefined {
  throw new Error("LEARN-TODO");
}

// Exercise 3: the staff door. A card may be lost (null). Like login, the code must be checked EVERY time, even with
// no card, so a missing card takes as long to refuse as a wrong code. `checkCode(code, null)` is allowed and
// always answers false.
interface StaffCard {
  readonly storedCode: string;
}

// LEARN-TODO (drill): call checkCode exactly once, with the card's storedCode or null; never crash on a null card
export function openStaffDoor(
  card: StaffCard | null,
  code: string,
  checkCode: (code: string, storedCode: string | null) => boolean,
): "open" | "denied" {
  throw new Error("LEARN-TODO");
}

// === Checks: don't change anything below this line. ============================================================
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

let failed = 0;
const check = (name: string, run: () => void): void => {
  try {
    run();
    console.log(`✓ ${name}`);
  } catch (error) {
    failed += 1;
    console.log(`✗ ${name}\n    ${error instanceof Error ? error.message : String(error)}`);
  }
};

check("displayName: no member → Guest", () => {
  assert.equal(displayName(null), "Guest");
});
check("displayName: a nickname wins over the full name", () => {
  assert.equal(displayName({ fullName: "Mona Ali", nickname: "Mo" }), "Mo");
});
check("displayName: a null or missing nickname → the full name", () => {
  assert.equal(displayName({ fullName: "Mona Ali", nickname: null }), "Mona Ali");
  assert.equal(displayName({ fullName: "Omar Said" }), "Omar Said");
});
check("displayName: an empty nickname is kept (it isn't missing)", () => {
  assert.equal(displayName({ fullName: "Mona Ali", nickname: "" }), "");
});
check("firstLoanTitle: the first title", () => {
  assert.equal(firstLoanTitle({ fullName: "Mona", loans: [{ title: "Dune" }, { title: "Emma" }] }), "Dune");
});
check("firstLoanTitle: undefined for every missing piece, without throwing", () => {
  assert.equal(firstLoanTitle(undefined), undefined);
  assert.equal(firstLoanTitle({ fullName: "Mona" }), undefined);
  assert.equal(firstLoanTitle({ fullName: "Mona", loans: [] }), undefined);
});

const spyCheck = (answer: boolean) => {
  const calls: [string, string | null][] = [];
  const fn = (code: string, stored: string | null): boolean => {
    calls.push([code, stored]);
    return stored !== null && answer;
  };
  return { calls, fn };
};

check("openStaffDoor: the right code opens it", () => {
  const spy = spyCheck(true);
  assert.equal(openStaffDoor({ storedCode: "hash-1" }, "1234", spy.fn), "open");
  assert.deepEqual(spy.calls, [["1234", "hash-1"]]);
});
check("openStaffDoor: a wrong code is denied", () => {
  const spy = spyCheck(false);
  assert.equal(openStaffDoor({ storedCode: "hash-1" }, "9999", spy.fn), "denied");
});
check("openStaffDoor: no card → denied, and checkCode still ran once with null", () => {
  const spy = spyCheck(true);
  assert.equal(openStaffDoor(null, "1234", spy.fn), "denied");
  assert.deepEqual(spy.calls, [["1234", null]]);
});
check("no non-null assertions (`value!`) in the exercises", () => {
  const source = readFileSync(new URL(import.meta.url), "utf8");
  const exercises = source.slice(source.indexOf("// === exercises start"), source.indexOf("// === Checks"));
  const found = exercises
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("//"))
    .filter((line) => /[\w\])]!(?!=)/.test(line));
  assert.deepEqual(found, [], "remove the `!`: narrow with an if, or use ?. and ??");
});

console.log(failed === 0 ? "\nAll checks passed" : `\n${failed} check(s) failed`);
process.exitCode = failed === 0 ? 0 : 1;
