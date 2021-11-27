import React, { useState, useEffect, useRef } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import XYZ from 'ol/source/XYZ';

import TileLayer from 'ol/layer/Tile';
import { Box } from '@mui/system';
import proj4 from 'proj4';
import 'ol/ol.css';
import {register} from 'ol/proj/proj4';

import { useSelector } from "react-redux";
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import { Feature } from 'ol';
import LineString from 'ol/geom/LineString';
import {defaults as defaultControls} from 'ol/control';
import LayerSwitcher from 'ol-ext/control/LayerSwitcher'
import 'ol-ext/control/LayerSwitcher.css'
import {defaults as defaultInteraction} from 'ol/interaction'
import Point from 'ol/geom/Point';
import Polygon from 'ol/geom/Polygon';
import HdMapStyle from './map/HdMapStyle';
import { DragBoxInteraction, ModifyInteraction, SelectInteraction, SnapInteraction, TranslateInteraction } from './map/Modify';
import { mapService} from '../service/message.service';
proj4.defs([
  ['EPSG:5186', '+proj=tmerc +lat_0=38 +lon_0=127 +k=1 +x_0=200000 +y_0=600000 +epllps']
]);
proj4.defs( "EPSG:5186", "+proj=tmerc +lat_0=38 +lon_0=127 +k=1 +x_0=200000 +y_0=600000 +ellps=GRS80 +units=m +no_defs" ); // 5186 좌표선언
register(proj4);

const { ipcRenderer } = window.require("electron");


