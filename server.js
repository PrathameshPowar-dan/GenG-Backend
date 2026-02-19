"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
var express_1 = require("express");
var cors_1 = require("cors");
var app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
var port = process.env.PORT || 3000;
app.get('/', function (req, res) {
    res.send('Server is Live!');
});
app.listen(port, function () {
    console.log("Server is running at http://localhost:".concat(port));
});
