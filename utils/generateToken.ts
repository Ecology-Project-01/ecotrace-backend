/**
 * Token Generation Utility
 * Helper function to generate JWT tokens for users.
 * Includes: generateToken function utilizing jsonwebtoken.
 */
const jwt = require('jsonwebtoken');
import User, { IUser } from '../models/User';

export const generateToken = (user: IUser) => {
    return jwt.sign(
        {
            userId: user._id,
            role: user.role,
            org: user.org
        },
        process.env.JWT_SECRET as string,
        { expiresIn: "15m" }
    );
}