function HdMap () { 
  const [hdMap, setHdMap] = useState();
  const [layers, setLayers] = useState([]);
  const [source, setSource] = useState();
  const [select, setSelecte] = useState();
  const selector = useSelector((state)=>state);
  const mapRef = useRef();
  mapRef.current = hdMap;

  
  useEffect(() => {
    const backLayer = new TileLayer({
      title: "브이월드",
        baseLayer: false,
        source: new XYZ({
            url : 'http://xdworld.vworld.kr:8080/2d/Satellite/201612/{z}/{x}/{y}.jpeg',
            maxZoom: 19,
        })
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
    setHdMap(initialMap);

    
    
  },[]); 

  useEffect(()=>{
    console.log(source);
    let subscription = mapService.getMessage().subscribe(message => {
      if (message) {
        var feature = source.getFeatureById(message.type+'_'+message.id);
        select.getFeatures().clear();
        select.getFeatures().push(feature);

        var arr = feature.getGeometry().getExtent();

        hdMap.getView().fit(feature.getGeometry().getExtent(), hdMap.getSize());
        console.log(hdMap.getSize())
      } else {
        // clear messages when empty message received
      }
    });
    return () =>{
      subscription.unsubscribe();
    }
  },[source])
  
  useEffect(() =>{
    if(selector.data.length<1)  return;
    selector.data.forEach((element,index)=>{
      if((index) !== layers.length) return;
      let vector = new VectorSource({});
      let layer = new VectorLayer({
        title: 'Layer Set '+selector.data.length,
        source: vector,
        style : HdMapStyle
      });
      hdMap?.addLayer(layer);
      setSource(vector);
      element?.LAYER_LANESIDES?.forEach(laneside=>{
        var line = new Feature({
          geometry : new LineString(laneside.PointXY)
        });
        line.setId("LAYER_LANESIDES_"+laneside.ID);
        line.set('id', laneside.ID);
        line.set('group', "LAYER_LANESIDES");
        line.set('color', laneside.Color);
        line.set('laneId', laneside.LaneID);
        line.set('mId', laneside.MID);
        line.set('numPoints', laneside.NumPoint);
        line.set('type', laneside.Type);
        vector.addFeature(line);
      });
      element?.LAYER_POI?.forEach(POI=>{
        var point = new Feature({
            geometry : new Point(POI.PointXY[0])
        }) ; 
        point.setId("LAYER_POI_"+POI.ID);
        point.set('id', POI.ID);
        point.set('linkId', POI.LinkID);
        point.set('name', POI.Name);
        point.set('group', "LAYER_POI");
        vector.addFeature(point); 
      })
      element?.LAYER_LN_LINK?.forEach(link=>{
        var line = new Feature({
            geometry : new LineString(link.PointXY)
        });
        line.setId("LAYER_LN_LINK_"+link.ID);
        line.set('id', link.ID);
        line.set('group', "LAYER_LN_LINK");
        line.set('eNodeId', link.ENodeID);
        line.set('inLId', link.InLID);
        line.set('inMId', link.InMID);
        line.set('inRId', link.InRID);
        line.set('junction', link.Junction);
        line.set('lId', link.LID);
        line.set('lLinkId', link.LLinkID);
        line.set('mId', link.MID);
        line.set('numPoints', link.NumPoint);
        line.set('outLId', link.outLID);
        line.set('outMId', link.outMID);
        line.set('outRId', link.outRID);
        line.set('rId', link.RID);
        line.set('rLId', link.RLID);
        line.set('rLinkId', link.RLinkID);
        line.set('sNodeId', link.SNodeID);
        line.set('speed', link.Speed);
        line.set('subType', link.Sub_Type);
        line.set('twoWay', link.Twoway);
        line.set('type', link.Type);
        vector.addFeature(line);
      });

      element?.LAYER_LN_NODE?.forEach(node =>{
        var point = new Feature({
            geometry : new Point(node.PointXY[0])
        }) ; 
        point.setId("LAYER_LN_NODE_"+node.ID);
        point.set('id', node.ID);
        point.set('group', "LAYER_LN_NODE");
        point.set('linkId', node.LinkID);
        point.set('numConLinks', node.NumConLink);
        vector.addFeature(point);
      });

      element?.LAYER_ROADLIGHT?.forEach(roadLight=>{
        var line = new Feature({
            geometry : new LineString(roadLight.PointXY)
        });
        line.setId("LAYER_ROADLIGHT_"+roadLight.ID);
        line.set('id', roadLight.ID);
        line.set('group', "LAYER_ROADLIGHT");
        line.set('div', roadLight.Div);
        line.set('laneId', roadLight.LaneID);
        line.set('numPoints', roadLight.NumPoint);
        line.set('numStopLines', roadLight.NumStopline);
        line.set('stopLineId', roadLight.StoplineID);
        line.set('subType', roadLight.SubType);
        line.set('type', roadLight.Type);
        vector.addFeature(line);
      });
      element?.LAYER_ROADMARK?.forEach(roadMark=>{
        var polygon = new Feature({
            geometry : new Polygon([roadMark.PointXY])
        });
        polygon.setId("LAYER_ROADMARK_"+roadMark.ID);
        polygon.set('id', roadMark.ID);
        polygon.set('numPoints', roadMark.NumPoint);
        polygon.set('numStopLines', roadMark.NumStopLine);
        polygon.set('stopLineId', roadMark.StopLineID);
        polygon.set('subType', roadMark.SubType);
        polygon.set('group', "LAYER_ROADMARK");
        polygon.set('type', roadMark.Type);
        vector.addFeature(polygon);
      });
      setLayers([...layers, layer]);
      if(isFinite(vector.getExtent()[0])&&isFinite(vector.getExtent()[1])&&isFinite(vector.getExtent()[2])&&isFinite(vector.getExtent()[3])) hdMap.getView().fit(vector.getExtent());
      const select = SelectInteraction(layer);
      hdMap.addInteraction(select);
      hdMap.addInteraction(DragBoxInteraction(vector, select, hdMap.getView().getRotation()));
      hdMap.addInteraction(ModifyInteraction(select));
      hdMap.addInteraction(TranslateInteraction(select));
      hdMap.addInteraction(SnapInteraction(vector));
      setSelecte(select);

    });
  },[selector])
  
  const keySetting = (e)=>{
    console.log(e);
    console.log(hdMap.getView().getZoom());
    ipcRenderer.send('foo', {
      name : 'test'
    });
  }
  
  return (
    <Box component="div" onKeyPress={keySetting} id='map' sx={{width:'100%', height:'100%'}} tabIndex="0"/>
  )
}

export default HdMap;