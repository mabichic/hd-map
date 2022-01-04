const { dialog, BrowserWindow, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');
const { webContents } = require('electron');
const { Console } = require('console');

/**
 * 파일명에서 확장자명 추출
 * @param filename   파일명
 * @returns _fileExt 확장자명
 */
 function getExtensionOfFilename(filename) {
    var _fileLen = filename.length;
    /** 
     * lastIndexOf('.') 
     * 뒤에서부터 '.'의 위치를 찾기위한 함수
     * 검색 문자의 위치를 반환한다.
     * 파일 이름에 '.'이 포함되는 경우가 있기 때문에 lastIndexOf() 사용
     */
    var _lastDot = filename.lastIndexOf('.');
    // 확장자 명만 추출한 후 소문자로 변경
    var _fileExt = filename.substring(_lastDot, _fileLen).toLowerCase();
    return _fileExt;
}


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

let layerSetList = [];
let fileList = []; 
let gpsFileList = [];
let fileState = { 
    load : false ,  // fals : 파일 로드 되지 않음, true : 파일 로드됨
    state : 0 ,     // 0 : 변화없음, 1 : 변화있음 
    saved : false,  //false : 저장안됨 , true : 저장됨 
    loadData : [], 
    LAYER_LANESIDE_PATH : null, 
    LAYER_LN_LINK_PATH : null, 
    LAYER_LN_NODE_PATH : null, 
    LAYER_POI_PATH : null, 
    LAYER_ROADLIGHT_PATH : null, 
    LAYER_ROADMARK_PATH : null, 
    GPS_LOG : null, 
}
class HdMapDataDIR { 
    constructor(laneside, link, node, poi, roadlight, roadmark, gpsLog){ 
        this.LAYER_LANESIDE = laneside;
        this.LAYER_LN_LINK= link;
        this.LAYER_LN_NODE= node;
        this.LAYER_POI= poi;
        this.LAYER_ROADLIGHT= roadlight;
        this.LAYER_ROADMARK=roadmark;
        this.GPS_LOG = gpsLog;
    }
}

class LAYER_LANESIDE { 
    constructor(array){
        
        this.ID=Number(array.split(' ')[0]);
        this.MID = Number(array.split(' ')[1]);
        this.LaneID=Number(array.split(' ')[2]);
        this.Type=Number(array.split(' ')[3])===1? "LS_SOLID" : Number(array.split(' ')[3])===2? "LS_DOT" :  Number(array.split(' ')[3])===3? "LS_DOUBLE" : Number(array.split(' ')[3])===4? "LS_BOUNDARY" : Number(array.split(' ')[3])===5 ? "LS_VIRTUAL" : null;
        this.Color=Number(array.split(' ')[4])===0? "LS_WHITE" : Number(array.split(' ')[4])===1? "LS_YELLOW" : Number(array.split(' ')[4])===2? "LS_BLUE" : null;
        this.NumPoint=Number(array.split(' ')[5]);
        this.PointXY=array.split(' ').slice(6).map(parseFloat).division(2);
    }
}
class LAYER_LANESIDE_CONV   { 
    constructor(data){
        this.ID=Number(data.ID);
        this.MID = Number(data.MID);
        this.LaneID=Number(data.LaneID);
        this.Type=data.Type === "LS_SOLID" ? 1 : data.Type === "LS_DOT" ? 2 : data.Type === "LS_DOUBLE" ? 3 : data.Type === "LS_BOUNDARY" ? 4 : data.Type === "LS_VIRTUAL" ? 5 : 0
        this.Color=data.Color==="LS_WHITE" ? 0 : data.Color==="LS_YELLOW" ? 1 : data.Color==="LS_BLUE" ? 2 : 0;
        this.NumPoint=Number(data.NumPoint);
        this.PointXY=data.PointXY.join(" ").replaceAll(",", " ");
    }
    conv = () =>(this.ID + " " + this.MID + " " + this.LaneID + " " + this.Type + " " + this.Color + " " +this.NumPoint + " " + this.PointXY + " " + "\r\n")
}

class LAYER_LN_LINK{
    constructor(array){
        this.ID=Number(array.split(' ')[0]);
        this.MID=Number(array.split(' ')[1]);
        this.LID=Number(array.split(' ')[2]);
        this.RID=Number(array.split(' ')[3]);
        this.InMID=Number(array.split(' ')[4]);
        this.InRID=Number(array.split(' ')[5]);
        this.InLID=Number(array.split(' ')[6]);
        this.outMID=Number(array.split(' ')[7]);
        this.outLID=Number(array.split(' ')[8]);
        this.outRID=Number(array.split(' ')[9]);
        this.Junction=Number(array.split(' ')[10]);
        this.Type=Number(array.split(' ')[11])===0? "LANE_TYPE_NONE" : Number(array.split(' ')[11])===1? "GEN_S" : Number(array.split(' ')[11])===2? "JUN_S" :  Number(array.split(' ')[11])===3? "JUN_L" : Number(array.split(' ')[11])===4? "JUN_R" 
                                                                     : Number(array.split(' ')[11])===5 ? "JUN_U" : Number(array.split(' ')[11])===6 ? "POCKET_L" : Number(array.split(' ')[11])===7 ? "POCKET_R" 
                                                                     : Number(array.split(' ')[11])===8 ? "JUN_UNPROTECTED_L" :null;
        this.Sub_Type= Number(array.split(' ')[12])===1? "GEN" : Number(array.split(' ')[12])===2? "BUS_ONLY" : Number(array.split(' ')[12])===3? "HIGHPASS" : Number(array.split(' ')[12])===4? "TURNAL" :null;
        this.Twoway=Number(array.split(' ')[13])===1? "양방향" : Number(array.split(' ')[13])===0? "일방" :null;
        this.RLID=Number(array.split(' ')[14]);
        this.LLinkID=Number(array.split(' ')[15]);
        this.RLinkID=Number(array.split(' ')[16]);
        this.SNodeID=Number(array.split(' ')[17]);
        this.ENodeID=Number(array.split(' ')[18]);
        this.Speed=Number(array.split(' ')[19]);
        this.NumPoint=Number(array.split(' ')[20]);
        this.PointXY=array.split(' ').slice(21).map(parseFloat).division(2);
    }
}
class LAYER_LN_LINK_CONV   { 
    constructor(data){
        this.ID=Number(data.ID);
        this.MID=Number(data.MID);
        this.LID=Number(data.LID);
        this.RID=Number(data.RID);
        this.InMID=Number(data.InMID);
        this.InRID=Number(data.InRID);
        this.InLID=Number(data.InLID);
        this.outMID=Number(data.outMID);
        this.outLID=Number(data.outLID);
        this.outRID=Number(data.outRID);
        this.Junction=Number(data.Junction);
        this.Type=data.Type==="GEN_S"?1:data.Type==="JUN_S"?2:data.Type==="JUN_L"?3:data.Type==="JUN_R"?4:data.Type==="JUN_U"?5:data.Type==="POCKET_L"?6:data.Type==="POCKET_R"?7:data.Type==="JUN_UNPROTECTED_L"?8:data.Type==="LANE_TYPE_NONE"?0:0;
        this.Sub_Type= data.Sub_Type==="GEN"?1:data.Sub_Type==="BUS_ONLY"?2:data.Sub_Type==="HIGHPASS"?3:data.Sub_Type==="TURNAL"?4:0;
        this.Twoway=data.Twoway==="양방향"?1:data.Twoway==="일방"?0:0;
        this.RLID=Number(data.RLID);
        this.LLinkID=Number(data.LLinkID);
        this.RLinkID=Number(data.RLinkID);
        this.SNodeID=Number(data.SNodeID);
        this.ENodeID=Number(data.ENodeID);
        this.Speed=Number(data.Speed);
        this.NumPoint=Number(data.NumPoint);
        this.PointXY=data.PointXY.join(" ").replaceAll(",", " ");
    }
    conv = () =>(this.ID + " " + this.MID + " " + this.LID + " " + this.RID + " " + this.InMID + " " + this.InRID + " " + this.InLID + " " + this.outMID + " " + this.outLID + " " + this.outRID + " " + this.Junction + " " + this.Type + " " + this.Sub_Type + " " + this.Twoway + " " + this.RLID + " " + this.LLinkID + " " + this.RLinkID + " " + this.SNodeID + " " + this.ENodeID + " " + this.Speed + " " + this.NumPoint + " " + this.PointXY + " " + "\r\n")
}

class LAYER_LN_NODE{
    constructor(array){
        var numConLink = Number(array.split(' ')[1]);
        var linkId = [] ; 
        for(var i=0; i<numConLink; i++){
            linkId.push(array.split(' ')[2+i]);
        }
        this.ID=Number(array.split(' ')[0]);
        this.NumConLink=Number(array.split(' ')[1]);
        this.LinkID=linkId.map(Number);
        this.PointXY=array.split(' ').slice(2+numConLink).map(parseFloat).division(2);
    }
}
class LAYER_LN_NODE_CONV { 
    constructor(data ){
        this.ID=Number(data.ID);
        this.NumConLink=Number(data.NumConLink);
        this.LinkID=data.LinkID.join(" ");
        this.PointXY=data.PointXY.join(" ").replaceAll(",", " ");
    }
    conv = () =>(this.ID + " " + this.NumConLink + " " + this.LinkID + " " + this.PointXY + " " + "\r\n");
}

class LAYER_POI{
    constructor(array){
        this.ID=Number(array.split(' ')[0]);
        this.LinkID=Number(array.split(' ')[1]);
        this.Name=array.split(' ')[2];
        this.PointXY=array.split(' ').slice(3).map(parseFloat).division(2);
    }
}
class LAYER_POI_CONV { 
    constructor(data ){
        this.ID=Number(data.ID);
        this.LinkID=Number(data.LinkID);
        this.Name=data.Name;
        this.PointXY=data.PointXY.join(" ").replaceAll(",", " ");
    }
    conv = () =>(this.ID + " " + this.LinkID + " " + this.Name + " " + this.PointXY + " " + "\r\n");
}
class LAYER_ROADLIGHT{
    constructor(array){
        var numStopline = Number(array.split(' ')[5]);
        var stoplineID = [];
        for(var i=0; i<numStopline; i++){
            stoplineID.push(array.split(' ')[6+i]);
        }
        this.ID=Number(array.split(' ')[0]);
        this.LaneID=Number(array.split(' ')[1]);
        this.Type=Number(array.split(' ')[2])===1? "RL_HOR" : Number(array.split(' ')[2])===2? "RL_VIR" : null;
        this.SubType=Number(array.split(' ')[3])===1? "RL_2" : Number(array.split(' ')[3])===2? "RL_3" : Number(array.split(' ')[3])===3? "RL_4" : Number(array.split(' ')[3])===4? "RL_5" :null;
        this.Div=Number(array.split(' ')[4])===1? "GEN_RL" : Number(array.split(' ')[4])===2? "BUS_RL" : 'None';
        this.NumStopLine=Number(numStopline);
        this.StopLineID=stoplineID.map(Number);
        this.NumPoint=Number(array.split(' ')[numStopline+6]);
        this.PointXY=array.split(' ').slice(7+numStopline).map(parseFloat).division(2);
    }
}
class LAYER_ROADLIGHT_CONV{
    constructor(data){
        this.ID=Number(data.ID);
        this.LaneID=Number(data.LaneID);
        this.Type=data.Type==="RL_HOR" ? 1 : data.Type==="RL_VIR" ? 2 : 0 
        this.SubType=data.SubType === "RL_2" ? 1 : data.SubType === "RL_3" ? 2 : data.SubType === "RL_4" ? 3 : data.SubType === "RL_5" ? 4 : 0
        this.Div=data.Div==="GEN_RL"?1 : data.Div==="BUS_RL"?2 : 0
        this.NumStopLine=Number(data.NumStopLine);
        this.StopLineID=data.StopLineID.join(" ");
        this.NumPoint=Number(data.NumPoint);
        this.PointXY=data.PointXY.join(" ").replaceAll(",", " ");
    }
    conv = () =>{
        var result ="";
        result += this.ID + " "; 
        result += this.LaneID + " ";
        result += this.Type + " ";
        result += this.SubType + " ";
        result += this.Div + " ";
        result += this.NumStopLine + " ";
        if(this.NumStopLine>0) result += this.StopLineID + " ";
        result += this.NumPoint + " " ;
        result += this.PointXY;
        result += "\r\n";   
        return result;
    }
}
class LAYER_ROADMARK{ 
    constructor(array){

        var numStopline = Number(array.split(' ')[3]);
        var stoplineID = [];
        for(var i=0; i<numStopline; i++){
            stoplineID.push(array.split(' ')[4+i]);
        }
        this.ID=Number(array.split(' ')[0]);
        this.Type=Number(array.split(' ')[1])===1? "RM_CROSSWALK" : Number(array.split(' ')[1])===2? "RM_SPEEDBUMP" :  Number(array.split(' ')[1])===3? "RM_ARROW" : Number(array.split(' ')[1])===4? "RM_NUMERIC" : Number(array.split(' ')[1])===5 ? "RM_CHAR" : Number(array.split(' ')[1])===6 ? "RM_SHAPE" : Number(array.split(' ')[1])===7 ? "RM_STOPLINE" : Number(array.split(' ')[1])===8 ? "RM_BUSSTOP" : Number(array.split(' ')[1])===9 ? "RM_VIRTUAL_STOPLINE" :null;
        this.SubType= Number(array.split(' ')[2])===1? "RM_ARROW_S" : Number(array.split(' ')[2])===2? "RM_ARROW_L" : Number(array.split(' ')[2])===3? "RM_ARROW_R" : Number(array.split(' ')[2])===4? "RM_ARROW_SL" :
                      Number(array.split(' ')[2])===5? "RM_ARROW_SR" : Number(array.split(' ')[2])===6? "RM_ARROW_U" : Number(array.split(' ')[2])===7? "RM_ARROW_US" : Number(array.split(' ')[2])===8? "RM_ARROW_UL" :
                      Number(array.split(' ')[2])===9? "RM_ARROW_LR" : Number(array.split(' ')[2])===10? "RM_ARROW_FORBID_L" : Number(array.split(' ')[2])===11? "RM_ARROW_FORBID_R" : Number(array.split(' ')[2])===12? "RM_ARROW_FORBID_S" :
                      Number(array.split(' ')[2])===13? "RM_ARROW_FORBID_U" : Number(array.split(' ')[2])===14? "RM_STOPLINE_UNSIGNED_INTERSECTION" :
                      "None";
        this.NumStopLine=Number(numStopline);
        this.StopLineID=stoplineID.map(Number);
        this.NumPoint=Number(stoplineID,array.split(' ')[4+numStopline]);
        this.PointXY=array.split(' ').slice(5+numStopline).map(parseFloat).division(2);
    }
}
class LAYER_ROADMARK_CONV{
    constructor(data){
        this.ID=Number(data.ID);
        this.Type=data.Type==="RM_CROSSWALK"?1:data.Type==="RM_SPEEDBUMP"?2:data.Type==="RM_ARROW"?3:data.Type==="RM_NUMERIC"?4:data.Type==="RM_CHAR"?5:data.Type==="RM_SHAPE"?6:data.Type==="RM_STOPLINE"?7:data.Type==="RM_BUSSTOP"?8:data.Type==="RM_VIRTUAL_STOPLINE"?9:0;
        this.SubType= data.SubType==="RM_ARROW_S"?1:data.SubType==="RM_ARROW_L"?2:data.SubType==="RM_ARROW_R"?3:data.SubType==="RM_ARROW_SL"?4:data.SubType==="RM_ARROW_SR"?5
                     :data.SubType==="RM_ARROW_U"?6:data.SubType==="RM_ARROW_US"?7:data.SubType==="RM_ARROW_UL"?8:data.SubType==="RM_ARROW_LR"?9:data.SubType==="RM_ARROW_FORBID_L"?10
                     :data.SubType==="RM_ARROW_FORBID_R"?11:data.SubType==="RM_ARROW_FORBID_S"?12:data.SubType==="RM_ARROW_FORBID_U"?13:data.SubType==="RM_STOPLINE_UNSIGNED_INTERSECTION"?14
                     :data.SubType==="None"?0:0;
        this.NumStopLine=Number(data.NumStopLine);
        this.StopLineID=data.StopLineID.join(" ");
        this.NumPoint=Number(data.NumPoint);
        this.PointXY=data.PointXY.join(" ").replaceAll(",", " ");
    }
    conv = () =>{
        var result ="";
        result += this.ID + " "; 
        result += this.Type + " ";
        result += this.SubType + " ";
        result += this.NumStopLine + " ";
        if(this.NumStopLine>0) result += this.StopLineID + " ";
        result += this.NumPoint + " " ;
        result += this.PointXY;
        result += "\r\n";   
        return result;
    }
}
class GPS_LOG{
    constructor(ID, array){
        this.ID = Number(ID);
        this.PointXY=array.map(parseFloat).division(2);
    }
}
const convSet = {
    LAYER_ROADMARK : LAYER_ROADMARK_CONV,
    LAYER_ROADLIGHT : LAYER_ROADLIGHT_CONV, 
    LAYER_LANESIDE : LAYER_LANESIDE_CONV,
    LAYER_POI : LAYER_POI_CONV,
    LAYER_LN_LINK : LAYER_LN_LINK_CONV,
    LAYER_LN_NODE : LAYER_LN_NODE_CONV
}
const objectSet = { 
    LAYER_ROADMARK : LAYER_ROADMARK,
    LAYER_ROADLIGHT : LAYER_ROADLIGHT, 
    LAYER_LANESIDE : LAYER_LANESIDE,
    LAYER_POI : LAYER_POI,
    LAYER_LN_LINK : LAYER_LN_LINK,
    LAYER_LN_NODE : LAYER_LN_NODE
}
const fileToObject = (layerNm, dataSet, filePath)=>{
    fs.readFileSync(filePath,'utf-8').split('\r\n').forEach((array)=>{
        array = array.trim();
        if(array === "") return;

        dataSet[layerNm].push(new objectSet[layerNm](array));
    });
}
const load = (type, filePath) =>{ 
    webContents.fromId(1).send('load');

    let files = []; 
    let dir; 

    if(type==='all'){ 
        dir = filePath;
        files = fs.readdirSync(dir);
    }else if(type='file'){
        filePath.forEach((file)=>{
            dir = path.dirname(file);
            files.push(path.basename(file));
        });
    }
    let layers = new HdMapDataDIR();

    let dataSet = { 
        INDEX : 0, 
        LAYER_LANESIDE : [], 
        LAYER_LN_LINK : [],
        LAYER_LN_NODE : [],
        LAYER_POI : [], 
        LAYER_ROADLIGHT : [],
        LAYER_ROADMARK : [],
    }
    let loadData = 0 ; 
    let loadDataCheck = {
        CHECK : false,          // 파일 중복에 문제가 없으면 False 중복문제가 있으면 TRUE 
        LAYER_LANESIDE : 0,
        LAYER_LN_LINK : 0,
        LAYER_LN_NODE : 0,
        LAYER_POI :0,
        LAYER_ROADLIGHT : 0,
        LAYER_ROADMARK : 0,
    }
    let beforeFileState = JSON.parse(JSON.stringify(fileState));

    files.forEach((file)=>{
        loadDat=0;
        ['LAYER_LANESIDE','LAYER_LN_LINK','LAYER_LN_NODE','LAYER_POI','LAYER_ROADLIGHT','LAYER_ROADMARK'].forEach((layerNM)=>{
            if((getExtensionOfFilename(file.toLowerCase())===".txt")&&(file.toUpperCase().includes(layerNM))){
                fileToObject(layerNM, dataSet, dir + '/' + file);
                layers[layerNM] = dir + '/' + file;
                loadData++;
                loadDataCheck[layerNM]++;
                if(loadDataCheck[layerNM]===1){
                    fileState.load = true;
                    fileState.loadData.push(layerNM);
                    fileState[layerNM + '_PATH'] = dir + '/' + file;
                }else if(loadDataCheck[layerNM]>1){
                    loadDataCheck['CHECK'] = true;
                }
            };
        });
    });
    
    if(loadData>0){
        
        
        if(typeof(layers.LAYER_LANESIDE) === "undefined") delete dataSet["LAYER_LANESIDE"];
        if(typeof(layers.LAYER_LN_LINK) === "undefined") delete dataSet["LAYER_LN_LINK"];
        if(typeof(layers.LAYER_LN_NODE) === "undefined") delete dataSet["LAYER_LN_NODE"];
        if(typeof(layers.LAYER_POI) === "undefined") delete dataSet["LAYER_POI"];
        if(typeof(layers.LAYER_ROADLIGHT) === "undefined") delete dataSet["LAYER_ROADLIGHT"];
        if(typeof(layers.LAYER_ROADMARK) === "undefined") delete dataSet["LAYER_ROADMARK"];
        if( (typeof(layers.LAYER_LN_LINK) === "undefined") ^ (typeof(layers.LAYER_LN_NODE) === "undefined") ){
            fileState = beforeFileState = JSON.parse(JSON.stringify(beforeFileState));
            webContents.fromId(1).send('loadFail', 'Node or Link가 존재하지 않습니다. Node,Link는 같은 폴더에 있어야 합니다.');        
        }else if(loadDataCheck['CHECK']) {
            fileState = beforeFileState = JSON.parse(JSON.stringify(beforeFileState));
            webContents.fromId(1).send('loadFail', "폴더 내 중복된 데이터셋이 있습니다. 확인하시고 다시 로드해주시길 바랍니다."); 
        }else{
            fileList.push(layers);
            dataSet.INDEX = fileList.length; 
            webContents.fromId(1).send('loadSuccess', dataSet);
        }
    } 
    else {
        fileState = beforeFileState = JSON.parse(JSON.stringify(beforeFileState));
        webContents.fromId(1).send('loadFail', "데이터 셋이 존재하지 않습니다.");
    }
}
const gpsLoad = (filePath) =>{
    let dataSet = { 
        INDEX : 0, 
        GPS_LOG : [],
    }

    webContents.fromId(1).send('load');
    
    
    let pointXY = [];
    let layers = new HdMapDataDIR();
    filePath.forEach((file)=>{
        var splitText = path.extname(file) === '.csv' ? ',' : ' ';
        fs.readFileSync(file,'utf-8').split('\r\n').forEach((array)=>{
            if(array === "") return;
            array.split(splitText).forEach((cor)=>{
                pointXY.push(Number(cor)); 
            });
        });
        layers.GPS_LOG=file;
    });
    if(pointXY.length>0){
        dataSet['GPS_LOG'].push(new GPS_LOG(gpsFileList.length, pointXY));
        // if(gpsFileList.length>0){
            // gpsFileList[gpsFileList.length-1].GPS_LOG = layers.GPS_LOG; 
        // }else{
            gpsFileList.push(layers);
        // }
        console.log(gpsFileList);
        dataSet.INDEX = gpsFileList.length; 
        webContents.fromId(1).send('gpsLoadSuccess', dataSet);
    }else{
        webContents.fromId(1).send('loadFail', "GPS LOG 데이터가 존재하지 않습니다.");
    }
};
const save = (type) =>{
    
    if(fileList.length<1 ){
        webContents.fromId(1).send('SaveFail', "로드된 데이터셋이 없습니다.");
        return;
    }
    if(type==='all'){

    }
    if(type==='LAYER_LANESIDE'){
        if(typeof(fileList[fileList.length-1].LAYER_LANESIDE)==='undefined'){
            webContents.fromId(1).send('SaveFail', "로드된 'LANESIDE' 데이터셋이 없습니다.");   
            return;
        }
    }
    if(type==='LinkNodeSet'){
        if(typeof(fileList[fileList.length-1].LAYER_LN_LINK)==='undefined'||typeof(fileList[fileList.length-1].LAYER_LN_NODE)==='undefined'){
            webContents.fromId(1).send('SaveFail', "로드된 'LINK, NODE' 데이터셋이 없습니다.");   
            return;
        }
    }
    if(type==='LAYER_LN_LINK'){
        if(typeof(fileList[fileList.length-1].LAYER_LN_LINK)==='undefined'){
            webContents.fromId(1).send('SaveFail', "로드된 'LINK' 데이터셋이 없습니다.");   
            return;
        }   
    }
    if(type==='LAYER_LN_NODE'){
        if(typeof(fileList[fileList.length-1].LAYER_LN_NODE)==='undefined'){
            webContents.fromId(1).send('SaveFail', "로드된 'NODE' 데이터셋이 없습니다.");   
            return;
        }
    }
    if(type==='LAYER_ROADMARK'){
        if(typeof(fileList[fileList.length-1].LAYER_ROADMARK)==='undefined'){
            webContents.fromId(1).send('SaveFail', "로드된 'ROAD MARK' 데이터셋이 없습니다.");   
            return;
        }    
    }
    if(type==='LAYER_ROADLIGHT'){
        if(typeof(fileList[fileList.length-1].LAYER_ROADLIGHT)==='undefined'){
            webContents.fromId(1).send('SaveFail', "로드된 'ROAD LIGHT' 데이터셋이 없습니다.");   
            return;
        }    
    }
    if(type==='LAYER_POI'){
        if(typeof(fileList[fileList.length-1].LAYER_POI)==='undefined'){
            webContents.fromId(1).send('SaveFail', "로드된 'POI' 데이터셋이 없습니다.");   
            return;
        }    
    }
    webContents.fromId(1).send('save', type);

    
    // try { 
    //     fs.writeFileSync(dir, data, 'utf8');
    // }  catch(err){
    //     webContents.fromId(1).send('saveFail', err);
    // }
};

const convResult = (data, type) =>{
    var txt ="";
    data.forEach((x)=>{
        var conv = new convSet[type](x);
        txt+=conv.conv();
    });
    return txt;
};
ipcMain.on("save", (event, type, data )=>{
    if(type==='all'){
        var fsList = [];
        Object.entries(fileList[fileList.length-1]).map(([attKey, attValue])=>{
            if(typeof(attValue) === 'undefined') return;
            var obj = {};
            obj.nodeDir = attValue;
            obj.nodeTxt = convResult(data[attKey], attKey);
            fsList.push(obj);
        });
        try {
            fsList.forEach((obj)=>{
                fs.writeFileSync(obj.nodeDir, obj.nodeTxt, 'utf8');
            });
            fileState.saved = true;
            webContents.fromId(1).send('saved');
        } catch(e){
            fileState.saved = false;
            webContents.fromId(1).send('saveFail', err);
        }
    }else if(type==="LinkNodeSet"){
        var nodeDir = fileList[fileList.length-1]["LAYER_LN_NODE"];
        var nodeTxt = convResult(data["LAYER_LN_NODE"], "LAYER_LN_NODE");
        var linkDir = fileList[fileList.length-1]["LAYER_LN_LINK"];
        var linkTxt = convResult(data["LAYER_LN_LINK"], "LAYER_LN_LINK");
        try { 
            fs.writeFileSync(nodeDir, nodeTxt, 'utf8');
            fs.writeFileSync(linkDir, linkTxt, 'utf8');
            fileState.saved = true;
            webContents.fromId(1).send('saved');
        }  catch(err){
            fileState.saved = false;
            webContents.fromId(1).send('saveFail', err);
        }
    }else{
        var txt ="";
        txt= convResult(data, type);

        var dir = fileList[fileList.length-1][type]; 
        try { 
            fs.writeFileSync(dir, txt, 'utf8');
            fileState.saved = true;
            webContents.fromId(1).send('saved');
        }  catch(err){
            fileState.saved = false;
            webContents.fromId(1).send('saveFail', err);
        }
    }
});

const clear = () =>{
    fileList.length = 0;
    gpsFileList.length = 0;
    webContents.fromId(1).send('init');
}
module.exports = { 
    load,  fileList, clear, save, fileState, gpsLoad, gpsFileList
}