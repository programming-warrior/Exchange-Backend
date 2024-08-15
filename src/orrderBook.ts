

interface Order{
    orderId:string,
    quantity:number,
    price:number,
}

interface Ask extends Order{

}

interface Bid extends Order{

}

interface OrderBook{
    asks: Ask[],
    bids: Bid[]
}

export const orderBook:OrderBook={
    asks:[

    ],
    bids:[

    ]
}

export const bookWithQuantity:{bids:{[price:number]:number},asks:{[price:number]:number}}={
    bids:{},
    asks:{}
}

