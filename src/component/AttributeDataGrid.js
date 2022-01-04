import { AgGridReact } from 'ag-grid-react/lib/agGridReact';
import { AgGridColumn } from 'ag-grid-react/lib/shared/agGridColumn';
import { useEffect, useState } from 'react';
import  DataGrid, { TextEditor}  from 'react-data-grid';
import 'ag-grid-community/dist/styles/ag-grid.css';
import 'ag-grid-community/dist/styles/ag-theme-alpine.css';
import { gridService, mapService, messageService } from '../service/message.service';



function numberParser(params) {
  var newValue = Number(params.newValue);
  if(isNaN(newValue)){ 
    messageService.sendMessage("취소","숫자만 입력 할 수 있습니다.");
    return params.oldValue;
  }
  
  else    return Number(params.newValue);
}

function textParaser(params){ 
  return params.newValue.trim().replaceAll(" ","");
}

function speedParser(params){
  var newValue = Number(params.newValue);
  if(isNaN(newValue)){ 
    messageService.sendMessage("취소","숫자만 입력 할 수 있습니다.");
    return params.oldValue;
  }
  if(newValue<1 || newValue>200){
    messageService.sendMessage("취소","Speed의 범위는 1~200입니다.");
    return params.oldValue;
  }

  return newValue;
}

function arrayParser(params){

  // console.log(params.newValue);
  // // var param = params.trim();
  // var arr = params.newValue.split(',');
  // return arr.map(numberParser);
}

