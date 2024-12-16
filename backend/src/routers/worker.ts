import { Router } from "express";
import { jwtSecret } from "..";
import jwt from "jsonwebtoken"
import { prisma } from "./user";
import { workerMiddleware } from "../middleware";
import { getNextTask } from "../db";
import { createSubmissioninput } from "../types";
import { SystemProgram, Transaction, PublicKey } from "@solana/web3.js";
import { decodeUTF8 } from "tweetnacl-util";
import nacl from "tweetnacl";

export const jwtSecretWorker = jwtSecret + "worker"
export const TOTAL_DECIMALS = 1000000000;

const PARENT_WALLET_ADDRESS = "8SExAm8QT4bQxCS3WvjsMYtAuGJVG2Bc7ovpYEuWURpP";

const router = Router();

//@ts-ignore
router.post("/signin", async(req, res) => {
    console.log("Worker signin initiated")
    const { publicKey, signature } = req.body;
    const message = new TextEncoder().encode("Sign into formearn as a worker");

    const result = nacl.sign.detached.verify(
        message,
        new Uint8Array(signature.data),
        new PublicKey(publicKey).toBytes(),
    );

    console.log("Result :", result)

    if (res.headersSent) {
        console.log("Headers already sent!");
    }


    if (!result) {
        res.status(411).json({
            message: "Incorrect signature"
        })

        return 
    }

    const existingUser = await prisma.worker.findFirst({
        where: {
            address: publicKey
        }
    })

    if (existingUser) {
        const token = jwt.sign({
            userId: existingUser.id
        }, jwtSecretWorker)

        res.json({
            token,
            amount: existingUser.pending_amount / TOTAL_DECIMALS
        })
        
        return 
    } else {
        const user = await prisma.worker.create({
            data: {
                address: publicKey,
                pending_amount: 0,
                locked_amount: 0
            }
        });

        const token = jwt.sign({
            userId: user.id
        }, jwtSecretWorker)

        res.json({
            token,
            amount: 0
        })

        return
    }
});



router.get("/nextTask", workerMiddleware, async (req,res)=>{
    // @ts-ignore
    const userId : string = req.userId;

    const task = await getNextTask(Number(userId))

    if(!task){
        res.status(411).json({
            message : "No more tasks left for you to review"
        })
        return 
    }
    else{
        res.status(200).json({
            task
        })
    }
})


router.post("/submission", workerMiddleware, async (req,res)=>{
    const body = req.body;
    //@ts-ignore
    const userId = req.userId;

    const TOTAL_SUBMISSIONS = 100;

    
    const parsedData = createSubmissioninput.safeParse(body);
    console.log("ParsedData : ", parsedData)
    
    if(parsedData.success){
        const task = await getNextTask(Number(userId))
        
        if(!task || task.id != Number(parsedData.data.task_id) ){
            res.status(411).json({
                message : "Incorrect task id"
            })
            return
        }


        const amount = (Number(task?.amount)/TOTAL_SUBMISSIONS).toString()
        
        try{

            const submission = await prisma.$transaction(async tx=>{
                const response = await tx.submission.create({
                    data : {
                        worker_id : Number(userId),
                        option_id : Number(parsedData.data?.selection),
                        task_id : Number(parsedData.data?.task_id),
                        amount : Number(amount)
                    }
                })

                await tx.worker.update({
                    where: {
                        id : userId
                    },
                    data : {
                        pending_amount :{
                            increment : Number(amount)
                        }
                    }
                })

                return response;
            })

            const nextTask = await getNextTask(Number(userId));

            res.json({
                submission,
                nextTask
            })

        }
        catch(e){
            console.log("Error : ", e)
            res.status(411).json({
                error : "An error occured while making the submission"
            })
        }

    }
    else{
        res.status(411).json({
            error : "Could not parse data"
        })
    }

})


router.get("/balance", workerMiddleware, async (req, res)=>{
    //@ts-ignore
    const userId = req.userId;

    const worker = await prisma.worker.findFirst({
        where : {
            id : userId
        }
    })

    res.json({
        pendingAmount : worker?.pending_amount,
        lockedAmount : worker?.locked_amount
    })
})


router.post("/payout", workerMiddleware, async (req,res)=>{
    //@ts-ignore
    const userId = req.userId;
    const worker = await prisma.worker.findFirst({
        where :{
            id : userId
        }
    })

    if(!worker){
        res.status(400).json({
            message : "user not found"
        })
        return
    }
    else{
        const address = worker?.address;

        const transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey : new PublicKey("8SExAm8QT4bQxCS3WvjsMYtAuGJVG2Bc7ovpYEuWURpP"),
                toPubkey : new PublicKey(address),
                lamports : 100000000
    
            })
        )

        const txnId = transaction.signature 

        //add a lock here
        await prisma.$transaction(async tx=>{
            await tx.worker.update({
                where: {
                    id : userId
                },
                data : {
                    pending_amount :{
                        decrement : worker?.pending_amount
                    },
                    locked_amount :{
                        increment : worker?.pending_amount
                    }
                }
            })

            
            await tx.payouts.create({
                data : {
                    user_id : userId,
                    amount : worker.pending_amount,
                    signature : txnId,
                    status : "Processing"

                }
            })
        })


        res.json({
            message : "Processing payment",
            amount : worker.pending_amount
        })
    }
})

export default router