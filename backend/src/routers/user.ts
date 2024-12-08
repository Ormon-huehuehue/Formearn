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

const access_key = process.env.ACCESS_KEY_ID?? ""
const secret_key = process.env.SECRET_ACCESS_KEY?? ""

const s3Client = new S3Client({
    //@ts-ignore
    credentials : {
        accessKeyId : access_key,
        secretAccessKey : secret_key
    },
    region : "eu-north-1"
})



router.post("/task", authMiddleware, async (req,res)=>{

    const body = req.body;
    //@ts-ignore
    const userId = req.userId;

    console.log("User id is ", userId)

    
    const parseData = createTaskInput.safeParse(body);

    console.log("Parsed Data : ", parseData)

    if(!parseData.success){
            res.status(411).json({
            error : "Invalid input"
        })
    }

    //parse the signature here to ensure the person has paid the amount

    let response = await prisma.$transaction(async (tx)=>{

        const response = await tx.task.create({
            data :{
                title : parseData.data?.title?? "Choose the best thumbnail",
                amount : "1",
                signature : parseData.data?.signature?? "signature",
                user_id : userId
            }
        })

        console.log("response in response : ", response)

        try{

            await tx.option.createMany({
                data : parseData.data?.options?.map(option=>({
                    image_url : option.image_url ,
                    task_id : response.id
                })) || []
            })
        }
        catch(e){
            console.log("Error in creating options : ", e)
        }

        return response
    })

    res.json({
        response : response.id
    })

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