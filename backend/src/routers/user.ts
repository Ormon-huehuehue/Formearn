import { Router } from "express";
import jwt from "jsonwebtoken"
import {PrismaClient} from "@prisma/client";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { jwtSecret } from "..";
import { authMiddleware } from "../middleware";
import { createTaskInput } from "../types";

const router = Router();

const prisma  = new PrismaClient();

const s3Client = new S3Client({
    credentials : {
        accessKeyId : "AKIA2FJYCJFQMUWAFO4X",
        secretAccessKey : "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"
    },
    region : "eu-north-1"
})



router.post("/task", authMiddleware, async (req,res)=>{

    const body = req.body;
    
    const parseData = createTaskInput.safeParse(body);

    if(!parseData.success){
            res.status(411).json({
            error : "Invalid input"
        })
    }


})


router.get("/presignedurl",authMiddleware, async (req, res)=>{
    // @ts-ignore
    const userId = req.userId;
    
    const command = new PutObjectCommand({
        Bucket : "formearn", 
        Key : `Formearn/${userId}/${Math.random()}/image.jpg`,
        ContentType : "image/jpeg"
    })

    const presignedUrl = await getSignedUrl(s3Client, command, {
        expiresIn : 3600
    })

    res.json({
        presignedUrl : presignedUrl
    })
    
})

//signin with wallet
//signing a message
router.post("/signin",async  (req,res)=>{
    console.log("Signin request received")
    //TODO : Add sign verification logic here
    const hardCodedWalletAddress = "FXHfqca1fKpFKB5bcNKGAznLqWo1RR2MTtnVcQnLSrEn"

    const existingUser =  await prisma.user.findFirst({
        where : {
            address : hardCodedWalletAddress
        }
    })

    if(existingUser){
        const token = jwt.sign({
            userId  : existingUser.id
        }, jwtSecret)

        res.json({token})
    }
    else{
        const user = await prisma.user.create({
            data : {
                address : hardCodedWalletAddress
            }
        })    
        
        const token = jwt.sign({
            userId : user.id
        }, jwtSecret)

        res.json({token})
    }

});

export default router;