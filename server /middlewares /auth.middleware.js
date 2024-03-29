import AppError from "../utils/error.util.js";
import jwt from 'jsonwebtoken';

const isLoggedIn = async (req, res, next) => {
    const { token } = req.cookies;

    if (!token) {
        return next(new AppError('Unauthenticated, please login again', 401));
    }

    const userDetails = await jwt.verify(token, process.env.JWT_SECRET);

    req.user = userDetails; // all user related details enlisted in generatejwttoken
    // func in user.model.js were stored in an object,
    // now this obj is getting stored in req.user  -> req.user

    next();
}

const authorizedRoles = (...roles) => async (req, res, next) => {
    // JWT.sign( // all user info gets stored in an object
    // {id: this._id, email: this.email, courseSubscribed: this.courseSubscribed, role: this.role},
    // process.env.JWT_SECRET,
    const currentUserRole = req.user.role;
    if (!roles.includes(currentUserRole)) {
        return next(
            new AppError('You do not have permission to access this route', 403)
        )
    }
    next();
}

const authorizeSubscriber = async(req, res, next) => {
    const subsciption = req.user.subsciption;
    const currentUserRole = req.user.role;
    if (currentUserRole !== 'ADMIN' && subsciption.status !== 'active') {
        return next(
            new AppError('Please subscribce to access this route!', 403)
        )
    }

    next();
}

export {
    isLoggedIn,
    authorizedRoles,
    authorizeSubscriber
}
