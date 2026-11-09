import { describe, expect, it } from "vitest";
import { errMsg } from "./api";
describe("errMsg", () => {
  it("handles network errors", () => expect(errMsg({})).toMatch(/Network error/));
  it("reads detail", () => expect(errMsg({ response: { data: { detail: "No" } } })).toBe("No"));
  it("flattens field errors", () => expect(errMsg({ response: { data: { errors: { email: ["bad"] } } } })).toBe("bad"));
});
