// tests/controllers/shop.test.js
const shopController = require("../../controllers/shop");
const Product = require("../../models/product");

describe("Shop Controller - getIndex (Stub Tests)", () => {
    let originalFindAll;

    beforeEach(() => {
        // Save the original method to restore later
        originalFindAll = Product.findAll;
    });

    afterEach(() => {
        // Restore the original implementation to avoid affecting other tests
        Product.findAll = originalFindAll;
    });

    // ==========================================
    // 1. HAPPY PATH
    // ==========================================
    describe("Happy Path", () => {
        it("should render 'shop/index' with products and hasProducts: true when products exist", async () => {
            // ARRANGE: Canned data (Stub response)
            const stubProducts = [
                { id: 1, title: "Book A", price: 19.99 },
                { id: 2, title: "Book B", price: 29.99 },
            ];

            // STUB: Directly overwrite method with canned resolved promise
            Product.findAll = () => Promise.resolve(stubProducts);

            let renderedTemplate = "";
            let renderedData = {};

            const req = {};
            const res = {
                render: (template, data) => {
                    renderedTemplate = template;
                    renderedData = data;
                },
            };
            const next = () => {};

            // ACT
            await shopController.getIndex(req, res, next);

            // ASSERT: Verify state & output
            expect(renderedTemplate).toBe("shop/index");
            expect(renderedData).toEqual({
                prods: stubProducts,
                pageTitle: "Shop",
                path: "/",
                hasProducts: true,
            });
        });
    });

    // ==========================================
    // 2. EDGE PATH (Empty Array / No Products)
    // ==========================================
    describe("Edge Path", () => {
        it("should render 'shop/index' with empty array and hasProducts: false when database is empty", async () => {
            // ARRANGE: Canned empty data
            const stubProducts = [];

            // STUB: Returns resolved promise with empty array
            Product.findAll = () => Promise.resolve(stubProducts);

            let renderedTemplate = "";
            let renderedData = {};

            const req = {};
            const res = {
                render: (template, data) => {
                    renderedTemplate = template;
                    renderedData = data;
                },
            };
            const next = () => {};

            // ACT
            await shopController.getIndex(req, res, next);

            // ASSERT: Verify state handles 0 records correctly
            expect(renderedTemplate).toBe("shop/index");
            expect(renderedData).toEqual({
                prods: [],
                pageTitle: "Shop",
                path: "/",
                hasProducts: false, // Length 0 evaluates to false
            });
        });
    });

    // ==========================================
    // 3. ERROR / FAILURE PATH
    // ==========================================
    describe("Error Path", () => {
        it("should catch rejection, log error, and not invoke render when database fails", async () => {
            // ARRANGE: Canned error state
            const stubError = new Error("Database query failed");

            // STUB: Directly overwrite method with canned rejected promise
            Product.findAll = () => Promise.reject(stubError);

            let loggedMessage = "";
            let loggedError = null;
            let isRenderCalled = false;

            // Save original console.log to avoid stdout pollution
            const originalConsoleLog = console.log;
            console.log = (message, err) => {
                loggedMessage = message;
                loggedError = err;
            };

            const req = {};
            const res = {
                render: () => {
                    isRenderCalled = true;
                },
            };
            const next = () => {};

            // ACT
            shopController.getIndex(req, res, next);

            // WAIT: Let un-returned promise .catch block execute on the event loop
            await new Promise((resolve) => process.nextTick(resolve));

            // ASSERT: Verify error state variables
            expect(loggedMessage).toBe("In shop controller, fetchAll: {}");
            expect(loggedError).toBe(stubError);
            expect(isRenderCalled).toBe(false);

            // Restore console.log
            console.log = originalConsoleLog;
        });
    });
});
