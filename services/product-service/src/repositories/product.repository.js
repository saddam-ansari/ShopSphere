import pool from "../config/database.js";

export const createProduct = async ({ name, description, price, stock, category }) => {
    const result = await pool.query(
        `INSERT INTO products
        (name, description, price, stock, category)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, name, description, price, stock, category, created_at`,
        [name, description, price, stock, category]
    );

    return result.rows[0];
};

export const getAllProducts = async () => {
    const result = await pool.query(
        `SELECT id, name, description, price, stock, category, created_at
        FROM products
        ORDER BY id DESC`
    );
    return result.rows;
};

export const findProductById = async (id) => {
    const result = await pool.query(
        `SELECT id, name, description, price, stock, category, created_at
        FROM products WHERE id = $1`,
        [id]
    )
    return result.rows[0];
};

export const updateProduct = async (id, { name, description, price, stock, category }) => {
    const result = await pool.query(
        `UPDATE products
        SET
            name = $1,
            description = $2,
            price = $3,
            stock = $4,
            category = $5,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $6
        RETURNING id, name, description, price, stock, category, updated_at`,
        [name, description, price, stock, category, id]
    );
    return result.rows[0];
};

export const deleteProduct = async (id) => {
    const result = await pool.query(
        `DELETE FROM products
        WHERE id = $1
        RETURNING id`,
        [id]
    );
    return result.rows[0];
}

export const decreaseProductStock = async (productId, quantity) => {
    const result = await pool.query(
        `UPDATE products
     SET stock = stock - $1,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $2
       AND stock >= $1
     RETURNING id, name, stock`,
        [quantity, productId]
    );

    return result.rows[0];
};


export const increaseProductStock = async (productId, quantity) => {
    const result = await pool.query(
        `UPDATE products
         SET stock = stock + $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING id, name, stock`,
        [quantity, productId]
    );

    return result.rows[0];
};
