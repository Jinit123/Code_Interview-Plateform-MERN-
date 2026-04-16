const checkRole = (...allowedRole) => {
    return (req, res, next) => {

        const userRole = req.user.role;
        console.log("User Role:", userRole);

        if (!allowedRole.includes(userRole)) {
            return res.status(403).json({
                message: "Access Denied",
            });
        }
        next();
    }
}

module.exports = checkRole; 