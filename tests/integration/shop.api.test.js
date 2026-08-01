// tests/integration/shop.api.test.js
const request = require("supertest");
const app = require("../../app");
const Product = require("../../models/product");
const sequelize = require("../../util/database");

describe("Shop API / Integration Tests", () => {
    let findAllSpy;

    // FIX #1: Create SQLite tables in memory before running tests
    beforeAll(async () => {
        await sequelize.sync({ force: true });
    });

    // FIX #2: Close SQLite database connection after all tests finish
    afterAll(async () => {
        await sequelize.close();
    });

    afterEach(() => {
        if (findAllSpy) {
            findAllSpy.mockRestore();
        }
    });

    it("should respond with 200 OK and render product list HTML", async () => {
        // ARRANGE
        const mockProducts = [
            { id: 1, title: "Node.js Complete Guide", price: 19.99 },
        ];

        findAllSpy = jest
            .spyOn(Product, "findAll")
            .mockResolvedValue(mockProducts);

        // ACT & ASSERT
        // FIX #3: Update the endpoint path string to match your exact route in routes/shop.js.
        // If routes/shop.js defines `router.get('/products', ...)` or `router.get('/products-list', ...)`,
        // update the string below accordingly:
        const response = await request(app)
            .get("/product-list") // <-- Ensure this matches the string in routes/shop.js (e.g. '/products' or '/product-list')
            .expect("Content-Type", /html/)
            .expect(200); // FIX #4: Now returns status 200 OK because the endpoint path matches

        expect(response.text).toContain("Node.js Complete Guide");
        expect(findAllSpy).toHaveBeenCalledTimes(1);
    });
});
