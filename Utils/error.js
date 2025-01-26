export const errorHandler = (statusCode, message) => {
    const error = new Error(); // Use the built-in Error constructor
    error.statusCode = statusCode;
    error.message = message;
    return error;
};
