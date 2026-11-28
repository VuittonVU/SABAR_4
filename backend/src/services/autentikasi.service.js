const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("../configs/config");
const { query } = require("../configs/database");
const ApiError = require("../utils/apiError");

const loginService = async ({ nim, username, password }) => {
    const identitas = String(nim ?? username ?? '').trim();
    const passwordUser = String(password ?? '');

    if (!identitas || !passwordUser) {
        throw ApiError.badRequest('NIM/NIP dan kata sandi wajib diisi.');
    }

    const { rows } = await query(`
        SELECT p.id_pengguna, p.id_role, p.status_aktif, r.nama AS role, p.username, p.kata_sandi_hash, p.nama, p.email_npm
        FROM pengguna p
        LEFT JOIN data_referensi r ON r.id_referensi = p.id_role
        WHERE p.username = $1;
    `, [identitas]);

    const user = rows[0];
    if (!user || !user.status_aktif) {
        throw ApiError.unauthorized('NIM/NIP atau kata sandi tidak valid.');
    }

    const isMatch = await bcrypt.compare(passwordUser, user.kata_sandi_hash);
    if (!isMatch) {
        throw ApiError.unauthorized('NIM/NIP atau kata sandi tidak valid.');
    }

    const token = jwt.sign(
        {
            sub: String(user.id_pengguna),
            role: user.role,
        },
        config.jwt.secret,
        {
            expiresIn: config.jwt.expire || '24h',
            algorithm: 'HS256',
        }
    );

    return {
        token,
        user: {
            id_pengguna: user.id_pengguna,
            id_role: user.id_role,
            role: user.role,
            username: user.username,
            nama: user.nama,
            email_npm: user.email_npm,
        }
    };
};

const registerService = async ({ id_role, nama, nim, username, email, password }) => {
    const identitas = String(nim ?? username ?? '').trim();
    const namaUser = String(nama ?? '').trim();
    const emailUser = String(email ?? '').trim().toLowerCase();
    const passwordUser = String(password ?? '');

    if (!identitas || !namaUser || !emailUser || !passwordUser) {
        throw ApiError.badRequest('Semua data pendaftaran wajib diisi.');
    }

    if (!id_role) {
        throw ApiError.badRequest('Role pengguna wajib dipilih.');
    }

    const existing = await query(
        `SELECT username, email_npm FROM pengguna WHERE username = $1 OR email_npm = $2;`,
        [identitas, emailUser]
    );

    if (existing.rows.length > 0) {
        if (existing.rows.some((r) => r.username === identitas)) {
            throw ApiError.conflict('NIM/NIP sudah didaftarkan.');
        }
        if (existing.rows.some((r) => r.email_npm === emailUser)) {
            throw ApiError.conflict('Email sudah didaftarkan.');
        }
    }

    const hash_password = await bcrypt.hash(passwordUser, 10);

    const insertQuery = `
        INSERT INTO pengguna 
            (id_role, username, kata_sandi_hash, nama, email_npm)
        VALUES
            ($1, $2, $3, $4, $5)
        RETURNING id_pengguna, id_role, username, nama, email_npm, created_at;
    `;

    const values = [id_role, identitas, hash_password, namaUser, emailUser];
    const result = await query(insertQuery, values);
    return result.rows[0];
};

module.exports = {
    loginService,
    registerService,
};
