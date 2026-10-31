import pg from "pg";

const { Pool } = pg;

let pool;

export const getNotificationDB = () => {
    if (!pool) {
        pool = new Pool({
            connectionString: process.env.NOTIFICATION_DATABASE_URL,
        });

        pool.on("error", (error) => {
            console.error(
                "Unexpected Notification Database error:",
                error.message
            );
        });
    }

    return pool;
};

export const verifyNotificationDBConnection = async () => {
    try {
        const db = getNotificationDB();

        const result = await db.query("SELECT NOW()");

        console.log(
            "Notification Database connected successfully:",
            result.rows[0].now
        );

        return true;
    } catch (error) {
        console.error(
            "Notification Database connection failed:",
            error.message
        );

        throw error;
    }
};