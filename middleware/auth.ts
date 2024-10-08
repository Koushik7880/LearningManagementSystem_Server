import { Request, Response, NextFunction } from "express";
import { CatchAsyncError } from "./catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";
import jwt, { JwtPayload } from "jsonwebtoken";
import { redis } from "../utils/redis";


// check if user is authenticated
// export const isAuthenticated = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
//     const access_token = req.cookies.access_token;

//     if(!access_token){
//         return next(new ErrorHandler("Please login to access this resource", 400));
//     }

//     const decoded = jwt.verify(access_token, process.env.ACCESS_TOKEN as string );
//     if(!decoded){
//         return next(new ErrorHandler("access token is not valid", 400));
//     }

//     const user = await redis.get((decoded as JwtPayload).id);
//     if(!user){
//         return next(new ErrorHandler("user not found", 400));
//     }

//     req.user = JSON.parse(user);
//     next();
    
// })

// // validate user role
// export const authorizeRoles = (...roles: string[]) =>{
//     return (req: Request, res: Response, next: NextFunction) => {
//         if(!roles.includes(req.user?.role || "")){
//             return next(new ErrorHandler(`Role: ${req.user?.role} is not allowed to access this resource`, 403));
//         }
//     }
// }





export const isAuthenticated = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const access_token = req.cookies.access_token;

        if (!access_token) {
            return next(new ErrorHandler("Please login to access this resource", 400));
        }

        const decoded = jwt.verify(access_token, process.env.ACCESS_TOKEN as string) as JwtPayload;
        
        const user = await redis.get(decoded.id);
        if (!user) {
            return next(new ErrorHandler("User not found", 400));
        }

        req.user = JSON.parse(user);
        next();
    } catch (error: any) {
        // Handle JWT verification errors
        return next(new ErrorHandler(error.message || "Invalid token", 400));
    }
});

export const authorizeRoles = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!roles.includes(req.user?.role || "")) {
            return next(new ErrorHandler(`Role: ${req.user?.role} is not allowed to access this resource`, 403));
        }
        next(); // Ensure next() is called to continue the request
    };
};
