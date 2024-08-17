import express from "express";
import RedisManager from "../RedisManager";
import { CREATE_ORDER,CANCEL_ORDER,GET_OPEN_ORDER } from "../types";

const orderRouter=express.Router();

orderRouter.post('/',async(req,res)=>{
    const {qtn,price,baseAsset,quoteAsset,side,kind,type,userId}=req.body;
    const response=await RedisManager.getInstance().sendAndAwait({
        type:CREATE_ORDER,
        data:{
            qtn,
            price,
            baseAsset,
            quoteAsset,
            side,
            kind,
            type,
            userId
        }
    })
})

orderRouter.delete('/',async(req,res)=>{
    const {orderId,market,userId}=req.body;
    const response=await RedisManager.getInstance().sendAndAwait({
        type:CANCEL_ORDER,
        data:{
            orderId,
            market,
            userId
        }
    })    
    return res.json(response.payload);
})


orderRouter.get('/open',async(req,res)=>{
    const response=await RedisManager.getInstance().sendAndAwait({
        type:GET_OPEN_ORDER,
        data:{
            market:req.query.market as string
        }
    })
})


export default orderRouter;