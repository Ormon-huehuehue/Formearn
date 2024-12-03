import { Router } from "express";
import jwt from "jsonwebtoken"
import {PrismaClient} from "@prisma/client";

const jwtSecret = "ormon"

const router = Router();

const prismaClient  = new PrismaClient();


//signin with wallet
router.post("/signin",async  (req,res)=>{
    //TODO : Add sign verification logic here
    const hardCodedWalletAddress = "FXHfqca1fKpFKB5bcNKGAznLqWo1RR2MTtnVcQnLSrEn"

    const existingUser =  await prismaClient.user.findFirst({
        where : {
            address : hardCodedWalletAddress
        }
    })

    if(existingUser){
        const token = jwt.sign({
            address : hardCodedWalletAddress
        }, jwtSecret)

        res.json({token})
    }
    else{
        const user = await prismaClient.user.create({
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