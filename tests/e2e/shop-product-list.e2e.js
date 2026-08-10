const { Builder, By, until } = require("selenium-webdriver");
const assert = require("assert");

// Port defaults to 5000 based on app.js (process.env.PORT || 5001)
const PORT = process.env.PORT || 5001;
const BASE_URL = `http://localhost:${PORT}/product-list`;

(async function runShopProductListE2ETest() {
    // 1. Initialize Chrome Browser instance
    let driver = await new Builder().forBrowser("chrome").build();

    try {
        console.log(`[INFO] Navigating to: ${BASE_URL}`);
        await driver.get(BASE_URL);

        // 2. Verify Page Title (<title><%= pageTitle %></title> from head.ejs)
        const actualTitle = await driver.getTitle();
        console.log(`[INFO] Document Title: "${actualTitle}"`);
        assert.ok(actualTitle.length > 0, "Page title should not be empty");

        // 3. Check whether products exist or empty state is shown
        const productCards = await driver.findElements(
            By.css("article.card.product-item"),
        );

        if (productCards.length > 0) {
            // ==========================================
            // HAPPY PATH: Products are present in DOM
            // ==========================================
            console.log(
                `[PASS] Happy Path Detected: Found ${productCards.length} product(s).`,
            );

            const firstCard = productCards[0];

            // Extract Product Title (.product__title)
            const titleElement = await firstCard.findElement(
                By.css(".product__title"),
            );
            const productTitle = (await titleElement.getText()).trim();

            // Extract Product Price (.product__price)
            const priceElement = await firstCard.findElement(
                By.css(".product__price"),
            );
            const productPrice = (await priceElement.getText()).trim();

            console.log(
                `[INFO] First Product -> Title: "${productTitle}", Price: "${productPrice}"`,
            );
            assert.ok(
                productTitle.length > 0,
                "Product title should be populated",
            );
            assert.ok(
                productPrice.includes("$"),
                "Product price should format currency",
            );

            // Verify Action Elements (Details Link & Add to Cart Form)
            const detailsBtn = await firstCard.findElement(
                By.css(".card__actions a.btn"),
            );
            const addToCartBtn = await firstCard.findElement(
                By.css(".card__actions form button.btn"),
            );

            assert.strictEqual(await detailsBtn.getText(), "Details");
            assert.strictEqual(await addToCartBtn.getText(), "Add to Cart");

            console.log("[SUCCESS] Happy Path E2E Test Passed!");
        } else {
            // ==========================================
            // EDGE PATH: Catalog is empty
            // ==========================================
            console.log("[INFO] Checking for empty catalog state...");

            const mainHeader = await driver.wait(
                until.elementLocated(By.css("main h1")),
                5000,
            );
            const headerText = (await mainHeader.getText()).trim();

            assert.strictEqual(
                headerText,
                "No Products Found!",
                "Empty state message mismatch",
            );
            console.log(
                '[SUCCESS] Edge Path E2E Test Passed: "No Products Found!" verified.',
            );
        }
    } catch (error) {
        console.error("[FAIL] Test execution failed:", error.message);
        process.exitCode = 1;
    } finally {
        // 4. Teardown browser session
        await driver.quit();
        console.log("[INFO] Browser session closed.");
    }
})();
