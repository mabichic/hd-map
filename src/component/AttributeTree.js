import * as React from 'react';
import TreeItem from '@mui/lab/TreeItem';
import { useSelector } from 'react-redux';
import { TreeState, TreeTable } from 'cp-react-tree-table';

import { TreeView } from '@mui/lab';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AttributeDataGrid from './AttributeDataGrid';
import { Box } from '@mui/system';
export default function AttributeTree() {
  const selector = useSelector((state)=>state);
  const renderTree = (nodes, updateNum) => {
    console.log(nodes?.length<1)
    if(nodes?.length<1) return "";

    console.log(nodes);
    return (
      <>
      {[...nodes]?.slice(0).reverse().map((node, index)=>{
        console.log(node);
        return (
          
          <TreeItem sx={{padding:"0px", margin:"0px"}} key={"LayerSet"+(index+1)} nodeId={"LayerSet"+(index+1)} label={"Layer Set "+(node.INDEX)}>
            {Object.entries(node).map(([key, value])=>{
                if(key === "INDEX") return;
                const rows = value.map((att,attRowIndex) =>{
                  let obj={}
                  Object.entries(att).map(([attKey, attValue])=>{
                    obj[attKey] = attValue;
                  });
                  return obj;
                });
                console.log(rows);
              return (
                <TreeItem key={`${key}_${index}`} nodeId={`${key}_${index}`} label={`${key}(${rows.length})`}>
                  <AttributeDataGrid dataKey={key} rows={rows} updateState = {(updateNum===(node.INDEX))&&true} rowIndex={node.INDEX} />
                  {/* <DataGrid columns={columns[key]} style={{height:220}} rows={rows} onAddFilter={filter => setFilters(handleFilterChange(filter))}/> */}
                </TreeItem>
              )
            })}
          </TreeItem>
        )})}
      </>
    )
  }
  return (
    <TreeView
      aria-label="rich object"
      defaultCollapseIcon={<ExpandMoreIcon />}
      defaultExpanded={['root']}
      defaultExpandIcon={<ChevronRightIcon />}
      sx={{ maxHeight:'800px', flexGrow: 1, width: '100%', overflowY: 'auto', overflowX: 'hidden', padding:0, margin:0}}
    >
      {renderTree(selector?.data, selector?.updateNum)}
    </TreeView>
    
  );
  }
