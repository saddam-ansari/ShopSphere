const adminMiddleware = (req, res, next) => {
    const role = req.user?.role;

    if (typeof role !== "string" || role.toUpperCase() !== "ADMIN") {
        return res.status(403).json({
            success: false,
            message: "Admin access required",
        });
    }

    next();
};

export default adminMiddleware;