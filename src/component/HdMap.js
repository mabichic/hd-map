import React, { useState, useEffect, useRef } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import XYZ from 'ol/source/XYZ';

import TileLayer from 'ol/layer/Tile';
import { Box, typography } from '@mui/system';
import proj4 from 'proj4';
import 'ol/ol.css';
import {register} from 'ol/proj/proj4';

import { useSelector } from "react-redux";
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import { Overlay, Feature } from 'ol';
import LineString from 'ol/geom/LineString';
import {defaults as defaultControls} from 'ol/control';
import LayerSwitcher from 'ol-ext/control/LayerSwitcher'
import 'ol-ext/control/LayerSwitcher.css'
import {defaults as defaultInteraction} from 'ol/interaction'
import Point from 'ol/geom/Point';
import Polygon from 'ol/geom/Polygon';
import HdMapStyle from './map/HdMapStyle';
import { DragBoxInteraction, ModifyInteraction, SelectInteraction, SnapInteraction, TranslateInteraction, UndoInteraction } from './map/Modify';
import { confrimService, mapService, messageService} from '../service/message.service';
import { Typography } from '@mui/material';
import { useDispatch } from 'react-redux';
import { addObject, addObjects, deleteObject, updateMap } from '../reducers';

import { DrawInteraction } from './map/Draw';

proj4.defs([
  ['EPSG:5186', '+proj=tmerc +lat_0=38 +lon_0=127 +k=1 +x_0=200000 +y_0=600000 +epllps']
]);
proj4.defs( "EPSG:5186", "+proj=tmerc +lat_0=38 +lon_0=127 +k=1 +x_0=200000 +y_0=600000 +ellps=GRS80 +units=m +no_defs" ); // 5186 좌표선언
register(proj4);
const cloneObj = obj => JSON.parse(JSON.stringify(obj))

