import jwt from 'jsonwebtoken';

const secretKey = process.env.JWT_SECRET || 'your-secret-key';

export const generateToken = (payload: object): string => {
    return jwt.sign(payload, secretKey, { expiresIn: '1h' });
};

export const verifyToken = (token: string): object | string => {
    try {
        return jwt.verify(token, secretKey);
    } catch (error) {
        throw new Error('Invalid token');
    }
};