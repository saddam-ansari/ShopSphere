
export const serviceAuth = (req, res, next) => {
    const expectedSecret = process.env.SERVICE_SECRET;
    const providedSecret = req.headers["x-service-secret"];

    if (!expectedSecret) {
        return res.status(500).json({
            success: false,
            message: "Service authentication is not configured"
        });
    }

    if (
        typeof providedSecret !== "string" ||
        providedSecret !== expectedSecret
    ) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized service request"
        });
    }

    next();
};
