const express = require("express")
const router = express.Router()

const AuthController = require("../controllers/autentikasi.controller")
const otorisasi = require("../middlewares/otorisasi.middleware")

router.post(
    '/login',
    AuthController.login
)

router.post(
    '/register',
    AuthController.register
)

module.exports = router