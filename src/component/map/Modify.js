import Select from 'ol/interaction/Select';
import DragBox from 'ol/interaction/DragBox';
import Modify from 'ol/interaction/Modify';
import Translate from 'ol/interaction/Translate';
import {altKeyOnly, platformModifierKeyOnly, primaryAction} from 'ol/events/condition';
import Style from 'ol/style/Style';
import Circle from  'ol/style/Circle';
import Fill from 'ol/style/Fill';
import LineString from 'ol/geom/LineString';
import Stroke from 'ol/style/Stroke';
import MultiPoint from 'ol/geom/MultiPoint';
import { Snap } from 'ol/interaction';
import { addObject, resetObject, updateMap } from '../../reducers';
import { mapService } from '../../service/message.service';
import UndoRedo from 'ol-ext/interaction/UndoRedo'

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
const selectedStyle = function(feature){
    var styles = [];
    if (feature.getGeometry().getType() === 'Point') {
        styles.push(new Style({
            image: new Circle({
                radius: 7,
                fill: new Fill({
                    color: 'rgba(0,0,255,1)'
                }),
            })
        })); 
    }
    if (feature.getGeometry().getType() === 'Polygon') {
        styles.push(
            new Style({
                fill: new Fill({
                    color: 'rgba(0,0,255,0.4)'
                }),
            })); 
        }
        if (feature.getGeometry().getType() === 'LineString') {
            var coordinates = feature.getGeometry().getCoordinates();
            styles.push(new Style({
                geometry: new LineString(coordinates),
                stroke: new Stroke({
                    color:'rgba(0,0,255,0.6)', width:5
                }),
            })); 
            styles.push(new Style({
                geometry: new MultiPoint(coordinates),
                image: new Circle({
                    radius: 5,
                    fill: new Fill({
                        color: 'rgba(0,0,255,1)'
                    }),
                })
            })); 
        }
        return styles;
    }
    
