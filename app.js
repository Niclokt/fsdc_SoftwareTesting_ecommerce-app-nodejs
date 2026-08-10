require("dotenv").config();
const path = require("path");
const fs = require("fs");

const errorController = require("./controllers/error");
const sequelize = require("./util/database");

// 1. ALL MODEL IMPORTS MUST BE HERE AT THE TOP
const Product = require("./models/product");
const User = require("./models/user");
const Cart = require("./models/cart");
const CartItem = require("./models/cart-item");
const Order = require("./models/order");
const OrderItem = require("./models/order-item");

const compression = require("compression");
const morgan = require("morgan");
const express = require("express");
const bodyParser = require("body-parser");

const app = express();

app.set("view engine", "ejs");
app.set("views", "views");

const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");

if (process.env.NODE_ENV !== "test" && process.env.NODE_ENV !== "e2e") {
    const accessLogStream = fs.createWriteStream(
        path.join(__dirname, "access.log"),
        { flags: "a" },
    );
    app.use(morgan("combined", { stream: accessLogStream }));
}

app.use(compression());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

// Attach default user middleware
app.use((req, res, next) => {
    User.findByPk(1)
        .then((user) => {
            req.user = user || { id: 1, name: "Test User" };
            next();
        })
        .catch((error) => {
            console.log("Error in App.js during user retrieval:", error);
            next();
        });
});

app.use("/admin", adminRoutes);
app.use(shopRoutes);
app.use(errorController.get404);

// 2. DATABASE ASSOCIATIONS (Placed AFTER models are required)
Product.belongsTo(User, { constraints: true, onDelete: "CASCADE" });
User.hasMany(Product);

User.hasOne(Cart);
Cart.belongsTo(User);

Cart.belongsToMany(Product, { through: CartItem });
Product.belongsToMany(Cart, { through: CartItem });

Order.belongsTo(User);
User.hasMany(Order);
Order.belongsToMany(Product, { through: OrderItem });

// 3. SERVER INITIALIZATION & SYNC
if (process.env.NODE_ENV !== "test") {
    const isE2E = process.env.NODE_ENV === "e2e";

    sequelize
        .sync({ force: isE2E })
        .then(() => User.findByPk(1))
        .then(async (user) => {
            if (!user) {
                user = await User.create({
                    name: "Lahiru",
                    email: "lahirurc1st@gmail.com",
                });
            }
            return user;
        })
        .then(async (user) => {
            const cart = await user.getCart();
            if (!cart) {
                await user.createCart();
            }

            if (isE2E) {
                const count = await Product.count();
                if (count === 0) {
                    await Product.create({
                        title: "Mock Book 1",
                        price: 10.0,
                        imageUrl: "https://via.placeholder.com/150",
                        description: "Test Description",
                        userId: user.id,
                    });
                }
            }
        })
        .then(() => {
            const PORT = process.env.PORT || 5001;
            app.listen(PORT, () => {
                console.log(`\n========================================`);
                console.log(`Server is running on http://localhost:${PORT}`);
                console.log(
                    `Environment: ${process.env.NODE_ENV || "development"}`,
                );
                console.log(`========================================\n`);
            });
        })
        .catch((error) => console.log("APP startup error:", error));
}

module.exports = app;
