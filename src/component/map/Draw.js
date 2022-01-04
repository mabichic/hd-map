import { Draw } from "ol/interaction";
import { mapService } from "../../service/message.service";


export const DrawInteraction = (hdMap, source, type, undoInteraction) =>{

    hdMap.getInteractions().forEach(function (interaction) {
        if(interaction instanceof Draw) { 
            hdMap.removeInteraction(interaction);
         }
    });

    var drawType = type==='LAYER_POI' || type==='LAYER_LN_NODE'  ? 'Point' : type==='LAYER_LANESIDE' || type==='LAYER_LN_LINK' || type==='LAYER_ROADLIGHT' ? 'LineString' : 'Polygon';

    let draw = new Draw({
        source : source,
        type : drawType 
    });
    draw.on('drawstart', function (e){
        
    });
    draw.on('drawend', function (e) {
        hdMap.removeInteraction(draw);
        e.feature.set('group', type);
        if(type === "LAYER_POI") { 
            e.feature.set('LinkID',0);
            e.feature.set('Name', "NewObject");
        }
        if(type=== "LAYER_LANESIDE"){
            e.feature.set('Color', "LS_WHITE");
            e.feature.set('LaneID', 0);
            e.feature.set('MID', 0);
            e.feature.set('Type', "LS_SOLID");
        }

        if(type=== "LAYER_LN_LINK"){
            e.feature.set('ENodeID', "");
            e.feature.set('InLID', 0);
            e.feature.set('InMID', 0);
            e.feature.set('InRID', 0);
            e.feature.set('Junction', 0);
            e.feature.set('LID', 0);
            e.feature.set('LLinkID', 0);
            e.feature.set('MID', 0);
            e.feature.set('RID', 0);
            e.feature.set('RLID', 0);
            e.feature.set('RLinkID', 0);
            e.feature.set('SNodeID', "");
            e.feature.set('Speed', 1);
            e.feature.set('Sub_Type', "GEN");
            e.feature.set('Twoway', "일방");
            e.feature.set('Type', "LANE_TYPE_NONE");
            e.feature.set('outLID', 0);
            e.feature.set('outMID', 0);
            e.feature.set('outRID', 0);
        }

        if(type=== "LAYER_LN_NODE"){
            e.feature.set('LinkID', []);
            e.feature.set('NumConLink', 0);
        }
        if(type=== "LAYER_ROADLIGHT"){
            e.feature.set('Div', "None");
            e.feature.set('LaneID', 0);
            e.feature.set('Type', "RL_HOR");
            e.feature.set('SubType', "RL_2");
            e.feature.set('NumStopLine', 0);
            e.feature.set('StopLineID', []);
        }
        if(type=== "LAYER_ROADMARK"){
            e.feature.set('NumStopLine', 0);
            e.feature.set('StopLineID', []);
            e.feature.set('SubType', "None");
            e.feature.set('Type', "RM_CROSSWALK");
        }
        mapService.addObject(e.feature);
    });
    
    return draw;
}
export default Draw;

