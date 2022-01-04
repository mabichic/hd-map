import { satisfies } from "semver";
import { messageService } from "../service/message.service";

const { ipcRenderer } = window.require("electron");

Array.prototype.division = function (n) {
    var arr = this;
    var len = arr.length;
    var cnt = Math.floor(len / n) + (Math.floor(len % n) > 0 ? 1 : 0);
    var tmp = [];

    for (var i = 0; i < cnt; i++) {
        tmp.push(arr.splice(0, n));
    }

    return tmp;
}

// import { isLoadingService, messageService } from "../services/message.service";

const LOAD = "LOAD";
const LOAD_SUCCESS = "LOAD_SUCCESS";
const GPS_LOAD_SUCCESS = "GPS_LOAD_SUCCESS";
const LOAD_FAIL = "LOAD_FAIL";
const ADD = "ADD";
const ADDS = "ADDS";
const UPDATE = "UPDATE";
const DELETE = "DELETE";
const RESET = "RESET";
const INIT = "INIT";
const SAVE = "SAVE";
const SAVE_SUCCESS = "SAVE_SUCCESS";
const SAVE_FAIL = "SAVE_FAIL";
const LOADING = "LOADING"; 

export const init = () =>{
    return { 
        type:INIT,
    }
}


export const updateMap = (id, data) =>{
    return {
        type : UPDATE,
        payload : { 
            id : id, 
            data : data, 
        }
    }
}

export const addObject = (feature) =>{
    return {
        type : ADD, 
        payload : {
            feature : feature,
        }
    }
}

export const addObjects= (features) =>{
    return {
        type : ADDS, 
        payload : {
            features : features,
        }
    }
}
export const resetObject = (feature) =>{
    return {
        type : RESET, 
        payload : {
            feature : feature,
        }
    }
}
export const deleteObject = (feature) =>{
    return {
        type : DELETE , 
        payload : {
            feature : feature,
        }
    }
}

// export const save = (type) =>{
//     return {
//         type:SAVE, 
//         payload : { 
//             type : type,
//         }
//     }
// }

export const load = (tpe) => async (dispatch) =>{
    dispatch({type : LOAD});
}
export const load_success = (data) => async (dispatch)=>{
    dispatch({type : LOAD_SUCCESS,
              payload : {
                data : data,
              }        
    });
    messageService.sendMessage("Load", "데이터 로드 완료");
}
export const gps_load_success = (data) => async(dispatch)=>{
    dispatch({type : GPS_LOAD_SUCCESS,
        payload : {
          data : data,
        }        
    });
    messageService.sendMessage("Load", "GPS 데이터 로드 완료");
}
export const load_fail = (msg) => async (dispatch)=>{
    dispatch({type : LOAD_FAIL,});
    messageService.sendMessage("Load Fail", msg);
}
export const save = (type) => async (dispatch,getState)  =>{
    dispatch({ type: SAVE }); 
    var check = false;
    var msg = [];
    if(type==="all"||type==="LinkNodeSet"){
        if(typeof(getState().data[getState().updateNum-1].LAYER_LN_LINK)!=='undefined'){
            getState().data[getState().updateNum-1].LAYER_LN_LINK.forEach((row)=>{
                if(row.ENodeID===''||isNaN(Number(row.ENodeID))) {
                    check = true; 
                    msg.push(`LINK ID : ${row.ID} 객체의 ENodeID가 없습니다.\r\n`);
                }
                if(row.SNodeID===''||isNaN(Number(row.SNodeID))) {
                    check = true; 
                    msg.push(`LINK ID : ${row.ID} 객체의 SNodeID가 없습니다.\n\r`);
                }
            });
        }
        if(typeof(getState().data[getState().updateNum-1].LAYER_LN_NODE)!=='undefined'){
            getState().data[getState().updateNum-1].LAYER_LN_NODE.forEach((row)=>{
                if(row.NumConLink<1){
                    check = true;
                    msg.push(`NODE ID : ${row.ID} 객체의 연결된 LINK가 없습니다.\r\n`);
                }
            });
        }
        if(check){
            dispatch({type : SAVE_FAIL,
                payload : {
                  msg : msg
                }        
             });
            messageService.sendMessage("SaveFail", msg);
        }else{
            ipcRenderer.send('save', type,  getState().data[getState().updateNum-1]);
        }
    }  
    else   ipcRenderer.send('save', type,  getState().data[getState().updateNum-1][type]);
}

export const saved = () => dispatch=>{
    dispatch({type:SAVE_SUCCESS});
    messageService.sendMessage("저장", "성공적으로 저장되었습니다");
}
export const isLoading = (state) =>{

    return { 
        type: LOADING, 
        payload : { 
            state : state,
        }
    }
}


const initState = { 
    updateNum : 0,
    data : [], 
    gpsLogData : [],
    isLoading : false, 
};

