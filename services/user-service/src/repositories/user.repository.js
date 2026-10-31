import pool from "../config/database.js";

export const findUserByEmail = async (email) => {
    const result = await pool.query(
        "SELECT id, name, email, password, role, created_at FROM users WHERE email = $1",
        [email]
    );

    return result.rows[0];
};

export const createUser = async (name, email, password) => {
    const result = await pool.query(
        `INSERT INTO users (name, email, password)
        VALUES ($1, $2, $3)
        RETURNING id, name, email, role. created_at`,
        [name, email, password]
    );
    return result.rows[0];
};

export const findUserById = async (id) => {
    const result = await pool.query(
        `SELECT id, name, email, role, created_at
        FROM users
        WHERE id=$1`,
        [id]
    );

    return result.rows[0];
}
