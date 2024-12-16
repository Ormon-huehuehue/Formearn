"use client"

import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { WalletDisconnectButton, WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import axios from 'axios'
import React, {useEffect, useState} from 'react'
import { backendUrl } from '../../../config/config'

const Appbar = () => {

  const {publicKey, signMessage} = useWallet();
  const [balance, setBalance] = useState(0)

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

      setBalance(response.data.amount);

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


  useEffect(()=>{
    const fetchBalance = async ()=>{

      const token = localStorage.getItem("token")

      if(token){

        const response = await axios.get(`${backendUrl}/v1/worker/balance`,{
          headers : {
            "Authorization" : token
          }
        });
        
        if(!response.data){
          console.error("An error occured while fetching the balance")
          return
        }
      }
      else{
        console.log("You're not signed in")
      }
    }

    fetchBalance

  },[publicKey])


  return (
    <div className=  "flex justify-between py-3 px-3 text-lg font-mono">
        <div>
            Formearn
        </div>
        <div className= 'flex justify-center'> {balance}</div>
        <div className=' flex gap-2'>
              
             <WalletMultiButton/>
             {publicKey ? <WalletDisconnectButton/> : null}
        </div>
    </div>
  )
}

export default Appbar