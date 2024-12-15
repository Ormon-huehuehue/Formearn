import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken"
import { jwtSecret } from ".";
import { jwtSecretWorker } from "./routers/worker";

export function authMiddleware(req : Request, res : Response, next : NextFunction){
    const authHeader =  req.headers["authorization"] ?? "";

    console.log("auth middleware called ")

    try{
        const decoded = jwt.verify(authHeader, jwtSecret)
        console.log("jwt verified : ", decoded)

        // @ts-ignore
        if(decoded.userId){
            // @ts-ignore
            req.userId = decoded.userId;
            // @ts-ignore
            return next();  
        }
        else{
            res.status(403).json({
                message : "You're not logged in"
            })
        }
    }
    catch(e){
        console.log("failed authorization")
        res.status(403).json({
            message : "You are not logged in"
        })
    }
}

export function workerMiddleware(req : Request, res : Response, next : NextFunction){
    const authHeader =  req.headers["authorization"] ?? "";

    console.log("worker auth middleware called ")

    try{
        console.log("Trying to decode")
        const decoded = jwt.verify(authHeader, jwtSecretWorker)
        console.log("jwt verified : ", decoded)

        // @ts-ignore
        if(decoded.userId){
            // @ts-ignore
            req.userId = decoded.userId;
            console.log("logged in")
            // @ts-ignore
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