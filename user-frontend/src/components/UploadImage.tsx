"use client"

import React, { useState } from 'react'

const UploadImage = () => {
  const [image, setImage] = useState<File>()
  const [uploading, setUploading] = useState<Boolean>(false)

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
                    onChange = {e=>{setImage(e.target.files?.[0])}}
                    />
                <span className="pointer-events-none">+</span>
                </label>
            </section>
        </div>
    </div>
  )
}

export default UploadImage