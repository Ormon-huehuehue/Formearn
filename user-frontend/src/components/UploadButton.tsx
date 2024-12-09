"use client"

import React, { useState } from 'react'
//@ts-ignore
const UploadButton = (handleOnChange : (file: File|undefined)=> void) => {
    const [uploading, setUploading] = useState<Boolean>(false)





  return (
    <div>
        <label className="w-20 h-20 rounded-[30%] border text-2xl flex items-center justify-center cursor-pointer relative">
        <input 
            type="file" 
            className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
            onChange = {e=>{handleOnChange(e.target.files?.[0])}}
            />
        <span className="pointer-events-none">+</span>
        </label>
    </div>
  )
}

export default UploadButton