const FnModifyStart = (e, dispatch, undoInteraction, vector) =>{
    undoInteraction.blockStart();
};  
const FnModifyEnd = (e, dispatch, undoInteraction, vector, hdMap) =>{
    if(e.features === null) {
        undoInteraction.blockEnd();
        return; 
    }
    if(typeof(e.features) === 'undefined'){
        undoInteraction.blockEnd(); 
        return; 
    }

    var features = e.features.getArray();
    if(!features){
        undoInteraction.blockEnd(); 
        return;
    } 
    features.forEach((feature)=>{
        var type = feature.get('group');
        var ID = feature.get('ID');
        var before; 
        before = feature.getProperties();
        if(type==="LAYER_LN_NODE"){
            feature.get('LinkID').forEach(linkId=>{
                var link = vector.getFeatureById("LAYER_LN_LINK_"+linkId);
                var changeData = {data:""};
                if(link.get("SNodeID")===ID){
                    changeData.field = "SNodeID";
                } else if(link.get("ENodeID")===ID){
                    changeData.field = "ENodeID";
                }else{return;}
                mapService.changeObject("LAYER_LN_LINK", linkId, changeData);
            });
            mapService.changeObject("LAYER_LN_NODE", ID, {field:"LinkID",data:[]});
            mapService.changeObject("LAYER_LN_NODE", ID, {field:"NumConLink",data:0});
            
            var linkIds = feature.get('LinkID');
            vector.getFeaturesAtCoordinate (feature.getGeometry().getFirstCoordinate()).forEach(x=>{
                if(x.get('group')==='LAYER_LN_LINK'){
                    var nodePoint = feature.getGeometry().getCoordinates();
                    var linkFirstPoint = x.getGeometry().getFirstCoordinate();
                    var linkLastPoint = x.getGeometry().getLastCoordinate();
                    if(JSON.stringify(nodePoint) === JSON.stringify(linkFirstPoint)){
                        mapService.changeObject("LAYER_LN_LINK", x.get('ID'), {field:"SNodeID",data:ID});
                        linkIds.push(x.get('ID'));
                    }
                    if(JSON.stringify(nodePoint) === JSON.stringify(linkLastPoint)){
                        mapService.changeObject("LAYER_LN_LINK", x.get('ID'), {field:"ENodeID",data:ID});
                        linkIds.push(x.get('ID'));
                    }
                }
            });
            mapService.changeObject("LAYER_LN_NODE", ID, {field:"LinkID",data:linkIds});
            mapService.changeObject("LAYER_LN_NODE", ID, {field:"NumConLink",data:linkIds.length});
        }else if(type==="LAYER_LN_LINK"){
            let sNodeId = feature.get('SNodeID');
            let eNodeId = feature.get('ENodeID');
            if(sNodeId !== '' && !isNaN(sNodeId)){
                let node = vector.getFeatureById("LAYER_LN_NODE_"+sNodeId);
                let linkIds  = node.get('LinkID').filter((element) => element !== ID);
                mapService.changeObject("LAYER_LN_NODE", node.get("ID"), {field:"LinkID",data:linkIds});
                mapService.changeObject("LAYER_LN_NODE", node.get("ID"), {field:"NumConLink",data:linkIds.length});
            }
            if(eNodeId !== '' && !isNaN(eNodeId)){
                let node = vector.getFeatureById("LAYER_LN_NODE_"+eNodeId);
                let linkIds  = node.get('LinkID').filter((element) => element !== ID);
                mapService.changeObject("LAYER_LN_NODE", node.get("ID"), {field:"LinkID",data:linkIds});
                mapService.changeObject("LAYER_LN_NODE", node.get("ID"), {field:"NumConLink",data:linkIds.length});
            }
            mapService.changeObject("LAYER_LN_LINK", ID, {field:"SNodeID",data:""});
            mapService.changeObject("LAYER_LN_LINK", ID, {field:"ENodeID",data:""});
    
            vector.getFeaturesAtCoordinate (feature.getGeometry().getFirstCoordinate()).forEach(x=>{
                if(x.get('group')==='LAYER_LN_NODE'){
                    let linkIds  = [...x.get('LinkID')];
                    linkIds.push(ID);
                    mapService.changeObject("LAYER_LN_NODE", x.get("ID"), {field:"LinkID",data:linkIds});
                    mapService.changeObject("LAYER_LN_NODE", x.get("ID"), {field:"NumConLink",data:linkIds.length});
                    mapService.changeObject("LAYER_LN_LINK", ID, {field:"SNodeID",data:x.get("ID")});
                }
            });
            vector.getFeaturesAtCoordinate (feature.getGeometry().getLastCoordinate()).forEach(x=>{
                if(x.get('group')==='LAYER_LN_NODE'){
                    let linkIds  = [...x.get('LinkID')];
                    linkIds.push(ID);
                    mapService.changeObject("LAYER_LN_NODE", x.get("ID"), {field:"LinkID",data:linkIds});
                    mapService.changeObject("LAYER_LN_NODE", x.get("ID"), {field:"NumConLink",data:linkIds.length});
                    mapService.changeObject("LAYER_LN_LINK", ID, {field:"ENodeID",data:x.get("ID")});
                }
            });
        }
        // feature.set("NumPoint", (feature.getGeometry().flatCoordinates.length / 2)); 이거 처리 하긴 해야겠는데 일단 대기
    
        dispatch(updateMap(feature.getProperties().ID, feature.getProperties()));
    });
    undoInteraction.blockEnd();

}
export const ModifyInteraction = (select,dispatch, undoInteraction, vector, hdMap)=>{ 
    const modify = new Modify({
        deleteCondition: altKeyOnly,
        features: select.getFeatures(),
    });
    modify.on('modifystart', (e)=> FnModifyStart(e, dispatch, undoInteraction, vector));
    modify.on('modifyend', (e)=> FnModifyEnd(e, dispatch, undoInteraction, vector, hdMap));
    return modify;
}

