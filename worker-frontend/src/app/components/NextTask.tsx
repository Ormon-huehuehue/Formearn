"use client"

import React, { useEffect, useState } from 'react'
import { backendUrl } from '../../../config/config'
import axios from 'axios'

interface Task{
    title : string,
    options : {
        id : number,
        image_url : string,
        task_id : number
    }[],
    id : number,
    amount : number
}


const token ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImlhdCI6MTczNDExMDU2Nn0.YjD22W7iozJcIBlT57EUjXcCO5OZWE1k5sW23d4P51o"


const NextTask = () => {

    const [currentTask, setCurrentTask] = useState<Task | null>(null);
    const [loading, setLoading] = useState<boolean>(true)

    useEffect(()=>{
        setLoading(true);
        const fetchTask = async ()=>{

            try{
                const response = await axios.get(`${backendUrl}/v1/worker/nextTask`,{
                    headers : {
                        "Authorization" : token
                    }
                })
                
                if(response){
                    console.log("Next task : ", response.data)
                    setCurrentTask(response.data.task)
                    setLoading(false);
                }
                else{
                    console.log("An error occured while fetching the next task")
                }
            }
            catch(e){
                console.log("Tasks khatam")
                setLoading(false);
                setCurrentTask(null)
            }
        }

        fetchTask()
    },[])



    if(loading){
        return (
            <div className = ' min-h-screen flex justify-center items-center text-black'>
                <h1 className= 'font-bold text-4xl font-mono '>...Loading</h1>
            </div>
        )
    } 

    if(!currentTask){
        return (
            <div className = 'min-h-screen flex justify-center items-center text-black font-semibold text-4xl'>
                Please check back in some time, there are no pending tasks at the moment
            </div>
        )
    }

    
    return (
        <div className='flex flex-col'>
            <h6 className='text-center text-xl'>{currentTask.title}</h6>
            <div className = 'flex justify-around pt-8'>
                {currentTask.options.map(option=> 
                    <Option key={option.id} imageUrl={option.image_url} onSelect={async ()=>{
                        const response = await axios.post(`${backendUrl}/v1/worker/submission`,{
                            task_id : option.task_id,
                            selection : option.id 
                        },
                            {
                            headers : {
                                "Authorization" : token
                            }    
                        })

                        console.log("Submission : ", response.data)

                        //refresh the user balance in the appbar

                        const nextTask = response.data.nextTask
                        if(nextTask){
                            setCurrentTask(nextTask)
                        }
                        else{
                            setCurrentTask(null)
                        }
                    }}/>
                )}
            </div>
        </div>
    )
    
}

export default NextTask

function Option({imageUrl, onSelect}:{imageUrl : string, onSelect: ()=>void}){
    return ( 
        <div>
            <img onClick={onSelect} className = "p-2 w-96 rounded-md" src={imageUrl}/>
            <div className= 'flex justify-center'>
               
            </div>
        </div>
    )
}