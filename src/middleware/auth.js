import jwt from 'jsonwebtoken';
import UserModel from '../models/user.model.js';

// Authenticate the request from the HTTP-only JWT cookie.
const verifyToken = async (req, res, next) => {
    try {
        const token = req.cookies?.token;
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        const user = await UserModel.findById(decoded.data ?? decoded.id).select("-password -otp -otpExpire");
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        req.user = user;
        req.userId = user._id;
        return next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired authentication"
        });
    }
};

// Restrict a route to one of the supplied normalized user roles.
const authorized= (...roles)=>{
    return (req, res, next)=>{
     const normalizeRole = (role) => role.replace(/[_\s]/g, "").toLowerCase();
     if(!req.user || !roles.some((role) => normalizeRole(role) === normalizeRole(req.user.role))){
        return res.status(401).json({
            success: false,
            message: "Authorization failed, admin token required"
        })
     }
     return next();
    }
}

export { verifyToken, authorized }