export const SelectInteraction= (layer)=>(new Select({
    multi:false,
    layers: [layer],
    style: function (feature, resolution) {
        return selectedStyle(feature);
    },
}));

export const DragBoxInteraction = (source, select, rotation) =>{
    const selectedFeatures = select.getFeatures();
    const dragBox = new DragBox({
        condition: platformModifierKeyOnly,
    });
    dragBox.on('boxend', function(){
        const oblique = rotation % (Math.PI / 2) !== 0;
        const candidateFeatures = oblique ? [] : selectedFeatures;
        const extent = this.getGeometry().getExtent();
        source.forEachFeatureIntersectingExtent(extent, function (feature) {
            candidateFeatures.push(feature);
        });
        if (oblique) {
            const anchor = [0, 0];
            const geometry = dragBox.getGeometry().clone();
            geometry.rotate(-rotation, anchor);
            const extent = geometry.getExtent();
            candidateFeatures.forEach(function (feature) {
              const geometry = feature.getGeometry().clone();
              geometry.rotate(-rotation, anchor);
              if (geometry.intersectsExtent(extent)) {
                this.selectedFeatures.push(feature);
              }
            });
        }
    });
    return dragBox;
}

export const TranslateInteraction = (select, dispatch, undoInteraction, vector, hdMap) =>{
    const translate = new Translate({
        condition : function (event){
            return primaryAction(event) && platformModifierKeyOnly(event);
        },
        features : select.getFeatures(),
    });
    translate.on('translatestart', (e)=> FnModifyStart(e, dispatch, undoInteraction, vector));
    translate.on('translateend', (e)=> FnModifyEnd(e, dispatch, undoInteraction, vector, hdMap));
    return translate;
}

export const SnapInteraction = (source)=>( new Snap({
        source : source
    })
);
    
export const UndoInteraction = (dispatch) =>{
    const undoIntercation = new UndoRedo(); 
    undoIntercation.define(
        'attributeChange', 
        function (s){
            let featureID = s.feature.get("ID");
            if(s.before.field==="ID") {
                s.feature.setId(s.feature.get("group")+'_'+s.before.data);
                featureID = s.after.data;
            }
            s.feature.set(s.before.field, s.before.data);
            dispatch(updateMap(featureID,s.feature.getProperties()));

        }, 
        function (s){
            let featureID = s.feature.get("ID");
            if(s.after.field==="ID") {
                s.feature.setId(s.feature.get("group")+'_'+s.after.data);
                featureID = s.before.data;
            }
            s.feature.set(s.after.field, s.after.data);
            dispatch(updateMap(featureID,s.feature.getProperties()));
        }
    );
    
    undoIntercation.define(
        'addObject',
        function(s){
            mapService.dellObject(s.feature);
        }, 
        function(s){
            dispatch(addObject(s.feature));
        }
    );
   
    undoIntercation.on("undo", (e)=>{
        if(e.action.type==="changegeometry"){
            dispatch(updateMap(e.action.feature.getProperties().ID, e.action.feature.getProperties()));
        }
        if(e.action.type==="addfeature"){
            mapService.dellObject(e.action.feature);
        }
        if(e.action.type==="removefeature"){
            dispatch(resetObject(e.action.feature));
        }
    });
    undoIntercation.on("redo", (e)=>{
        if(e.action.type==="changegeometry"){
            dispatch(updateMap(e.action.feature.getProperties().ID, e.action.feature.getProperties()));
        }
        if(e.action.type==="addfeature"){
            mapService.addObject(e.action.feature);
        }
        if(e.action.type==="blockend"){
            e.target.blockStart();
        }
        if(e.action.type==="removefeature"){
            mapService.dellObject(e.action.feature);
        }
        if(e.action.type==="blockstart"){
            e.target.blockEnd();
        }
    });

    return undoIntercation;
}
export default Modify;
