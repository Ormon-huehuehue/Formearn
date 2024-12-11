import axios from 'axios'
import { NextRequest } from 'next/server'
import React, { use, useEffect, useState } from 'react'
import { backendUrl } from '../../../../config/config'
import Task from '@/components/Task'


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

export default async function Page({
    params,
  }: {
    params: Promise<{ taskId: string }>
  }) {

    const taskId = (await params).taskId

    console.log("task id : ", taskId)


  return (
    <div className = "w-full h-full p-5 flex flex-col">
        <Task taskId={taskId}/>
    </div>
  )
}