function AgCustomColumn(dataKey, row){
  if(row.editor === "agTextCellEditor") return <AgGridColumn key={dataKey} filter={ true }  field={row.name} resizable={true}  cellEditor = {row.editor} editable={row.editable} valueParser={row.valueParser}/>
  if(row.editor === "agSelectCellEditor") return <AgGridColumn key={dataKey} filter={ true }  field={row.name} resizable={true}  cellEditor = {row.editor} editable={row.editable} cellEditorParams={{values:row.editorParams}}/>
  if(row.editor === "agLargeTextCellEditor") return <AgGridColumn key={dataKey} filter={ true }  field={row.name} resizable={true}  cellEditor = {row.editor} editable={row.editable} valueParser={row.valueParser}/>
}
function AttributeDataGrid ({dataKey,rows, updateState, rowIndex}){ 
  const [gridApi, setGridApi] = useState(null);
  const [gridColumnApi, setGridColumnApi] = useState(null);


  useEffect(()=>{
    let subscription = gridService.getMessage().subscribe(message => {
      console.log(message);
    })
    return () =>{
      subscription.unsubscribe();
    }
  },[]);
  function idParser(params){
    var newValue = Number(params.newValue);
    if(isNaN(newValue)){ 
      messageService.sendMessage("취소","숫자만 입력 할 수 있습니다.");
      return params.oldValue;
    }
    let ids = [];
    gridApi.forEachNode((node) =>{
      if(params.node===node) return;
      ids.push(node.data['ID'])
    });
    if(ids.indexOf(newValue)>-1){
      messageService.sendMessage("취소","이미 존재하는 ID로는 변경 할 수 없습니다.");
      return params.oldValue;
    }
    return Number(params.newValue);
  }
  function linkIdParser(params) {
    var newValue = Number(params.newValue);
    if(isNaN(newValue)){ 
      messageService.sendMessage("취소","숫자만 입력 할 수 있습니다.");
      return params.oldValue;
    }
    if(newValue===0){return newValue;}
    var selfId = Number(params.node.data["ID"]);
    if(newValue===selfId){ 
      messageService.sendMessage("취소","자신의 ID를 입력 할 수 없습니다.");
      return params.oldValue;
    }
    let ids = [];
    gridApi.forEachNode((node) =>{
      ids.push(node.data['ID'])
    });
    if(ids.indexOf(newValue)<0){
      messageService.sendMessage("취소","존재하지 않는 ID입니다.");
      return params.oldValue;
    }
    return Number(params.newValue);
  }

  function arryParser(params){
    if(params.newValue === params.oldValue) return params.newValue;
    if(typeof params.newValue ==="undefined") return params.oldValue;
    var value = params.newValue.trim();
    var arrs = [...new Set(value.split(','))];

    var check = false; 
    var message = ""; 
    var newValue = arrs.map((arr)=>{
      if(isNaN(Number(arr))){
        check = true; 
        message = "숫자만 입력 할 수 있습니다.";
      }else{
        return Number(arr);
      }
    }).filter((element) => element !== 0);
    if(newValue.length<1){
      return [];
    }
    if(check){
      messageService.sendMessage("취소",message);
      return params.oldValue;
    };
    return [...newValue];
  }
  function stopLineParser(params) {
    if(params.newValue === params.oldValue) return params.newValue;
    if(typeof params.newValue ==="undefined") return params.oldValue;
    // if(params.oldValue)
    var value = params.newValue.trim();
    var arrs = [...new Set(value.split(','))];
    
    var selfId = params.data['ID'];
    var check = false; 
    var message = ""; 
    var newValue = arrs.map((arr)=>{
      if(isNaN(Number(arr))){
        check = true; 
        message = "숫자만 입력 할 수 있습니다.";
      }else{
        return Number(arr);
      }
    }).filter((element) => element !== 0);
    if(newValue.length<1){
      return [];
    }
    if(check ){
      messageService.sendMessage("취소",message);
      return params.oldValue;
    };
    
    let ids = [];
    gridApi.forEachNode((node) =>{
      if(node.data['Type']==='RM_STOPLINE'){
        ids.push(node.data['ID']);
      }
    });
    newValue.map((arr)=>{
      if(arr===selfId){ 
        check = true; 
        message = "자신의 ID를 입력 할 수 없습니다.";
      }
      if(ids.indexOf(arr)<0){
        check = true; 
        message = "존재하지 않는 ID이거나 해당 ID의 Type 이 StopLine이 아닙니다.";
      }
    });
    
    if(check){
      messageService.sendMessage("취소",message);
      return params.oldValue;
    };
    // params.data['NumStopLine'] = arrs.length;
    return [...newValue];
  }
  function pointXYParser(params){
    return params.oldValue;
  }
  const columns = {
    LAYER_LANESIDE:
    [
    {key: 'ID', name: 'ID' , editor: "agTextCellEditor" , valueParser: idParser,editable: (true&&updateState)},
    {key: 'MID',name: 'MID',   editor: "agTextCellEditor", valueParser: numberParser,editable: (true&&updateState)},
    {key: 'LaneID',name: 'LaneID',  editor: "agTextCellEditor", valueParser: numberParser,editable: (true&&updateState)},
    {key: 'Type',name: 'Type',    editor: "agSelectCellEditor", editorParams : ['LS_SOLID','LS_DOT','LS_DOUBLE','LS_BOUNDARY','LS_VIRTUAL'], editable: (true&&updateState)},
    {key: 'Color',name: 'Color',  editor: "agSelectCellEditor", editorParams : ['LS_WHITE','LS_YELLOW','LS_BLUE'], editable: (true&&updateState)},
    {key: 'NumPoint',name: 'NumPoint',    editor: "agTextCellEditor", valueParser: numberParser,editable: false},
    {key: 'PointXY',name: 'PointXY',   editor: "agLargeTextCellEditor", valueParser:pointXYParser ,editable: (true&&updateState)},
  ],
    LAYER_LN_LINK : 
    [
      {key: 'ID', name: 'ID' , editor: "agTextCellEditor" , valueParser: idParser,editable: (true&&updateState)},
      {key: 'MID', name: 'MID' , editor: "agTextCellEditor" , valueParser: numberParser,editable: (true&&updateState)},
      {key: 'LID', name: 'LID' , editor: "agTextCellEditor" , valueParser: numberParser,editable: (true&&updateState)},
      {key: 'RID', name: 'RID' , editor: "agTextCellEditor" , valueParser: numberParser,editable: (true&&updateState)},
      {key: 'InMID', name: 'InMID' , editor: "agTextCellEditor" , valueParser: numberParser,editable: (true&&updateState)},
      {key: 'InLID', name: 'InLID' , editor: "agTextCellEditor" , valueParser: numberParser,editable: (true&&updateState)},
      {key: 'outMID', name: 'outMID' , editor: "agTextCellEditor" , valueParser: numberParser,editable: (true&&updateState)},
      {key: 'outLID', name: 'outLID' , editor: "agTextCellEditor" , valueParser: numberParser,editable: (true&&updateState)},
      {key: 'outRID', name: 'outRID' , editor: "agTextCellEditor" , valueParser: numberParser,editable: (true&&updateState)},
      {key: 'Junction', name: 'Junction' , editor: "agTextCellEditor" , valueParser: numberParser,editable: (true&&updateState)},
      {key: 'Type', name: 'Type' , editor: "agSelectCellEditor", editorParams : ['LANE_TYPE_NONE','GEN_S','JUN_S','JUN_L','JUN_R','JUN_U','POCKET_L','POCKET_R','JUN_UNPROTECTED_L'], editable: (true&&updateState)},
      {key: 'Sub_Type', name: 'Sub_Type' , editor: "agSelectCellEditor", editorParams : ['GEN','BUS_ONLY','HIGHPASS','TURNAL'], editable: (true&&updateState)},
      {key: 'Twoway', name: 'Twoway' , editor: "agSelectCellEditor", editorParams : ['양방향','일방'], editable: (true&&updateState)},
      {key: 'RLID', name: 'RLID' , editor: "agTextCellEditor" , valueParser: numberParser,editable: (true&&updateState)},
      {key: 'LLinkID', name: 'LLinkID' , editor: "agTextCellEditor" , valueParser: linkIdParser,editable: (true&&updateState)},
      {key: 'RLinkID', name: 'RLinkID' , editor: "agTextCellEditor" , valueParser: linkIdParser,editable: (true&&updateState)},
      {key: 'SNodeID', name: 'SNodeID' , editor: "agTextCellEditor" , valueParser: numberParser,editable: false},
      {key: 'ENodeID', name: 'ENodeID' , editor: "agTextCellEditor" , valueParser: numberParser,editable: false},
      {key: 'Speed', name: 'Speed' , editor: "agTextCellEditor" , valueParser: speedParser,editable: (true&&updateState)},
      {key: 'NumPoint', name: 'NumPoint' , editor: "agTextCellEditor" , valueParser: numberParser,editable: false},
      {key: 'PointXY', name: 'PointXY' , editor: "agLargeTextCellEditor", valueParser:pointXYParser, editable: (true&&updateState)},
    ],
    LAYER_LN_NODE : 
    [
      {key: 'ID', name: 'ID' , editor: "agTextCellEditor" ,valueParser: idParser,editable: (true&&updateState)},
      {key: 'NumConLink', name: 'NumConLink' , editor: "agTextCellEditor" ,valueParser: numberParser,editable: false},
      {key: 'LinkID', name: 'LinkID' , editor: "agTextCellEditor" ,valueParser: arrayParser,editable: false},
      {key: 'PointXY', name: 'PointXY' , editor: "agLargeTextCellEditor", valueParser:pointXYParser, editable: (true&&updateState)},
    ],
    LAYER_POI : 
    [
      {key: 'ID', name: 'ID' , editor: "agTextCellEditor" , valueParser: idParser,editable: (true&&updateState)},
      {key: 'LinkID', name: 'LinkID' , editor: "agTextCellEditor" , valueParser: numberParser,editable: (true&&updateState)},
      {key: 'Name', name: 'Name' , editor: "agTextCellEditor" , valueParser: textParaser,editable: (true&&updateState)},
      {key: 'PointXY', name: 'PointXY' , editor: "agLargeTextCellEditor", valueParser:pointXYParser, editable: (true&&updateState)},
    ],
    LAYER_ROADLIGHT : 
    [
      {key: 'ID', name: 'ID' , editor: "agTextCellEditor" , valueParser: idParser,editable: (true&&updateState)},
      {key: 'LaneID', name: 'LaneID' , editor: "agTextCellEditor" , valueParser: numberParser,editable: (true&&updateState)},
      {key: 'Type', name: 'Type' , editor: "agSelectCellEditor", editorParams : ['RL_HOR','RL_VIR'], editable: (true&&updateState)},
      {key: 'SubType', name: 'SubType' , editor: "agSelectCellEditor", editorParams : ['RL_2','RL_3','RL_4','RL_5'], editable: (true&&updateState)},
      {key: 'Div', name: 'Div' , editor: "agSelectCellEditor", editorParams : ['None','GEN_RL','BUS_RL'], editable: (true&&updateState)},
      {key: 'NumStopLine', name: 'NumStopLine' , editor: "agTextCellEditor" , valueParser: numberParser,editable: (true&&updateState)},
      {key: 'StopLineID', name: 'StopLineID' , editor: "agTextCellEditor" , valueParser: arryParser,editable: (true&&updateState)},
      {key: 'NumPoint', name: 'NumPoint' , editor: "agTextCellEditor" , valueParser: numberParser,editable: false},
      {key: 'PointXY', name: 'PointXY' , editor: "agLargeTextCellEditor", valueParser:pointXYParser, editable: (true&&updateState)},
    ],
    LAYER_ROADMARK:
    [
      {key: 'ID', name: 'ID' , editor: "agTextCellEditor" , valueParser: idParser,editable: (true&&updateState)},
      {key: 'Type', name: 'Type' , editor: "agSelectCellEditor", editorParams : ['RM_CROSSWALK','RM_SPEEDBUMP','RM_ARROW','RM_NUMERIC','RM_CHAR','RM_SHAPE','RM_STOPLINE','RM_BUSSTOP','RM_VIRTUAL_STOPLINE'], editable: (true&&updateState)},
      {key: 'SubType', name: 'SubType' , editor: "agSelectCellEditor", editorParams : ['None','RM_ARROW_S','RM_ARROW_L','RM_ARROW_R','RM_ARROW_SL','RM_ARROW_SR','RM_ARROW_U','RM_ARROW_US','RM_ARROW_UL','RM_ARROW_LR','RM_ARROW_FORBID_L','RM_ARROW_FORBID_R','RM_ARROW_FORBID_S','RM_ARROW_FORBID_U','RM_STOPLINE_UNSIGNED_INTERSECTION'], editable: (true&&updateState)},
      {key: 'NumStopLine', name: 'NumStopLine' , editor: "agTextCellEditor" , valueParser: numberParser,editable: false},
      {key: 'StopLineID', name: 'StopLineID' , editor: "agTextCellEditor" , valueParser:stopLineParser,  editable: (true&&updateState)},
      {key: 'NumPoint', name: 'NumPoint' , editor: "agTextCellEditor" , valueParser: numberParser,editable: false},
      {key: 'PointXY', name: 'PointXY' , editor: "agLargeTextCellEditor", valueParser:pointXYParser, editable: (true&&updateState)},
    ],
    GPS_LOG : 
    [
      {key: 'ID', name: 'ID' , editor: "agTextCellEditor" , valueParser: idParser,editable: (true&&updateState)},
      {key: 'PointXY', name: 'PointXY' , editor: "agLargeTextCellEditor", valueParser:pointXYParser, editable: (true&&updateState)},
    ]
  };
  let selectedValue = null;
  const onGridReady = (params) => {
    setGridApi(params.api);
    setGridColumnApi(params.columnApi);
  };

  const onSelectionChanged = (e) => {
    // const selectedRows = gridApi.getSelectedRows();
      // selectedRows.length === 1 ? selectedRows[0].athlete : '';
  };
  const onRowSelected = (e) =>{
    if(!(true&&updateState))  return;
    if(e.node.isSelected()){
      mapService.moveMap(dataKey, e.node.data.ID)
    }
  }
  const onCellEditingStarted = (e) => {
    selectedValue = e.node.data['ID'];
  };

  const onCellEditingStopped = (e) => {
    if(e.oldValue === e.newValue) return;
    const dataId = e.colDef.field==="ID" ? e.oldValue : e.node.data.ID;
    const data =  {field : e.colDef.field, data : e.newValue};
    mapService.changeObject(dataKey, dataId, data);
  };

  // const onSelectionChanged = () => {
  //   const selectedRows = gridApi.getSelectedRows();
  //   document.querySelector('#selectedRows').innerHTML =
  //     selectedRows.length === 1 ? selectedRows[0].athlete : '';
  // };
    return ( 
      <div className="ag-theme-alpine" style={{height: 250, minWidth: '1200px'}}>
        <AgGridReact  rowData={rows} onSelectionChanged={onSelectionChanged} rowSelection={'single'} onRowSelected={onRowSelected}
        undoRedoCellEditing={false}
        onCellEditingStarted={onCellEditingStarted}
        onCellEditingStopped={onCellEditingStopped}
        onGridReady={onGridReady}
        stopEditingWhenCellsLoseFocus={true}
        >
           {columns[dataKey].map((row)=>{
            return AgCustomColumn(dataKey, row);
                   
           })}
        </AgGridReact>
  </div>
       
    )
}

export default AttributeDataGrid;