export default function reducer(state = initState, {type, payload }){
    switch(type){ 
        case INIT : 
            state = { 
                updateNum : 0,
                data : [],
                gpsLogData: [],
                isLoading : false,
            }
            return {...state};
        case LOADING :
            state.isLoading = true;
            return {...state};
        
        case LOAD : 
            return {...state, isLoading:true}
        case LOAD_SUCCESS : 
            console.log(payload.data);
            state.data.push(JSON.parse(JSON.stringify(payload.data)));
            return {...state, updateNum : state.data.length, isLoading:false};
        case GPS_LOAD_SUCCESS: 
            console.log(payload.data);
            console.log(state);
            state.gpsLogData = JSON.parse(JSON.stringify(payload.data));
            console.log(state);
            return {...state, updateNum : state.data.length, isLoading:false};
        case LOAD_FAIL :
            return {...state, isLoading:false}
        case UPDATE : 
            var findData = state.data[state.updateNum-1][payload.data.group].find(
                (prod) => {
                    if(prod.ID === payload.id) return prod;
                }
            );
            if(findData !== null && typeof(findData)!== 'undefined'){
                Object.entries(payload.data).map(([attKey, attValue])=>{
                    if(attKey === "geometry"|| attKey === "group"){
                        return ;
                    }else{
                        findData[attKey] = attValue;
                    }
                });
                findData.PointXY=payload.data.geometry.flatCoordinates.map(parseFloat).division(2);
                if(payload.data.group!=="LAYER_POI" && payload.data.group!=="LAYER_LN_NODE") findData.NumPoint=findData.PointXY.length;
                if(payload.data.group==="LAYER_ROADLIGHT" || payload.data.group==="LAYER_ROADMARK") findData.NumStopLine=findData.StopLineID.length;
            }
            return {...state};

        case ADD : 
            const maxValueOfId = Math.max(...state.data[state.data.length-1][payload.feature.get("group")].map(o=>o.ID),0)+1
            payload.feature.setId(payload.feature.get("group")+"_"+maxValueOfId);
            payload.feature.set('ID', maxValueOfId);
            var data = payload.feature.getProperties();
            var addObject = {};
            
            Object.entries(data).map(([attKey, attValue])=>{
               if(attKey==="group" || attKey==="geometry") return; 
                addObject[attKey] = attValue;
            });
            addObject['PointXY'] = data.geometry.flatCoordinates.map(parseFloat).division(2);
            if(payload.feature.get("group")!=="LAYER_POI" && payload.feature.get("group")!=="LAYER_LN_NODE") addObject.NumPoint=addObject.PointXY.length;

            state.data[state.data.length-1][payload.feature.get("group")].push(addObject);
            return {...state};
        case ADDS : 
            
                let snodeId = Math.max(...state.data[state.data.length-1][payload.features.snode.get("group")].map(o=>o.ID),0)+1
                payload.features.snode.setId(payload.features.snode.get("group")+"_"+snodeId);
                payload.features.snode.set('ID', snodeId);
                let enodeId = Math.max(...state.data[state.data.length-1][payload.features.snode.get("group")].map(o=>o.ID),0)+2
                payload.features.enode.setId(payload.features.enode.get("group")+"_"+enodeId);
                payload.features.enode.set('ID', enodeId);
                let linkId = Math.max(...state.data[state.data.length-1][payload.features.link.get("group")].map(o=>o.ID),0)+1
                payload.features.link.setId(payload.features.link.get("group")+"_"+linkId);
                payload.features.link.set('ID', linkId);
                payload.features.link.set('SNodeID', snodeId);
                payload.features.link.set('ENodeID', enodeId);
                payload.features.snode.set('LinkID', [linkId]);
                payload.features.snode.set('NumConLink',1);
                payload.features.enode.set('LinkID', [linkId]);
                payload.features.enode.set('NumConLink',1);

                var link_data = payload.features.link.getProperties();
                var link = {};
                Object.entries(link_data).map(([attKey, attValue])=>{
                    if(attKey==="group" || attKey==="geometry") return; 
                    link[attKey] = attValue;
                });
                link['PointXY'] = link_data.geometry.flatCoordinates.map(parseFloat).division(2);
                link.NumPoint=link.PointXY.length;
                var snode_data = payload.features.snode.getProperties();
                var snode = {};
                Object.entries(snode_data).map(([attKey, attValue])=>{
                    if(attKey==="group" || attKey==="geometry") return; 
                    snode[attKey] = attValue;
                });
                snode['PointXY'] = snode_data.geometry.flatCoordinates.map(parseFloat).division(2);

                var enode_data = payload.features.enode.getProperties();
                var enode = {};
                Object.entries(enode_data).map(([attKey, attValue])=>{
                    if(attKey==="group" || attKey==="geometry") return; 
                    enode[attKey] = attValue;
                });
                enode['PointXY'] = enode_data.geometry.flatCoordinates.map(parseFloat).division(2);

                state.data[state.data.length-1][payload.features.link.get("group")].push(link);
                state.data[state.data.length-1][payload.features.snode.get("group")].push(snode);
                state.data[state.data.length-1][payload.features.enode.get("group")].push(enode);

            return {...state};
        case RESET : 
            var data = payload.feature.getProperties();
            var addObject = {};
            Object.entries(data).map(([attKey, attValue])=>{
                if(attKey==="group" || attKey==="geometry") return; 
                 addObject[attKey] = attValue;
             });
            addObject['PointXY'] = data.geometry.flatCoordinates.map(parseFloat).division(2);
            if(payload.feature.get("group")!=="LAYER_POI" && payload.feature.get("group")!=="LAYER_LN_NODE") addObject.NumPoint=addObject.PointXY.length;
            state.data[state.data.length-1][payload.feature.get("group")].push(addObject);

            let sorting = state.data[state.data.length-1][payload.feature.get("group")].sort(function (a,b){
                return a.ID - b.ID;
            })
            state.data[state.data.length-1][payload.feature.get("group")] = sorting;
            return {...state};
        case DELETE : 
            let arr = state.data[state.data.length-1][payload.feature.get("group")].filter((element) => element.ID !== payload.feature.get("ID"));
            state.data[state.data.length-1][payload.feature.get("group")] = arr;
            return {...state};

        case SAVE : 
            return { ...state, isLoading : true};
        case SAVE_SUCCESS: 
            return {...state, isLoading:false}; 
        case SAVE_FAIL: 
            
            return {...state, isLoading:false};
        default : 
            return {...state};
    }

};