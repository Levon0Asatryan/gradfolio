import { describe, expect, it } from "vitest";
import { isNonEmpty, isValidEmail } from "./validation";

describe("isNonEmpty", () => {
  it.each([null, undefined, "", "   ", "\t\n"])("rejects %j", (v) => {
    expect(isNonEmpty(v)).toBe(false);
  });

  it.each(["a", "  a  "])("accepts %j", (v) => {
    expect(isNonEmpty(v)).toBe(true);
  });
});

describe("isValidEmail", () => {
  it.each(["student@npua.am", "  first.last@uni.edu  ", "a+tag@mail.co.uk"])("accepts %j", (v) => {
    expect(isValidEmail(v)).toBe(true);
  });

  it.each([
    null,
    undefined,
    "",
    "student.npua.am",
    "student@npua",
    "student@npua.a",
    "stu dent@npua.am",
    "@npua.am",
    "student@.am",
  ])("rejects %j", (v) => {
    expect(isValidEmail(v)).toBe(false);
  });
});
