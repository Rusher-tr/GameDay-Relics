import { APIError } from "../utils/Apierror.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const authorizeRoles = (...allowedRoles) => {
    return asyncHandler(async (req, res, next) => {
        if (!req.user || !req.user.role) {
            throw new APIError(403, "You are not authorized to access this resource");
        }

        if (!allowedRoles.includes(req.user.role)) {
            throw new APIError(
                403,
                `Role: ${req.user.role} is not allowed to access this resource`
            );
        }
        next();
    });
};

export { authorizeRoles };