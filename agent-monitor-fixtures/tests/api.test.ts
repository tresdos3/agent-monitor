import { describe, expect, it } from "vitest"
import { getUser } from "../src/api.js"

describe("fake api", () => {
  it("finds a known user", () => {
    expect(getUser("1")?.name).toBe("Ada")
  })

  it("returns undefined for an unknown user", () => {
    expect(getUser("missing")).toBeUndefined()
  })
})
