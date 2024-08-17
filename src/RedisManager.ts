import { createClient,RedisClientType } from "redis";

class RedisManager{
    private client:RedisClientType;
    private publisher:RedisClientType;
    private static instance:RedisManager;

    private constructor(){
        this.client=createClient();
        this.publisher=createClient();
        this.client.connect();
        this.publisher.connect();
    }
    public static getInstance(){
        if(!this.instance){
            return new RedisManager();
        }
        return this.instance;
    }
    public sendAndAwait(message:any){
        return new Promise<any>((resolve)=>{
            const id=this.getRandomId();
            this.client.subscribe(id,(message)=>{
                this.client.unsubscribe(id);
                resolve(JSON.parse(message));
            })
            this.publisher.lPush("message",JSON.stringify({clientId:id,message}))
        })
    }
    private getRandomId(){
        return Math.random().toString(36).substring(2,15)+Math.random().toString(36).substring(2,15);
    }
}

export default RedisManager;