const express = require("express")
const router = express.Router()

const catatanBimbingan = require("./catatan_bimbingan.routes")
router.use("/antrean/:idAntrian/catatan", catatanBimbingan)

const autentikasi = require("./autentikasi.routes")
router.use("/auth", autentikasi)

module.exports = router