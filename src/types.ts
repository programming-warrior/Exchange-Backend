import {z} from "zod";

export const CREATE_ORDER='CREATE_ORDER';
export const CANCEL_ORDER='CANCEL_ORDER';
export const GET_OPEN_ORDER='GET_OPEN_ORDER';

export const    orderSchema=z.object({
    baseAsset:z.string(),
    quoteAsset:z.string(),
    quantity:z.number(),
    price:z.number(),
    side:z.enum(['buy','sell']),
    type:z.enum(['limit','market']),
    kind:z.enum(['ioc']).optional()
})