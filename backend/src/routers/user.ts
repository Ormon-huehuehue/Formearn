import { Router } from "express";
import jwt from "jsonwebtoken"
import {PrismaClient} from "@prisma/client";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { jwtSecret } from "..";
import { authMiddleware } from "../middleware";
import { createTaskInput } from "../types";
import { TOTAL_DECIMALS } from "./worker";
import nacl from "tweetnacl";
import { Connection, PublicKey } from "@solana/web3.js";
import { decodeUTF8 } from "tweetnacl-util";
import { Signature } from "typescript";


const router = Router();

export const prisma  = new PrismaClient();

const connection = new Connection(process.env.RPC_URL ?? "")

const access_key = process.env.ACCESS_KEY_ID?? ""
const secret_key = process.env.SECRET_ACCESS_KEY?? ""

const PARENT_WALLET_ADDRESS = "8SExAm8QT4bQxCS3WvjsMYtAuGJVG2Bc7ovpYEuWURpP";

const s3Client = new S3Client({
    //@ts-ignore
    credentials : {
        accessKeyId : access_key,
        secretAccessKey : secret_key
    },
    region : "eu-north-1"
})


router.get("/task", authMiddleware, async(req,res)=>{
    //@ts-ignore
    const userId = req.userId;
    //@ts-ignore
    const taskId = req.query.taskId;

    const taskDetails = await prisma.task.findFirst({
        where: {
            user_id : Number(userId),
            id : Number(taskId)
        },
        include : {
            options : true
        }
    })

    console.log("taskDetails : ", taskDetails)

    if(!taskDetails){
        res.status(404).json({
            message : "You don't have access to this task"
        })
    }

    //Todo : can you make this faster
    const response = await prisma.submission.findMany({ //counting number of submissions/votes
        where : {
            task_id : Number(taskId)
        },
        include : {
            option : true
        }
    })

    const result : Record<string, { 
        count : number,
        option : {
            image_url : string
        }
    }> = {}


    taskDetails?.options.forEach(option=>{
        if(!result[option.id]){
            result[option.id] = {
                count : 0,
                option : {
                    image_url : option.image_url
                }
            }
        }
    })

    //increasing the count of the votes on each option if they're found in submissions
    response.forEach(submission =>{
        result[submission.option_id].count++
    })

    res.json({
        result, 
        taskDetails
    })
})

router.post("/task", authMiddleware, async (req,res)=>{

    const body = req.body;
    //@ts-ignore
    const userId = req.userId;

    const user = await prisma.user.findFirst({
        where : {
            id : userId
        }
    })

    
    const parseData = createTaskInput.safeParse(body);

    if(!parseData.success){
        console.log("zod parsedata error")
        res.status(411).json({
            error : "Invalid input"
        })
    }

    console.log("Signature : ", parseData.data?.signature)

    //@ts-ignore
    const transaction = await connection.getTransaction(parseData.data.signature, {
        maxSupportedTransactionVersion: 1
    });

    console.log("Transaction :", transaction)

    if ((transaction?.meta?.postBalances[1] ?? 0) - (transaction?.meta?.preBalances[1] ?? 0) !== 100000000) {
        return res.status(411).json({
            message: "Transaction signature/amount incorrect"
        })
    }

    if (transaction?.transaction.message.getAccountKeys().get(1)?.toString() !== PARENT_WALLET_ADDRESS) {
        return res.status(411).json({
            message: "Transaction sent to wrong address"
        })
    }

    if (transaction?.transaction.message.getAccountKeys().get(0)?.toString() !== user?.address) {
        return res.status(411).json({
            message: "Transaction sent from wrong address"
        })
    }



    //parse the signature here to ensure the person has paid the amount

    let response = await prisma.$transaction(async (tx)=>{

        const response = await tx.task.create({
            data :{
                title : parseData.data?.title?? "Choose the best thumbnail",
                amount : 1*TOTAL_DECIMALS,
                signature : parseData.data?.signature?? "",
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
        id : response.id
    })

})


router.get("/presignedurl",authMiddleware, async (req, res)=>{
    // @ts-ignore
    const userId = req.userId;
    
    const command = new PutObjectCommand({
        Bucket : "formearn", 
        Key : `Formearn/${userId}/${Date.now()}/image.png`,
        ContentType : "image/png"
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

    const {publicKey, signature} = req.body

    const message = "Sign into formearn"
    const messageBytes = decodeUTF8(message)
    

    const result = nacl.sign.detached.verify(
        messageBytes,
        new Uint8Array(signature.data),
        new PublicKey(publicKey).toBytes()
    )

    if(!result){
        res.status(411).json({
            message: "Incorrect signature"
        })
    }

    const existingUser =  await prisma.user.findFirst({
        where : {
            address : publicKey
        }
    })

    if(existingUser){
        const token = jwt.sign({
            userId  : existingUser.id
        }, jwtSecret)

        res.json({token})
    }
    else{
        console.log("Creating new user")
        const user = await prisma.user.create({
            data : {
                address : publicKey
            }
        })    
        
        const token = jwt.sign({
            userId : user.id
        }, jwtSecret)

        res.json({token})
    }

});

export default router;