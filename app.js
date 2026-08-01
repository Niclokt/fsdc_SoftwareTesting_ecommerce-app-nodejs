require("dotenv").config();
const path = require("path");
const fs = require("fs");

const errorController = require("./controllers/error");
const sequelize = require("./util/database");
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

// FIX #1: Only create log file stream during regular execution, not during automated tests
if (process.env.NODE_ENV !== "test") {
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
            // FIX #1: Fallback mock user if SQLite DB has no records yet
            req.user = user || { id: 1, name: "Test User" };
            next();
        })
        .catch((error) => {
            console.log("Error in App.js during user retrieval:", error);
            // FIX #2: Call next() so requests don't hang on DB error
            next();
        });
});

app.use("/admin", adminRoutes);
app.use(shopRoutes);
app.use(errorController.get404);

// Database Associations
Product.belongsTo(User, { constraints: true, onDelete: "CASCADE" });
User.hasMany(Product);

User.hasOne(Cart);
Cart.belongsTo(User);

Cart.belongsToMany(Product, { through: CartItem });
Product.belongsToMany(Cart, { through: CartItem });

Order.belongsTo(User);
User.hasMany(Order);
Order.belongsToMany(Product, { through: OrderItem });

// FIX #3: CRITICAL FOR SUPERTEST / JEST
// Only bind port 5000 and run DB sync when NOT running automated tests.
// Supertest handles its own internal server lifecycle—calling app.listen() in tests causes EADDRINUSE errors.
if (process.env.NODE_ENV !== "test") {
    sequelize
        .sync()
        .then(() => User.findByPk(1))
        .then((user) => {
            if (!user) {
                return User.create({
                    name: "Lahiru",
                    email: "lahirurc1st@gmail.com",
                });
            }
            return user;
        })
        .then((user) => {
            // FIX #4: Check if cart exists first before creating one to prevent duplicate cart constraint errors
            return user
                .getCart()
                .then((cart) => (cart ? cart : user.createCart()));
        })
        .then(() => {
            const PORT = process.env.PORT || 5000;
            app.listen(PORT, () => {
                console.log(`Server is running on port ${PORT}`);
            });
        })
        .catch((error) => console.log("APP startup error:", error));
}

module.exports = app;
