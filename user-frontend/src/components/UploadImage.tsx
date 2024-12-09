"use client"

import React, { useEffect, useState } from 'react'
import axios from "axios"
import { cloudfrontUrl, backendUrl } from '../../config/config'
import Image from 'next/image'


const UploadImage = () => {
  const [images, setImages] = useState<String[]>([])

  const [uploadURL, setUploadURL] = useState<String | null>(null);

  const fetchPresignedUrl = async ()=>{
    const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTczMzU2NTUyN30.n6nIcRZhgdntLh7dCvc7jYHVPz3iKh1HdVSm1ogRJII"
    try{
        const response = await  axios.get(`${backendUrl}/v1/user/presignedurl`, { 
            headers : {
                Authorization : token
            }
        })

        console.log("REsponse : ", response)

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

  return (
    <div className ="flex flex-col">
        <div className="w-full px-10 py-10 flex flex-col justify-center items-center ">
            <h1 className= "text-6xl py-10"> CREATE A TASK</h1>
            <form className = "w-[50%]">
                <h2 className = "text-lg py-2">Enter task details</h2>
                <input placeholder="Select the thumbnail that's thumbnailing" className="text-sm w-full h-7 px-2 py-2 rounded-md"/>
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
            <h1> Uploaded Images</h1>
            <ul className = "gap-5 flex justify-around">
                {images.map((image,index)=>{
                    console.log("imageurel: ", image)
                
                return   <li key={index}>
                            <img src={`${image}`} alt="" width={300}/>
                        </li>
                })}
            </ul>
        </div>
    </div>
  )
}

export default UploadImage