import express from "express"
import cors from "cors";
import { orderSchema } from "./types";
import { orderBook,bookWithQuantity } from "./orrderBook";
import orderRouter from "./routes/order";

const app=express();
app.use(express.json());
app.use(cors());
app.use(express.json());

const BASE_ASSET="SOL";
const QUOTE_ASSET="INR";

interface Fill{
    tradeId:number,
    qunatity:number,
    price:number
}

let GLOBAL_TRADE_ID=1;

app.use('/api/v1/order',orderRouter);


app.post('/api/v1/order',(req,res)=>{
    const order=orderSchema.safeParse(req.body);
    if(!order.success){
        res.status(400).json({"error":order.error.message});
        return;
    }
    
    const {baseAsset,quoteAsset,price,quantity,type,kind,side}=order.data;

    if(baseAsset!=BASE_ASSET || quoteAsset!=QUOTE_ASSET){
        return res.status(400).json({error:"invalid market"});
    }

    const orderId=generateOrderId();
    const {status,executedQuantity,fills}=processOrder(orderId,price,quantity,side,kind);

    if(status==='rejected') return res.status(400).json({orderId,status,executedQuantity,fills});

    return res.status(201).json({orderId,status,executedQuantity,fills});
})

app.listen(7000,()=>{
    console.log('listening on port 7000');
})


function generateOrderId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function processOrder(orderId:string,price:number,quantity:number,side:"buy"|"sell", kind?:"ioc"):{status:"rejected"|"accepted",executedQuantity:number,fills:Fill[]}{
    const fills:Fill[]=[];
    let executedQuantity=0;
    const maxFilledQuantity=getMaxFillQuantity(side,price,quantity);

    if(kind==='ioc' && maxFilledQuantity<quantity){
        return {
            status:'rejected',
            executedQuantity:0,
            fills
        }
    }

    //bidding limit
    if(side=='buy'){
        //need to sort the order book so the bidder can eat orders from minimum till the bid price
        orderBook.asks.sort((o1,o2)=> o1.price-o2.price);

        //eating up the orders
        orderBook.asks.forEach((o,index)=>{

            if(quantity>0 && o.price<=price){

                const filledQuantity=Math.min(quantity,o.quantity);
                o.quantity-=filledQuantity;
                quantity-=filledQuantity;
                bookWithQuantity.asks[o.price]-=filledQuantity;
                executedQuantity+=filledQuantity;
                
                fills.push({
                    price:o.price,
                    qunatity:filledQuantity,
                    tradeId:GLOBAL_TRADE_ID++
                })

                if(o.quantity===0){
                    orderBook.asks.splice(index,1);
                }

                if(bookWithQuantity.asks[o.price]===0) delete bookWithQuantity.asks[o.price];
            }
        })

        if(quantity!==0){
            orderBook.bids.push({orderId,price:price,quantity:quantity});
            bookWithQuantity.bids[price]+=quantity;
        }
    }
    else {
        orderBook.bids.sort((o1,o2)=>o2.price-o1.price);
        orderBook.bids.forEach((o,index)=>{
            if(o.price>=price && quantity>0){
                const filledQuantity=Math.min(o.quantity,quantity);
                o.quantity-=filledQuantity;
                quantity-=filledQuantity;
                bookWithQuantity.bids[o.price]-=filledQuantity;
                executedQuantity+=filledQuantity;

                if(o.quantity===0){
                    //delete the bid from the order book if quantity becomes zero
                    orderBook.bids.splice(index,1);
                }

                if(bookWithQuantity.bids[o.price]===0){
                    delete bookWithQuantity.bids[o.price];
                }

                fills.push({
                    tradeId:GLOBAL_TRADE_ID++,
                    qunatity:filledQuantity,
                    price:o.price
                })
            }
        })

        
        if(quantity!==0){
            //place order in the asks
            orderBook.asks.push({
                orderId,
                price:price,
                quantity:quantity,
            })
            bookWithQuantity.asks[price]+=quantity;
        }
    }

    return {
        status:"accepted",
        executedQuantity:executedQuantity,
        fills
    }
}


function getMaxFillQuantity(side:"buy"|"sell",price:number,quantity:number){
    let totalQtn=0;
    if(side=='buy'){
        orderBook.asks.forEach((o)=>{
            if(o.price<=price ){
                const filledQuantity=Math.min(quantity,o.quantity);
                totalQtn+=filledQuantity;
            }
        })
    }   
    else{
        orderBook.bids.forEach((o)=>{
            if(o.price>=price){
                const filledQuantity=Math.min(quantity,o.quantity);
                totalQtn+=filledQuantity;
            }
        })
    }
    return totalQtn;
}