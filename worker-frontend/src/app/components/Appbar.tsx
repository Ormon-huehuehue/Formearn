"use client"

import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { WalletDisconnectButton, WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import axios from 'axios'
import React, {useEffect} from 'react'
import { backendUrl } from '../../../config/config'

const Appbar = () => {

  const {publicKey, signMessage} = useWallet();

  const signAndSend = async () => {
    if (!publicKey){
      console.error("Wallet not connected")
    }

    console.log("key : ", publicKey)
    const message = new TextEncoder().encode("Sign into formearn as a worker")
    const signature = await signMessage?.(message)
    
    console.log("Sign : ", signature)

    try{
      const response = await axios.post(`${backendUrl}/v1/worker/signin`,{
        signature,
        publicKey
      });
      console.log("Response : ", response.data)

      localStorage.setItem("token", response.data.token)
    }
    catch(e){
      console.log("Couln't sign message")
    }
  }

  useEffect(()=>{
    if(publicKey){
      signAndSend();
    }
  }, [publicKey])


  return (
    <div className=  "flex justify-between py-3 px-3 text-lg font-mono">
        <div>
            Formearn
        </div>
        <div className=' flex gap-2'>
             <WalletMultiButton/>
             {publicKey ? <WalletDisconnectButton/> : null}
        </div>
    </div>
  )
}

export default Appbar