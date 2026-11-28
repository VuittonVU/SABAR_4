const AuthService = require('../services/autentikasi.service');
const { sendSuccess } = require('../utils/apiResponse');

const login = async (req, res, next) => {
    try {
        const result = await AuthService.loginService(req.body);
        return sendSuccess(res, 'Login berhasil.', result, 200);
    } catch (error) {
        next(error);
    }
};

const register = async (req, res, next) => {
    try {
        const result = await AuthService.registerService(req.body);
        return sendSuccess(res, 'Pendaftaran akun berhasil.', result, 201);
    } catch (error) {
        next(error);
    }
};

const logout = async (req, res, next) => {
    try {
        const idPengguna = res.locals.idPengguna;
        await AuthService.logoutService(idPengguna, req.ip);
        return sendSuccess(res, 'Logout berhasil.', null, 200);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    login,
    register,
    logout,
};
