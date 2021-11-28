const { dialog, BrowserWindow, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');
const { webContents } = require('electron')

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

class HdMapDataDIR { 
    constructor(laneside, link, node, poi, roadlight, roadmark){ 
        this.LAYER_LANESIDE = laneside;
        this.LAYER_LN_LINK= link;
        this.LAYER_LN_NODE= node;
        this.LAYER_POI= poi;
        this.LAYER_ROADLIGHT= roadlight;
        this.LAYER_ROADMARK=roadmark;
    }
}

class LAYER_LANESIDE { 
    constructor(ID, MID, LaneID, Type, Color, NumPoint, PointXY){
        this.ID=Number(ID);
        this.MID = Number(MID);
        this.LaneID=Number(LaneID);
        this.Type=Number(Type)===1? "LS_SOLID" : Number(Type)===2? "LS_DOT" :  Number(Type)===3? "LS_DOUBLE" : Number(Type)===4? "LS_BOUNDARY" : Number(Type)===5 ? "LS_VIRTUAL" : null;
        this.Color=Number(Color)===0? "LS_WHITE" : Number(Color)===1? "LS_YELLOW" : Number(Color)===2? "LS_BLUE" : null;
        this.NumPoint=Number(NumPoint);
        this.PointXY=PointXY.map(parseFloat).division(2);
    }
}
class LAYER_LN_LINK{
    constructor(ID,MID,LID,RID,InMID,InLID,InRID,outMID,outLID,outRID,Junction,Type,Sub_Type,Twoway,RLID,LLinkID,RLinkID,SNodeID,ENodeID,Speed,NumPoint,PointXY){
        this.ID=Number(ID);
        this.MID=Number(MID);
        this.LID=Number(LID);
        this.RID=Number(RID);
        this.InMID=Number(InMID);
        this.InRID=Number(InRID);
        this.InLID=Number(InLID);
        this.outMID=Number(outMID);
        this.outLID=Number(outLID);
        this.outRID=Number(outRID);
        this.Junction=Number(Junction);
        this.Type=Number(Type)===0? "LANE_TYPE_NONE" : Number(Type)===1? "GEN_S" : Number(Type)===2? "JUN_S" :  Number(Type)===3? "JUN_L" : Number(Type)===4? "JUN_R" : Number(Type)===5 ? "JUN_U" : Number(Type)===6 ? "POCKET_L" : Number(Type)===7 ? "POCKET_R" : Number(Type)===8 ? "JUN_UNPROTECTED_L" :null;
        this.Sub_Type= Number(Sub_Type)===1? "GEN" : Number(Sub_Type)===2? "BUS_ONLY" : Number(Sub_Type)===3? "HIGHPASS" : Number(Sub_Type)===4? "TURNAL" :null;
        this.Twoway=Number(Twoway)===1? "양방향" : Number(Twoway)===0? "일방" :null;
        this.RLID=Number(RLID);
        this.LLinkID=Number(LLinkID);
        this.RLinkID=Number(RLinkID);
        this.SNodeID=Number(SNodeID);
        this.ENodeID=Number(ENodeID);
        this.Speed=Number(Speed);
        this.NumPoint=Number(NumPoint);
        this.PointXY=PointXY.map(parseFloat).division(2);
    }
}
class LAYER_LN_NODE{
    constructor(ID,NumConLink,LinkID,PointXY){
        this.ID=Number(ID);
        this.NumConLink=Number(NumConLink);
        this.LinkID=LinkID.map(Number);
        this.PointXY=PointXY.map(parseFloat).division(2);
    }
}
class LAYER_POI{
    constructor(ID,LinkID,Name,PointXY){
        this.ID=Number(ID);
        this.LinkID=Number(LinkID);
        this.Name=Name;
        this.PointXY=PointXY.map(parseFloat).division(2);
    }
}
class LAYER_ROADLIGHT{
    constructor(ID,LaneID,Type,SubType,Div,NumStopline,StoplineID,NumPoint,PointXY){
        this.ID=Number(ID);
        this.LaneID=Number(LaneID);
        this.Type=Number(Type)===1? "RL_HOR" : Number(Type)===2? "RL_VIR" : null;
        this.SubType=Number(SubType)===1? "RL_2" : Number(SubType)===2? "RL_3" : Number(SubType)===3? "RL_4" : Number(SubType)===4? "RL_5" :null;
        this.Div=Number(Div)===1? "GEN_RL" : Number(Div)===2? "BUS_RL" : 'None';
        this.NumStopline=Number(NumStopline);
        this.StoplineID=StoplineID.map(Number);
        this.NumPoint=Number(NumPoint);
        this.PointXY=PointXY.map(parseFloat).division(2);
    }
}
class LAYER_ROADMARK{ 
    constructor(ID,Type,SubType,NumStopLine,StopLineID,NumPoint,PointXY){
        this.ID=Number(ID);
        this.Type=Number(Type)===1? "RM_CROSSWALK" : Number(Type)===2? "RM_SPEEDBUMP" :  Number(Type)===3? "RM_ARROW" : Number(Type)===4? "RM_NUMERIC" : Number(Type)===5 ? "RM_CHAR" : Number(Type)===6 ? "RM_SHAPE" : Number(Type)===7 ? "RM_STOPLINE" : Number(Type)===8 ? "RM_BUSSTOP" : Number(Type)===9 ? "RM_VIRTUAL_STOPLINE" :null;
        this.SubType= Number(SubType)===1? "RM_ARROW_S" : Number(SubType)===2? "RM_ARROW_L" : Number(SubType)===3? "RM_ARROW_R" : Number(SubType)===4? "RM_ARROW_SL" :
                      Number(SubType)===5? "RM_ARROW_SR" : Number(SubType)===6? "RM_ARROW_U" : Number(SubType)===7? "RM_ARROW_US" : Number(SubType)===8? "RM_ARROW_UL" :
                      Number(SubType)===9? "RM_ARROW_LR" : Number(SubType)===10? "RM_ARROW_FORBID_L" : Number(SubType)===11? "RM_ARROW_FORBID_R" : Number(SubType)===12? "RM_ARROW_FORBID_S" :
                      Number(SubType)===13? "RM_ARROW_FORBID_U" : Number(SubType)===14? "RM_STOPLINE_UNSIGNED_INTERSECTION" :
                      "None";
        this.NumStopLine=Number(NumStopLine);
        this.StopLineID=StopLineID.map(Number);
        this.NumPoint=Number(NumPoint);
        this.PointXY=PointXY.map(parseFloat).division(2);
    }
}

const loadAll = (dir) =>{ 
    var files = fs.readdirSync(dir); // 디렉토리를 읽어온다
    let layers = new HdMapDataDIR();
    // webContents.getFocusedWebContents().send('test','test');

    let dataSet = { 
        INDEX : 0, 
        LAYER_LANESIDES : [], 
        LAYER_LN_LINK : [],
        LAYER_LN_NODE : [],
        LAYER_POI : [], 
        LAYER_ROADLIGHT : [],
        LAYER_ROADMARK : [],
    }
    let loadData = 0 ; 
    files.forEach((file)=>{
        loadDat=0;
        if((getExtensionOfFilename(file.toLowerCase())===".txt")&&(file.toUpperCase().includes("LAYER_LANESIDE"))){
            fs.readFileSync(dir + '/' + file,'utf-8').split('\r\n').forEach((array)=>{
                array = array.trim();
                if(array === "") return;
                dataSet.LAYER_LANESIDES.push(new LAYER_LANESIDE(array.split(' ')[0],array.split(' ')[1], array.split(' ')[2],array.split(' ')[3], array.split(' ')[4],array.split(' ')[5], array.split(' ').slice(6)));
            });
            layers.LAYER_LANESIDE = dir + '/' + file;
            loadData++;
        };
        
        if((getExtensionOfFilename(file.toLowerCase())===".txt")&&(file.toUpperCase().includes("LAYER_LN_LINK"))){
            fs.readFileSync(dir + '/' + file,'utf-8').split('\r\n').forEach((array)=>{
                array = array.trim();
                if(array === "") return;
                dataSet.LAYER_LN_LINK.push(new LAYER_LN_LINK(array.split(' ')[0],array.split(' ')[1], array.split(' ')[2],array.split(' ')[3], array.split(' ')[4],array.split(' ')[5], 
                                                             array.split(' ')[6],array.split(' ')[7],array.split(' ')[8],array.split(' ')[9],array.split(' ')[10],array.split(' ')[11],
                                                             array.split(' ')[12],array.split(' ')[13],array.split(' ')[14],array.split(' ')[15],array.split(' ')[16],array.split(' ')[17],
                                                             array.split(' ')[18],array.split(' ')[19],array.split(' ')[20],array.split(' ').slice(21)));
            });
            layers.LAYER_LN_LINK = dir + '/' + file;
            loadData++;
        }
        if((getExtensionOfFilename(file.toLowerCase())===".txt")&&(file.toUpperCase().includes("LAYER_LN_NODE"))){
            fs.readFileSync(dir + '/' + file,'utf-8').split('\r\n').forEach((array)=>{
                array = array.trim();
                if(array === "") return;
                var numConLink = Number(array.split(' ')[1]);
                var linkId = [] ; 
                for(var i=0; i<numConLink; i++){
                    linkId.push(array.split(' ')[2+i]);
                }
                dataSet.LAYER_LN_NODE.push(new LAYER_LN_NODE(array.split(' ')[0],array.split(' ')[1], linkId ,array.split(' ').slice(2+numConLink)));
            });
            layers.LAYER_LN_NODE = dir + '/' + file;
            loadData++;
        }
        if((getExtensionOfFilename(file.toLowerCase())===".txt")&&(file.toUpperCase().includes("LAYER_POI"))){
            fs.readFileSync(dir + '/' + file,'utf-8').split('\r\n').forEach((array)=>{
                array = array.trim();
                if(array === "") return;
                dataSet.LAYER_POI.push(new LAYER_POI(array.split(' ')[0],array.split(' ')[1], array.split(' ')[2],array.split(' ').slice(3)));
            });
            layers.LAYER_POI=dir + '/' + file;
            loadData++;
        }
        if((getExtensionOfFilename(file.toLowerCase())===".txt")&&(file.toUpperCase().includes("LAYER_ROADLIGHT"))){
            fs.readFileSync(dir + '/' + file,'utf-8').split('\r\n').forEach((array)=>{
                array = array.trim();
                if(array === "") return;
                var numStopline = Number(array.split(' ')[5]);
                var stoplineID = [];
                for(var i=0; i<numStopline; i++){
                    stoplineID.push(array.split(' ')[6+i]);
                }
                dataSet.LAYER_ROADLIGHT.push(new LAYER_ROADLIGHT(array.split(' ')[0],array.split(' ')[1], array.split(' ')[2],array.split(' ')[3],array.split(' ')[4],array.split(' ')[5],stoplineID,array.split(' ')[numStopline+6],array.split(' ').slice(7+numStopline)))
            });
            layers.LAYER_ROADLIGHT = dir + '/' + file;
            loadData++;
        };
        if((getExtensionOfFilename(file.toLowerCase())===".txt")&&(file.toUpperCase().includes("LAYER_ROADMARK"))){
            fs.readFileSync(dir + '/' + file,'utf-8').split('\r\n').forEach((array)=>{
                array = array.trim();    
                if(array === "") return;
                var numStopline = Number(array.split(' ')[3]);
                var stoplineID = [];
                for(var i=0; i<numStopline; i++){
                    stoplineID.push(array.split(' ')[4+i]);
                }
                dataSet.LAYER_ROADMARK.push(new LAYER_ROADMARK(array.split(' ')[0],array.split(' ')[1], array.split(' ')[2],array.split(' ')[3],stoplineID,array.split(' ')[4+numStopline],array.split(' ').slice(5+numStopline)))
            });
            layers.LAYER_ROADMARK = dir + '/' + file;
            loadData++;
        }

            // (getExtensionOfFilename(file.toLowerCase())===".txt")&&(file.toUpperCase().includes("LAYER_ROADMARK")) && (layers.LAYER_ROADMARK = file);
    });
    console.log(layers);
    if(loadData>0){
        fileList.push(layers);
        dataSet.INDEX = fileList.length; 
        webContents.fromId(1).send('loadAll', dataSet);
    } 
    else webContents.fromId(1).send('loadFail');
}




module.exports = { 
    loadAll, fileList
}