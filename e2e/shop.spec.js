import { test, expect } from "@playwright/test";
// NOTE: written but NOT executed in the build environment (no browser available there). Run locally against the seeded stack.
const pw = "S3cure-pass!x9";
async function register(page, prefix) {
  await page.goto("/login");
  await page.getByText("Need an account?").click();
  await page.getByPlaceholder("Email").fill(`${prefix}${Date.now()}@example.com`);
  await page.getByPlaceholder("Password").fill(pw);
  await page.getByRole("button", { name: "Register" }).click();
  await expect(page.getByRole("heading", { name: "Discover Our New Collection" })).toBeVisible();
}

test("browse the shop, open a product, add to cart via the drawer, ask the assistant", async ({ page }) => {
  await register(page, "e2e");
  await page.getByRole("link", { name: "Shop", exact: true }).first().click();
  await expect(page.getByText(/Showing 1–\d+ of \d+ results/)).toBeVisible();
  await page.getByRole("link", { name: "Wooden Train Set" }).first().click();
  await page.getByRole("button", { name: "Add To Cart" }).click();
  await expect(page.getByRole("dialog", { name: "Shopping cart" })).toContainText("Wooden Train Set");
  await page.getByRole("button", { name: "Close cart" }).click();
  await page.getByLabel("Open assistant").click();
  await page.getByLabel("Message").fill("What is the return policy?");
  await page.getByLabel("Send").click();
  await expect(page.getByText(/Sources: Return/)).toBeVisible();
});

test("checkout validates the form and reports a missing payment gateway instead of faking payment", async ({ page }) => {
  await register(page, "pay");
  await page.goto("/shop");
  await page.getByRole("link", { name: "Wooden Train Set" }).first().click();
  await page.getByRole("button", { name: "Add To Cart" }).click();
  await page.goto("/checkout");
  await page.getByRole("button", { name: "Place order" }).click();
  await expect(page.getByText("Enter a 6-digit PIN code")).toBeVisible();
  for (const [label, v] of Object.entries({ "First Name": "Asha", "Last Name": "Rao", "Street address": "1 MG Road", "Town / City": "Pune", State: "Maharashtra", "PIN code": "411001", Phone: "9876543210" }))
    await page.getByLabel(label, { exact: true }).fill(v);
  await page.getByRole("button", { name: "Place order" }).click();
  await expect(page.getByRole("alert")).toContainText(/saved|gateway/i);  // no keys configured: never a fake success
});

test("contact form and newsletter", async ({ page }) => {
  await page.goto("/contact");
  await page.getByLabel("Your name").fill("Asha");
  await page.getByLabel("Email address").fill("asha@example.com");
  await page.getByLabel("Message").fill("Do you deliver to Pune?");
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByRole("status")).toContainText("Thanks");
});
