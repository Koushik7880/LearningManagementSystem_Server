require("dotenv").config();
import { Response } from "express";
import { IUser } from "../models/user.model";
// import { redis } from "./redis";

interface ITokenOptions {
    expires: Date;
    maxAge: number;
    httpOnly: boolean;
    sameSite: 'lax' | 'strict' | 'none' | undefined;
    secure?: boolean;
}

export const sendToken = (user: IUser, statusCode: number, res:Response) => {

    const accessToken = user.SignAccessToken();
    const refreshToken = user.SignRefreshToken();

    // upload session to redis


    //  parse environment variable to integrates with fallback values

    // const accessTokenExpires = parseInt(process.removeListener.ACCESS_TOKEN_EXPIRE || '300', 10)

    
}