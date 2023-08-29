

const errorMiddleware = (err, req, res, next) => {

    err.statusCode = err.statusCode || 500;
    err.message = err.message || "Something went wrong";


    return res.status(400).json({
        success: false,
        message : err.message,
        stack: err.stack
    })
}

export default errorMiddleware;
