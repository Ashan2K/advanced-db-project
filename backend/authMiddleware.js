
const jwt = require('jsonwebtoken');


const JWT_SECRET = 'jwt_secret_key';

const checkAuth = (req, res, next) => {

    const authHeader = req.header('Authorization');

    
    if (!authHeader) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    
    const tokenParts = authHeader.split(' ');
    if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
        return res.status(401).json({ error: 'Invalid token format. Use "Bearer <token>".' });
    }

    const token = tokenParts[1];

    try {
        
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded.user;
        next();

    } catch (err) {
        
        res.status(401).json({ error: 'Invalid token.' });
    }
};


const checkRole = (allowedRoles) => {
    return (req, res, next) => {
      
        if (!req.user || !req.user.role) {
            return res.status(403).json({ error: 'Forbidden. No user role identified.' });
        }

        
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ 
                error: `Forbidden. Role '${req.user.role}' is not authorized.` 
            });
        }
        
        
        next();
    };
};


module.exports = {
    checkAuth,
    checkRole
};