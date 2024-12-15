"use client"

import React, { useEffect, useState } from 'react'
import axios from "axios"
import { cloudfrontUrl, backendUrl } from '../../config/config'
import { useRouter } from 'next/navigation'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { SystemProgram, Transaction, PublicKey } from "@solana/web3.js";



const UploadImage = () => {
  const [images, setImages] = useState<String[]>([])

  const [uploadURL, setUploadURL] = useState<String | null>(null);
  const [title, setTitle] = useState<String>()
  const [txSignature, setTxSignature] = useState("");
  const [processing, setProcessing] = useState<boolean>(false)
  const [token, setToken] = useState<string | null>(null)


  const router = useRouter()
  const {publicKey, sendTransaction} = useWallet()
  const {connection} = useConnection()




  const fetchPresignedUrl = async (token : string | null)=>{
    try{
        if(!token){
            console.error("Token not present")
        }
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
        const tokenInLocalStorage = localStorage.getItem("token")
        if(tokenInLocalStorage){
            setToken(tokenInLocalStorage)
        }
    },[token])

    useEffect(()=>{
        if(token && publicKey){
            fetchPresignedUrl(token);
        }
    },[token])

  const handleOnChange = async (file : File | undefined)=>{
    //generate a new presigned url everytime a new file is being uploaded
    fetchPresignedUrl(token);

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


    try{   
        const response = await axios.post(`${backendUrl}/v1/user/task`,
            {
                options : images.map((image)=>({
                    image_url : image
                })),
                title : title,
                signature : txSignature
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
            
            router.push(`/task/${response.data.id}`)
        }
    }
    catch(e){
        console.log("Error while uploading task :", e)
    }
  }

  const makePayment = async()=>{
    const transaction = new Transaction().add(
        SystemProgram.transfer({
            fromPubkey : publicKey!,
            toPubkey : new PublicKey("8SExAm8QT4bQxCS3WvjsMYtAuGJVG2Bc7ovpYEuWURpP"),
            lamports : 100000000

        })
    )

    const {
        context: { slot: minContextSlot },
        value: { blockhash, lastValidBlockHeight }
    } = await connection.getLatestBlockhashAndContext();

    const signature = await sendTransaction(transaction, connection, { minContextSlot });

    setProcessing(true)

    await connection.confirmTransaction({ blockhash, lastValidBlockHeight, signature });
    setTxSignature(signature);
    setProcessing(false)

  }

  return (
    <div className ="flex flex-col font-mono">
        <div className="w-full px-10 py-10 flex flex-col justify-center items-center ">
            <h1 className= "text-6xl py-10 font-mono "> CREATE A TASK</h1>
            <form className = "w-[50%]">
                <h2 className = "text-lg py-2">Enter task details</h2>
                <input placeholder="Select the thumbnail that's thumbnailing" className="text-sm w-full h-7 px-2 py-2 rounded-md text-black"
                onChange={(e)=>setTitle(e.target.value)}/>
                <div className= "w-full flex justify-center py-4">
                    {/* <button type="submit" className= "bg-slate-700 p-5 rounded-md font-mono text-white text-lg"> Submit task</button> */}
                    {/* add a pay 0.1sol button here */}
                    <div className="flex justify-center">   
                {!publicKey ? <h1 className=  'py-5 font-mono text-sm text-center font-semibold text-red-400'>Please connect your wallet to start posting new tasks</h1> :null}    
                {!txSignature && publicKey ? <button onClick={makePayment} type="button" className="mt-4 text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-full text-sm px-5 py-2.5 me-2 mb-2 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700">
                    {processing ? "Processing Transaction" : "Pay 0.1 SOL"}
                </button> : null}
                {txSignature && publicKey ? <button onClick={handleSubmit} type="button" className="mt-4 text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-full text-sm px-5 py-2.5 me-2 mb-2 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700">
                    Submit Task
                </button> : null}
        </div>
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