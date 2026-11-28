const express = require("express");
const router = express.Router();

const AuthController = require("../controllers/autentikasi.controller");
const { autentikasi } = require("../middlewares/otorisasi.middleware");

router.post(
    '/login',
    AuthController.login
);

router.post(
    '/register',
    AuthController.register
);

router.post(
    '/logout',
    (req, res, next) => {
        const authHeader = req.get('authorization');
        if (authHeader) {
            return autentikasi(req, res, (err) => {
                if (err) {
                    // Jika token invalid/expired saat logout, tetap izinkan proses logout selesai
                    return AuthController.logout(req, res, next);
                }
                return AuthController.logout(req, res, next);
            });
        }
        return AuthController.logout(req, res, next);
    }
);

module.exports = router;
