// tests/controllers/shop.test.js
const shopController = require("../../controllers/shop");
const Product = require("../../models/product");

describe("Shop Controller - getIndex (Spy Tests)", () => {
    let findAllSpy;

    afterEach(() => {
        // Restore the original method after every test to prevent test pollution
        if (findAllSpy) {
            findAllSpy.mockRestore();
        }
        jest.clearAllMocks();
    });

    // ==========================================
    // 1. HAPPY PATH
    // ==========================================
    describe("Happy Path", () => {
        it("should spy on Product.findAll and render 'shop/index' with products", async () => {
            // ARRANGE
            const mockProducts = [
                { id: 1, title: "Book A", price: 19.99 },
                { id: 2, title: "Book B", price: 29.99 },
            ];

            findAllSpy = jest
                .spyOn(Product, "findAll")
                .mockResolvedValue(mockProducts);

            const req = {};
            const res = { render: jest.fn() };
            const next = jest.fn();

            // ACT
            await shopController.getIndex(req, res, next);

            // ASSERT
            expect(findAllSpy).toHaveBeenCalledTimes(1);
            expect(res.render).toHaveBeenCalledWith("shop/index", {
                prods: mockProducts,
                pageTitle: "Shop",
                path: "/",
                hasProducts: true,
            });
        });
    });

    // ==========================================
    // 2. EDGE PATH (Empty Product Array)
    // ==========================================
    describe("Edge Path", () => {
        it("should spy on Product.findAll and render 'shop/index' with empty prods and hasProducts: false", async () => {
            // ARRANGE: Query succeeds, but database has 0 products
            const emptyProducts = [];

            findAllSpy = jest
                .spyOn(Product, "findAll")
                .mockResolvedValue(emptyProducts);

            const req = {};
            const res = { render: jest.fn() };
            const next = jest.fn();

            // ACT
            await shopController.getIndex(req, res, next);

            // ASSERT
            expect(findAllSpy).toHaveBeenCalledTimes(1);
            expect(res.render).toHaveBeenCalledWith("shop/index", {
                prods: [],
                pageTitle: "Shop",
                path: "/",
                hasProducts: false, // Correctly evaluates empty array length
            });
        });
    });

    // ==========================================
    // 3. ERROR / FAILURE PATH
    // ==========================================
    describe("Error Path", () => {
        it("should spy on Product.findAll rejection, log the error, and skip res.render", async () => {
            // ARRANGE: Simulate database query rejection
            const dbError = new Error("Database query failed");

            findAllSpy = jest
                .spyOn(Product, "findAll")
                .mockRejectedValue(dbError);

            const spyConsoleLog = jest
                .spyOn(console, "log")
                .mockImplementation(() => {});

            const req = {};
            const res = { render: jest.fn() };
            const next = jest.fn();

            // ACT
            shopController.getIndex(req, res, next);

            // WAIT: Wait for the un-returned promise .catch block to process on the event loop
            await new Promise((resolve) => process.nextTick(resolve));

            // ASSERT
            expect(findAllSpy).toHaveBeenCalledTimes(1);
            expect(spyConsoleLog).toHaveBeenCalledWith(
                "In shop controller, fetchAll: {}",
                dbError,
            );
            expect(res.render).not.toHaveBeenCalled();

            spyConsoleLog.mockRestore(); // Clean up console spy
        });
    });
});
