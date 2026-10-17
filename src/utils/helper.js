import jwt from 'jsonwebtoken';
import dotenv from 'dotenv'
dotenv.config()

// Create the one-hour JWT stored in the authenticated user's cookie.
const generateToken = (id) =>{
    return jwt.sign({
        exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour expiration
        data: id
    }, process.env.SECRET_KEY);
}

export { generateToken };
