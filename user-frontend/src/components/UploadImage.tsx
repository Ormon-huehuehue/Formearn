"use client"

import React, { useEffect, useState } from 'react'
import axios from "axios"
import { cloudfrontUrl, backendUrl } from '../../config/config'
import Image from 'next/image'
import { useRouter } from 'next/router'

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTczMzU2NTUyN30.n6nIcRZhgdntLh7dCvc7jYHVPz3iKh1HdVSm1ogRJII"


const UploadImage = () => {
  const [images, setImages] = useState<String[]>([])

  const [uploadURL, setUploadURL] = useState<String | null>(null);
  const [title, setTitle] = useState<String>()
  const router = useRouter();

  const fetchPresignedUrl = async ()=>{
    try{
        const response = await  axios.get(`${backendUrl}/v1/user/presignedurl`, { 
            headers : {
                "Authorization" : token
            }
        })

        const presignedurl = response.data.presignedUrl
        console.log("Presigned URL : ", presignedurl)

        setUploadURL(presignedurl)
        
    }
    catch(e){
        console.log("An error occured while fetching the presigned url : ", e)
    }
}

    useEffect(()=>{
        fetchPresignedUrl();
    },[])

  const handleOnChange = async (file : File | undefined)=>{
    //generate a new presigned url everytime a new file is being uploaded
    fetchPresignedUrl();

    console.log("Image: ", file);
    
    if(!uploadURL){
        throw new Error("File cannot be uploaded : Didn't receive a presigned url from the host")
    }

    const response = await axios.put(uploadURL as string, file, { 
        headers: {
            //@ts-ignore
            "Content-Type": file.type,
            "Content-Disposition": "inline",
        },
    })

    console.log("response :", response);

    //contstructing the file's public url
    const url =  uploadURL.split("?")[0];
    const uploadedImageurl = url.split("Formearn")[1]; // Extracts everything after "Formearn"
    const finalUrl = "Formearn" + uploadedImageurl;
    const imageUrl = `${cloudfrontUrl}/${finalUrl}`
    console.log("url : ", imageUrl)

    console.log(`${cloudfrontUrl}/${finalUrl}`)
    setImages((prev) => [...prev, imageUrl]);

  }

  const handleSubmit = async (e:React.FormEvent)=>{
    e.preventDefault()


    const data = {
        options : images.map((image)=> (
            {
                image_url : image
            })),
        signature:"hello",      //replace this signature with the signature of the transaction later on
        title : "my title"
    }

    try{   
        const response = await axios.post(`${backendUrl}/v1/user/task`,
            {
                options : images.map((image)=>({
                    image_url : image
                })),
                signature : "hello",
                title : "my title"
            },
            {
                headers : {
                    "Authorization" : token
                }
            }
        )
        
        if(!response.data){
            console.log("Task couldn't be uploaded")
        }
        else{
            console.log("task uploaded : ", response.data)
            //router.push

            
        }
    }
    catch(e){
        console.log("Error while uploading task :", e)
    }
  }

  return (
    <div className ="flex flex-col font-mono">
        <div className="w-full px-10 py-10 flex flex-col justify-center items-center ">
            <h1 className= "text-6xl py-10 font-mono "> CREATE A TASK</h1>
            <form className = "w-[50%]" onSubmit={handleSubmit}>
                <h2 className = "text-lg py-2">Enter task details</h2>
                <input placeholder="Select the thumbnail that's thumbnailing" className="text-sm w-full h-7 px-2 py-2 rounded-md text-black"
                onChange={(e)=>setTitle(e.target.value)}/>
                <div className= "w-full flex justify-center py-4">
                    <button type="submit" className= "bg-slate-700 p-5 rounded-md font-mono text-white text-lg"> Submit task</button>
                </div>
            </form>
        </div>
        <div className=  "w-full flex justify-center">
            <section id="uploadButton">
                <label className="w-20 h-20 rounded-[30%] border text-2xl flex items-center justify-center cursor-pointer relative">
                <input 
                    type="file" 
                    className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                    onChange = {e=>{handleOnChange(e.target.files?.[0])}}
                    />
                <span className="pointer-events-none">+</span>
                </label>
            </section>
        </div>
        <div>
            <h1 className= "text-center text-xl pt-10 pb-5"> Uploaded Images</h1>
            <ul className = "gap-5 flex justify-around">
                {images.map((image,index)=>{
                    console.log("imageUrl: ", image)
                
                return   <li key={index} className=  "cursor-pointer outline-none hover:outline-dotted hover:outline-white">
                            <img src={`${image}`} alt="" width={300}/>
                        </li>
                })}
            </ul>
        </div>
   
    </div>
  )
}

export default UploadImage