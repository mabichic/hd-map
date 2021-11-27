// import { isLoadingService, messageService } from "../services/message.service";

const LOAD = "LOAD";
const ADD = "ADD";
const UPDATE = "UPDATE";


export const loadAll = (data) =>{
    return {
        type : LOAD,
        payload : { 
            data : data, 
        }
    }
}

const initState = { 
    updateNum : 0,
    data : [] 
};

export default function reducer(state = initState, {type, payload }){
    console.log(type);
    console.log(payload);
    
    switch(type){ 
        case LOAD : 
            state.data.push(JSON.parse(JSON.stringify(payload.data)));
            state.updateNum = state.data.length
            console.log(state);
            return {...state};
        default : 
            return {...state};
    }

};