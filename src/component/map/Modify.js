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


export const ModifyInteraction = (select)=>{ 
    return ( 
        new Modify({
            deleteCondition: altKeyOnly,
            features: select.getFeatures(),
        })
    )
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
        console.log(rotation% (Math.PI / 2));
        const oblique = rotation % (Math.PI / 2) !== 0;
        const candidateFeatures = oblique ? [] : selectedFeatures;
        console.log(selectedFeatures);
        const extent = this.getGeometry().getExtent();
        source.forEachFeatureIntersectingExtent(extent, function (feature) {
            candidateFeatures.push(feature);
        });
        console.log(oblique);
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

export const TranslateInteraction = (select) =>{
    const translate = new Translate({
        condition : function (event){
            return primaryAction(event) && platformModifierKeyOnly(event);
        },
        features : select.getFeatures(),
    });

    return translate;
}

export const SnapInteraction = (source)=>( new Snap({
        source : source
    })
);
       
export default Modify;
