const express = require("express")
const router = express.Router()

const catatanBimbingan = require("./catatan_bimbingan.routes")
router.use("/antrean/:idAntrian/catatan", catatanBimbingan)

const autentikasi = require("./autentikasi.routes")
router.use("/auth", autentikasi)

router.use("/jadwal", require("./jadwal.routes"))
router.use("/notifikasi", require("./notifikasi.routes"))
router.use("/antrean", require("./antrean.routes"))

module.exports = router