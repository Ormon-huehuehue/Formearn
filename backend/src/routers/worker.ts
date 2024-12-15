import { Router } from "express";
import { jwtSecret } from "..";
import jwt from "jsonwebtoken"
import { prisma } from "./user";
import { workerMiddleware } from "../middleware";
import { getNextTask } from "../db";
import { createSubmissioninput } from "../types";

export const jwtSecretWorker = jwtSecret + "worker"
export const TOTAL_DECIMALS = 1000000000;



const router = Router();


router.post("/signin", async (req,res)=>{
    console.log("Signin request received")
    //TODO : Add sign verification logic here
    const hardCodedWalletAddress = "8EvUD7QiWDznwVh1VwRUncVadSqrC1JZJroVTtbZgQrw"

    const existingUser =  await prisma.worker.findFirst({
        where : {
            address : hardCodedWalletAddress
        }
    })

    if(existingUser){
        console.log("Existing user")
        const token = jwt.sign({
            userId  : existingUser.id
        }, jwtSecret)

        res.json({token})
    }
    else{
        console.log("Creating a new user")
        const user = await prisma.worker.create({
            data : {
                address : hardCodedWalletAddress,
                pending_amount : 0,
                locked_amount : 0
            }
        })    
        
        
        const token = jwt.sign({
            userId : user.id
        }, jwtSecretWorker)
        
        res.json({token})
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
    }
    else{
        const address = worker?.address;

        const txnId = "0x123123";

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