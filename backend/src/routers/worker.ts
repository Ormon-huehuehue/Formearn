import { Router } from "express";
import { jwtSecret } from "..";
import jwt from "jsonwebtoken"
import { prisma } from "./user";
import { workerMiddleware } from "../middleware";
import { getNextTask } from "../db";
import { createSubmissioninput } from "../types";

export const jwtSecretWorker = jwtSecret + "worker"
const router = Router();

router.post("/signin", async (req,res)=>{
    console.log("Signin request received")
    //TODO : Add sign verification logic here
    const hardCodedWalletAddress = "FXHfqca1fKpFKB5bcNKGAznLqWo1RR2MTtnVcQnLSrEn"

    const existingUser =  await prisma.worker.findFirst({
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


        const amount = (Number(task?.amount)/TOTAL_SUBMISSIONS).toString();
        
        try{
            const response = await prisma.submission.create({
                data : {
                    worker_id : Number(userId),
                    option_id : Number(parsedData.data?.selection),
                    task_id : Number(parsedData.data?.task_id),
                    amount 
                }
            })

            res.json({
                submission : response
            })
        }
        catch(e){
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

export default router