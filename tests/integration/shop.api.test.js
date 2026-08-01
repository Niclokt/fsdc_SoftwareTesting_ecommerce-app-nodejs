// tests/integration/shop.api.test.js
const request = require("supertest");
const app = require("../../app"); // 1. Real models load safely in app.js
const Product = require("../../models/product");

describe("GET /shop/product-list API Test", () => {
    it("should return 200 OK with products", async () => {
        // 2. Spy on Product.findAll without replacing the whole model class
        const spy = jest
            .spyOn(Product, "findAll")
            .mockResolvedValue([
                { id: 1, title: "Node.js Guide", price: 19.99 },
            ]);

        const response = await request(app)
            .get("/shop/product-list")
            .expect(200);

        expect(response.text).toContain("Node.js Guide");
        spy.mockRestore(); // 3. Clean up spy
    });
});