function HdMap (prop) { 
  const {test} = prop;
  const [hdMap, setHdMap] = useState();
  const [layers, setLayers] = useState([]);
  const [layer, setLayer] = useState();
  const [source, setSource] = useState();

  const [gpsLayers, setGpsLayers] = useState(null);
  const [gpsSource, setGpsSource] = useState(null);
  const [select, setSelecte] = useState(null);
  const [dragBox, setDragBox] = useState(null);
  const [gpsSelect, setGpsSelecte] = useState(null);
  const [gpsDragBox, setGpsDragBox] = useState(null);
  const [content, setContent] = useState();
  const [overlay, setOverlay] = useState();
  const [modify, setModify] = useState(null);
  const [undoInteraction, setUndoInteraction] = useState();
  const selector = useSelector((state)=>state);
  const selectorGPSLOG = useSelector((state)=>state.gpsLogData);
  const mapRef = useRef();
  const closerRef = useRef();
  mapRef.current = hdMap;

  const overlayRef = useRef(null);
  const popupRef = useRef(null);

  const dispatch = useDispatch();

  const dellOverlay = function(){ 
    overlay?.setPosition(undefined);
    closerRef.current.blur();
    return false;
  };

  useEffect(() => {
    const backLayer = new TileLayer({
      title: "브이월드",
        baseLayer: false,
        source: new XYZ({
            url : 'http://xdworld.vworld.kr:8080/2d/Satellite/201612/{z}/{x}/{y}.jpeg',
            maxZoom: 19,
        })
    })
    const overlay = new Overlay({
      element : overlayRef.current,
      autoPan : true, 
      autoPanAnimation : {
        duration : 250,
      }
    })

    const initialMap = new Map({
      layers: [
        backLayer,
      ],
      view: new View({
        projection: 'EPSG:5186',
        center: [234075,419607],
        zoom: 15,
        minZoom:8,
        constrainResolution: true,
      }),
      controls : defaultControls().extend([
        new LayerSwitcher({}),
      ]),
      interactions : defaultInteraction({doubleClickZoom:false}),
      target: 'map'
    });
    initialMap.addOverlay(overlay);
    setOverlay(overlay);
    setHdMap(initialMap);

    
    
  },[]); 

  useEffect(()=>{
    let subscription = mapService.getMessage().subscribe(message => {
      dellOverlay();
      if(message.service === 'moveMap'){
        dellOverlay();
        var feature = source.getFeatureById(message.type+'_'+message.id);
        if(isFinite(feature.getGeometry().getExtent()[0])&&isFinite(feature.getGeometry().getExtent()[1])&&isFinite(feature.getGeometry().getExtent()[2])&&isFinite(feature.getGeometry().getExtent()[3])){
          select.getFeatures().clear();
          select.getFeatures().push(feature);
          hdMap.getView().fit(feature.getGeometry().getExtent(),{duration : 500, size:hdMap.getSize(), maxZoom:23, padding:[0,0,test.current.children[0].clientHeight,0]});
        }
      } else if(message.service==='changeObject') {
        undoInteraction.blockStart();
        var feature = source.getFeatureById(message.type+'_'+message.id);
        var before = {field : message.att.field, data : feature.get(message.att.field)};

        let beforeID = feature.get('ID');
        let afterID = message.att.data;

        //link 거나 node 일때 ID가 변경되면 연결되있는 NODE LINK 아이디도 변경 해야한다.
        if(message.att.field==="ID"){
          feature.setId(message.type+'_'+message.att.data);
          if(feature.get('group')==='LAYER_LN_LINK'){
            let sNodeID = feature.get('SNodeID');
            let eNodeID = feature.get('ENodeID');
            let sNode = source.getFeatureById("LAYER_LN_NODE_"+sNodeID);
            let eNode = source.getFeatureById("LAYER_LN_NODE_"+eNodeID);

            let sNodeLinkID = sNode.get('LinkID').valueOf();
            let eNodeLinkID = eNode.get('LinkID').valueOf();
            let beforeSNodeLinkID = cloneObj(sNode.get('LinkID'));
            let beforeENodeLinkID = cloneObj(eNode.get('LinkID'));
            let beforeSNode = {field : 'LinkID', data : beforeSNodeLinkID};
            let beforeENode = {field : 'LinkID', data : beforeENodeLinkID};

            const sNodeIndex = sNodeLinkID.indexOf(beforeID);
            const eNodeIndex = eNodeLinkID.indexOf(beforeID);
            if (sNodeIndex !== -1) {
              sNodeLinkID[sNodeIndex] = afterID;
              sNode.set('LinkID',sNodeLinkID);
              let afterSNode = {field : 'LinkID', data : sNodeLinkID};
              undoInteraction.push('attributeChange', {before:beforeSNode, after:afterSNode, feature: sNode} );

              dispatch(updateMap(sNode.get('ID'),sNode.getProperties()));
            }
            if (eNodeIndex !== -1) {
              eNodeLinkID[eNodeIndex] = afterID;
              eNode.set('LinkID',eNodeLinkID);
              let afterENode = {field : 'LinkID', data : eNodeLinkID};
              undoInteraction.push('attributeChange', {before:beforeENode, after:afterENode, feature: eNode} );
              dispatch(updateMap(eNode.get('ID'),eNode.getProperties()));
            }
          }
          if(feature.get('group')==='LAYER_LN_NODE'){
            feature.get('LinkID').forEach(linkId=>{
              var link = source.getFeatureById("LAYER_LN_LINK_"+linkId);
              if(link.get('SNodeID')===beforeID){
                let beforeLink = {field : 'SNodeID', data : beforeID};
                link.set('SNodeID', afterID);
                let afterLink = {field : 'SNodeID', data : beforeID};
                undoInteraction.push('attributeChange', {before:beforeLink, after:afterLink, feature: link} );
                dispatch(updateMap(link.get('ID'),link.getProperties()));
              }
              if(link.get('ENodeID')===beforeID){
                let beforeLink = {field : 'ENodeID', data : beforeID};
                link.set('ENodeID', afterID);
                let afterLink = {field : 'ENodeID', data : beforeID};
                undoInteraction.push('attributeChange', {before:beforeLink, after:afterLink, feature: link} );
                dispatch(updateMap(link.get('ID'),link.getProperties()));
              }
            });
          }

        }   
        if(Array.isArray(message.att.data)) message.att.data.sort(function(a, b){ return a-b;});
        feature.set(message.att.field, message.att.data);
        var after = message.att;
        undoInteraction.push('attributeChange', {before:before, after:after, feature: feature} )
        dispatch(updateMap(message.id,feature.getProperties()));
        undoInteraction.blockEnd();
      }else if(message.service==='undoredo') {
        if(message.type === 'undo'){
          undoInteraction?.undo();
        }else if(message.type === 'redo'){
          undoInteraction?.redo();
        }
      }else if(message.service==="draw"){
        hdMap.addInteraction(DrawInteraction(hdMap, source, message.type, undoInteraction));
      }else if(message.service==="addObject"){  
        dispatch(addObject(message.feature));
      }else if(message.service==="dellObject"){
        var type = message.feature.get("group");
        var ID = message.feature.get("ID");
        var before; 
        before = message.feature.getProperties();
        if(type==="LAYER_LN_NODE"){
          message.feature.get('LinkID').forEach(linkId=>{
            var link = source.getFeatureById("LAYER_LN_LINK_"+linkId);
            if(link ===null) return;
            var changeData = {data:""};
            if(link.get("SNodeID")===ID){
                changeData.field = "SNodeID";
            } else if(link.get("ENodeID")===ID){
                changeData.field = "ENodeID";
            }else{return;}
            mapService.changeObject("LAYER_LN_LINK", linkId, changeData);
          });
        }else if(type==="LAYER_LN_LINK"){
          let sNodeId = message.feature.get('SNodeID');
          let eNodeId = message.feature.get('ENodeID');
          if(sNodeId !== '' && !isNaN(sNodeId)){
            let node = source.getFeatureById("LAYER_LN_NODE_"+sNodeId);
            if(node!==null){
              let linkIds  = node.get('LinkID').filter((element) => element !== ID);
              mapService.changeObject("LAYER_LN_NODE", node.get("ID"), {field:"LinkID",data:linkIds});
              mapService.changeObject("LAYER_LN_NODE", node.get("ID"), {field:"NumConLink",data:linkIds.length});
            }
          }
          if(eNodeId !== '' && !isNaN(eNodeId)){
            let node = source.getFeatureById("LAYER_LN_NODE_"+eNodeId);
            if(node!==null){
              let linkIds  = node.get('LinkID').filter((element) => element !== ID);
              mapService.changeObject("LAYER_LN_NODE", node.get("ID"), {field:"LinkID",data:linkIds});
              mapService.changeObject("LAYER_LN_NODE", node.get("ID"), {field:"NumConLink",data:linkIds.length});
            }
          }
        }
        let removeFeature = source.getFeatureById(message.feature.getId());
        if(removeFeature!=null) source.removeFeature(message.feature);
        dispatch(deleteObject(message.feature));
        
      }else if(message.service==="selectDell"){
        var features = select?.getFeatures();
        if(!features||features?.getLength()<1){
            messageService.sendMessage("취소","선택하신 객체가 없습니다");
        }else{
          const dellObject = () =>{
            undoInteraction.blockStart();
            
            features?.forEach(element =>{
              mapService.dellObject(element);
            });
            undoInteraction.push('dellObject', {features: features} )
            undoInteraction.blockEnd();
            select.getFeatures().clear();
            select.setActive(false);
            select.setActive(true);
          };
          confrimService.sendMessage("객체 삭제", features?.getLength() + "개의 객체를 정말 지우시겠습니까?", dellObject, null);
        }
      }else if(message.service==="clear"){ 
        if(typeof(source)!=="undefined")  source.clear(); 
        layers.forEach((layer) =>{
          if(typeof(layer)!=="undefined")  hdMap.removeLayer(layer);
        })
        if(gpsLayers!==null){
          hdMap.removeLayer(gpsLayers);
          setGpsLayers(null);
        }

        if(typeof(undoInteraction)!=="undefined") undoInteraction.clear();
        setLayers([]);
      }else if(message.service==="generationGps"){
        if(gpsLayers!==null){
          let source = gpsLayers.getSource();
          source.getFeatures().forEach((feature)=>{
            feature.getGeometry().getFirstCoordinate() ;  //s 노드
            feature.getGeometry().getLastCoordinate();    //e 노드
            
            var link = new Feature({
              geometry : new LineString(feature.getGeometry().simplify(0.01).getCoordinates()) //10meter단위 (더글라스 페커 공차)
            });
            link.set('group', 'LAYER_LN_LINK');
            link.set('ENodeID', "");
            link.set('InLID', 0);
            link.set('InMID', 0);
            link.set('InRID', 0);
            link.set('Junction', 0);
            link.set('LID', 0);
            link.set('LLinkID', 0);   
            link.set('MID', 0);
            link.set('RID', 0);
            link.set('RLID', 0);
            link.set('RLinkID', 0);
            link.set('SNodeID', "");
            link.set('Speed', 1);
            link.set('Sub_Type', "GEN");
            link.set('Twoway', "일방");
            link.set('Type', "LANE_TYPE_NONE");
            link.set('outLID', 0);
            link.set('outMID', 0);
            link.set('outRID', 0);
            layers[layers.length-1].getSource().addFeature(link);
            var snode = new Feature({
                geometry : new Point(feature.getGeometry().getFirstCoordinate())
            }); 
            snode.set('group', "LAYER_LN_NODE");
            layers[layers.length-1].getSource().addFeature(snode);

            var enode = new Feature({
              geometry : new Point(feature.getGeometry().getLastCoordinate())
            }); 
            enode.set('group', "LAYER_LN_NODE");
            layers[layers.length-1].getSource().addFeature(enode);

            dispatch(addObjects({snode:snode, enode:enode, link:link}));
            if(typeof(undoInteraction)!=="undefined") undoInteraction.clear();

            if(typeof(gpsLayers)!=="undefined"){
              hdMap.removeLayer(gpsLayers);
              setGpsLayers(null);
            }  
            
          });
      }
    }

    });
    return () =>{
      subscription.unsubscribe();
    }
  },[source, gpsLayers])
  
  useEffect(() =>{
    if(selector.data.length<1)  return;

    selector.data.forEach((element,index)=>{

      if((index) !== layers.length) return;
      dellOverlay();
      if(select!==null){
        select?.getFeatures().clear();
        select?.setActive(false);
      } 
      if(modify!==null){
        modify?.setActive(false);
      }
      if(dragBox!==null){
        dragBox?.setActive(false);
      }
      let vector = new VectorSource({});
      let layer = new VectorLayer({
        title: 'Layer Set '+selector.data.length,
        source: vector,
        style : HdMapStyle
      });
      hdMap?.addLayer(layer);
      setSource(vector);
      element?.LAYER_LANESIDE?.forEach(laneside=>{
        var line = new Feature({
          geometry : new LineString(laneside.PointXY)
        });
        line.setId("LAYER_LANESIDE_"+laneside.ID);
        line.set('ID', laneside.ID);
        line.set('group', "LAYER_LANESIDE");
        line.set('Color', laneside.Color);
        line.set('LaneID', laneside.LaneID);
        line.set('MID', laneside.MID);
        line.set('NumPoint', laneside.NumPoint);
        line.set('Type', laneside.Type);
        vector.addFeature(line);
      });
      element?.LAYER_POI?.forEach(POI=>{
        var point = new Feature({
            geometry : new Point(POI.PointXY[0])
        }) ; 
        point.setId("LAYER_POI_"+POI.ID);
        point.set('ID', POI.ID);
        point.set('LinkID', POI.LinkID);
        point.set('Name', POI.Name);
        point.set('group', "LAYER_POI");
        vector.addFeature(point); 
      })
      element?.LAYER_LN_LINK?.forEach(link=>{
        var line = new Feature({
            geometry : new LineString(link.PointXY)
        });
        line.setId("LAYER_LN_LINK_"+link.ID);
        line.set('ID', link.ID);
        line.set('group', "LAYER_LN_LINK");
        line.set('ENodeID', link.ENodeID);
        line.set('InLID', link.InLID);
        line.set('InMID', link.InMID);
        line.set('InRID', link.InRID);
        line.set('Junction', link.Junction);
        line.set('LID', link.LID);
        line.set('LLinkID', link.LLinkID);
        line.set('MID', link.MID);
        line.set('NumPoint', link.NumPoint);
        line.set('outLID', link.outLID);
        line.set('outMID', link.outMID);
        line.set('outRID', link.outRID);
        line.set('RID', link.RID);
        line.set('RLID', link.RLID);
        line.set('RLinkID', link.RLinkID);
        line.set('SNodeID', link.SNodeID);
        line.set('Speed', link.Speed);
        line.set('Sub_Type', link.Sub_Type);
        line.set('Twoway', link.Twoway);
        line.set('Type', link.Type);
        vector.addFeature(line);
      });

      element?.LAYER_LN_NODE?.forEach(node =>{
        var point = new Feature({
            geometry : new Point(node.PointXY[0])
        }) ; 
        point.setId("LAYER_LN_NODE_"+node.ID);
        point.set('ID', node.ID);
        point.set('group', "LAYER_LN_NODE");
        point.set('LinkID', node.LinkID);
        point.set('NumConLink', node.NumConLink);
        vector.addFeature(point);
      });

      element?.LAYER_ROADLIGHT?.forEach(roadLight=>{
        var line = new Feature({
            geometry : new LineString(roadLight.PointXY)
        });
        line.setId("LAYER_ROADLIGHT_"+roadLight.ID);
        line.set('ID', roadLight.ID);
        line.set('group', "LAYER_ROADLIGHT");
        line.set('Div', roadLight.Div);
        line.set('LaneID', roadLight.LaneID);
        line.set('NumPoint', roadLight.NumPoint);
        line.set('NumStopLine', roadLight.NumStopLine);
        line.set('StopLineID', roadLight.StopLineID);
        line.set('SubType', roadLight.SubType);
        line.set('Type', roadLight.Type);
        vector.addFeature(line);
      });
      element?.LAYER_ROADMARK?.forEach(roadMark=>{
        var polygon = new Feature({
            geometry : new Polygon([roadMark.PointXY])
        });
        polygon.setId("LAYER_ROADMARK_"+roadMark.ID);
        polygon.set('ID', roadMark.ID);
        polygon.set('NumPoint', roadMark.NumPoint);
        polygon.set('NumStopLine', roadMark.NumStopLine);
        polygon.set('StopLineID', roadMark.StopLineID);
        polygon.set('SubType', roadMark.SubType);
        polygon.set('group', "LAYER_ROADMARK");
        polygon.set('Type', roadMark.Type);
        vector.addFeature(polygon);
      });
      
      setLayers([...layers, layer]);
      setLayer(layer);
      if(isFinite(vector.getExtent()[0])&&isFinite(vector.getExtent()[1])&&isFinite(vector.getExtent()[2])&&isFinite(vector.getExtent()[3])) hdMap.getView().fit(vector.getExtent());
      const selectInteraction = SelectInteraction(layer);
      hdMap.addInteraction(selectInteraction);
      const undo= UndoInteraction(dispatch);
      const modifyInteraction = ModifyInteraction(selectInteraction, dispatch, undo, vector, hdMap);
      const dragBoxInteraction = DragBoxInteraction(vector, selectInteraction, hdMap.getView().getRotation());
      setUndoInteraction(undo);
      hdMap.addInteraction(undo);
      hdMap.addInteraction(dragBoxInteraction);
      hdMap.addInteraction(modifyInteraction);
      hdMap.addInteraction(TranslateInteraction(selectInteraction, dispatch, undo, vector, hdMap));
      hdMap.addInteraction(SnapInteraction(vector));
      setSelecte(selectInteraction);
      setModify(modifyInteraction);
      setDragBox(dragBoxInteraction);
      
      select?.setActive(true);
      modify?.setActive(true);
      dragBoxInteraction?.setActive(true);
      hdMap.getViewport().addEventListener('contextmenu', function(evt){
        evt.preventDefault();
        const coordinate = hdMap.getEventCoordinate(evt);
        const pixel = hdMap.getPixelFromCoordinate(coordinate);
        const feature = hdMap.forEachFeatureAtPixel(pixel, function (feature) {
          return feature;
        },{
          layerFilter: function(filterLayer) {
              return filterLayer === layer
          }
        });
        if(feature) {
          var txt = {};
          feature.getKeys().forEach(key=>{
              if(key==='geometry') return;
              txt[key] = feature.get(key);
          });
          setContent(()=>(txt));
          overlay.setPosition(coordinate);
        }else{
          overlay.setPosition(undefined);
          return false;
        }

      });
    });
    
  },[selector])
  useEffect(() =>{
    let source;
    let layer; 
    if(selector.gpsLogData.length<1)  return;
    if(gpsLayers===null){
      layer = new VectorLayer({
        title: 'GPS LOG',
        source: new VectorSource({}),
        style : HdMapStyle
      });
      hdMap?.addLayer(layer);
      setGpsSource(source);
      setGpsLayers(layer);
      source = layer.getSource();
    }else{
      source= gpsLayers.getSource();
    }

    selectorGPSLOG.GPS_LOG?.forEach((element,index)=>{
      var line = new Feature({
        geometry : new LineString(element.PointXY)
      });
      
      line.setId("GPS_LOG_"+element.ID);
      line.set('ID', element.ID);
      line.set('group', "GPS_LOG");
      source.addFeature(line);
      
    });
    if(isFinite(source.getExtent()[0])&&isFinite(source.getExtent()[1])&&isFinite(source.getExtent()[2])&&isFinite(source.getExtent()[3])) hdMap.getView().fit(source.getExtent());

    if(typeof(undoInteraction)!=="undefined") undoInteraction.clear();
    // const selectInteraction = SelectInteraction(layer);
    // const dragBoxInteraction = DragBoxInteraction(source, selectInteraction, hdMap.getView().getRotation());

    // selectInteraction.setActive(false);
    // dragBoxInteraction.setActive(false);
    // hdMap.addInteraction(selectInteraction);
    // hdMap.addInteraction(dragBoxInteraction);
    // setGpsDragBox(dragBoxInteraction);
    // setGpsSelecte(selectInteraction);
  },[selectorGPSLOG]);
  const keySetting = (e)=>{
  
    // console.log(e);
    // console.log(hdMap.getView().getZoom());
    // ipcRenderer.send('foo', {
    //   name : 'test'
    // });
  }
  
  return (
    <>
    <Box component="div" onKeyPress={keySetting} onKeyUp={keySetting} id='map' sx={{width:'100%', height:'100%'}} tabIndex="0"/>
    <div id="windowHDMapOverlay" ref={overlayRef}>
    <a href="#" id="windowHDMapOverlay-closer" ref={closerRef} className="ol-popup-closer" onClick={dellOverlay}></a>
    <div id="windowHDMapOverlay-content">
      {content && (
         Object.entries(content).map(([attKey, attValue])=>{
          return <Typography key={attKey}> {`${attKey} : ${attValue}`} </Typography>
        })
      )}
    </div>
    </div>
    </>
  )
}

export default HdMap;