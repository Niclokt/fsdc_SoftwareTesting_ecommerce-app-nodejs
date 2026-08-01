// tests/controllers/shop.test.js
const shopController = require("../../controllers/shop");
const Product = require("../../models/product");

// Intercept the Product model script
jest.mock("../../models/product");

describe("Shop Controller - getProducts Unit Tests", () => {
    afterEach(() => {
        // Reset mock calls between tests to avoid call-count leaks
        jest.clearAllMocks();
    });

    // ==========================================
    // 1. HAPPY PATH
    // ==========================================
    describe("Happy Path", () => {
        it("should render 'shop/product-list' with products and hasProducts set to true", async () => {
            // ARRANGE
            const dummyProducts = [
                { id: 1, title: "Mock Book 1", price: 10.0 },
                { id: 2, title: "Mock Book 2", price: 15.0 },
            ];
            Product.findAll.mockResolvedValue(dummyProducts);

            const req = {};
            const res = { render: jest.fn() };
            const next = jest.fn();

            // ACT
            await shopController.getProducts(req, res, next);

            // ASSERT
            expect(Product.findAll).toHaveBeenCalledTimes(1);
            expect(res.render).toHaveBeenCalledWith("shop/product-list", {
                prods: dummyProducts,
                pageTitle: "Products List",
                path: "/shop/product-list",
                hasProducts: true, // Evaluates products.length > 0
            });
        });
    });

    // ==========================================
    // 2. EDGE PATH (Empty Catalog)
    // ==========================================
    describe("Edge Path", () => {
        it("should handle an empty product list gracefully with hasProducts set to false", async () => {
            // ARRANGE: Query succeeds, but returns 0 records
            const emptyProducts = [];
            Product.findAll.mockResolvedValue(emptyProducts);

            const req = {};
            const res = { render: jest.fn() };
            const next = jest.fn();

            // ACT
            await shopController.getProducts(req, res, next);

            // ASSERT
            expect(Product.findAll).toHaveBeenCalledTimes(1);
            expect(res.render).toHaveBeenCalledWith("shop/product-list", {
                prods: [],
                pageTitle: "Products List",
                path: "/shop/product-list",
                hasProducts: false, // Correctly evaluates empty array length
            });
        });
    });

    // ==========================================
    // 3. ERROR / FAILURE PATH
    // ==========================================
    describe("Error Path", () => {
        it("should catch database rejection and log error without throwing", async () => {
            // ARRANGE
            const dbError = new Error("Database connection dropped");
            Product.findAll.mockRejectedValue(dbError);

            const spyConsoleLog = jest
                .spyOn(console, "log")
                .mockImplementation(() => {});

            const req = {};
            const res = { render: jest.fn() };
            const next = jest.fn();

            // ACT
            shopController.getProducts(req, res, next);

            // WAIT: Clean tick promise resolution
            await new Promise((resolve) => process.nextTick(resolve));

            // ASSERT
            expect(spyConsoleLog).toHaveBeenCalledWith(
                "In shop controller, fetchAll: {}",
                dbError,
            );
            expect(res.render).not.toHaveBeenCalled();

            spyConsoleLog.mockRestore(); // Clean up spy
        });
    });
});
