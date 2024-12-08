import { prisma } from "./routers/user"

export const getNextTask = async (userId : number)=>{

    const task = await prisma.task.findFirst({
        where : {
            submissions : {
                none :{
                    worker_id  : userId,
                }
            },
            Done : false
        },
        select : {
            title : true,
            options : true,
            id : true,
            amount : true
        }
    })

   return task;
}