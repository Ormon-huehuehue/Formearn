import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken"
import { jwtSecret } from ".";

export function authMiddleware(req : Request, res : Response, next : NextFunction){
    const authHeader =  req.headers["authorization"] ?? "";

    console.log("auth middleware called ")

    try{
        const decoded = jwt.verify(authHeader, jwtSecret)
        console.log("jwt verified : ", decoded)

        // @ts-ignore
        if(decoded.userId){
            // @ts-ignore
            console.log("decoded user : ", decoded.userId)
            // @ts-ignore
            req.userId = decoded.userId;
            // @ts-ignore
            console.log("req.userId : ", req.userId)
            return next();  
        }
        else{
            res.status(403).json({
                message : "You're not logged in"
            })
        }
    }
    catch(e){
        res.status(403).json({
            message : "You are not logged in"
        })
    }
}