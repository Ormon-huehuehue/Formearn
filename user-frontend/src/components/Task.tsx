"use client"

import axios from 'axios'
import { NextRequest } from 'next/server'
import React, { use, useEffect, useState } from 'react'
import { backendUrl } from '../../config/config'

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTczMzU2NTUyN30.n6nIcRZhgdntLh7dCvc7jYHVPz3iKh1HdVSm1ogRJII"



const fetchTaskDetails = async (taskId : string)=>{
    
    const response = await axios.get(`${backendUrl}/v1/user/task?taskId=${taskId}`,{
        headers : {
            "Authorization" : token
        }
    });

    if(response.data){
        console.log("Response : ", response.data);
        return response.data
    }
    else{
        console.error("An error occurred while fetching the task details")
    }

}

const Task = ({taskId}: { taskId : string}) => {



    const [result, setResult] = useState<Record<string,{
        count : number,
        option : {
            image_url : string
        }}>>()

    const [taskDetails, setTaskDetails] = useState<{title? : string}>({})


    useEffect(()=>{
        setInterval(()=>{
            fetchTaskDetails(taskId)
            .then(data=>{
                setTaskDetails(data.taskDetails)
                setResult(data.result)
                
                console.log("result : ", data.result)
                console.log("Task Details : ", data.taskDetails)
            })
        },5000)
    },[taskId])


  return (
    <div className = "w-full h-full p-5 flex flex-col">
      <h1 className ="font-mono text-4xl"> {taskDetails.title} </h1>
      <div className = "flex flex-wrap">
        {Object.keys(result || {}).map((optionId)=> 
        //@ts-ignore
            <TaskComponent key={optionId} imageUrl ={result[optionId].option.image_url} votes = {result[optionId].count}  />
        )}
      </div>
    </div>
  )
}

export default Task



function TaskComponent({imageUrl, votes}: {
    imageUrl: string;
    votes: number;
}) {
    return (
    <div className = " border-white border-opacity-100 hover:border-[1px] m-5 bg-white bg-opacity-5 rounded-lg py-2 flex flex-col gap-5 ">
        <img className={"p-2 w-96 rounded-lg"} src={imageUrl} />
        <div className='flex justify-center py-2'>
            {votes}
        </div>
    </div>
    )
}