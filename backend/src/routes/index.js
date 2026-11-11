const express = require("express");
const router = express.Router();

const catatanBimbingan = require("./catatan-bimbingan");
router.use("/antrean/:idAntrian/catatan", catatanBimbingan);

module.exports = router;