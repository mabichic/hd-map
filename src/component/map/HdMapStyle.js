import Style from "ol/style/Style";
import Text from 'ol/style/Text';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import Circle from 'ol/style/Circle'
import Point from "ol/geom/Point";
const HdMapStyle = function(feature, resolution) {
    var zoom = Math.log2(156543.03390625) - Math.log2(resolution);

    //19 - 20 전에는 노드 없어도 되지 않을까
    if(feature.get('group') === 'LAYER_POI'){
        return  new Style({
            text: new Text({
                font: '12px Verdana',
                scale: 1,
                text: feature.get('Name'), 
                fill: new Fill({ color: 'red' }),
                stroke: new Stroke({ color: 'yellow', width: 3 }),
                offsetY : -10, 
            }), 
            image: new Circle({
                radius: 3,
                fill: new Fill({
                color: 'RED',
                }),
            }),
        });
    }
    if(feature.get('group') === 'LAYER_LANESIDE'){
        var storkeColor="#ffffff";
        var lineDash = 0;
        var color = feature.get("Color"); 
        var type = feature.get("Type");
        if(color === "LS_WHITE") storkeColor='WHITE';
        if(color === "LS_YELLOW") storkeColor='YELLOW';
        if(color === "LS_BLUE") storkeColor='BLUE';
        
        if(type === "LS_SOLID") lineDash=[0];
        if(type === "LS_DOT") lineDash=[10,10];
        if(type === "LS_DOUBLE") lineDash=[20,20];
        // if(type === 'LS_BOUNDARY') lineDash=[40,40];
        if(type === "LS_VIRTUAL") lineDash=[50,50];
        return new Style({
            stroke: new Stroke({
                color:storkeColor, width:2, lineDash: lineDash,
            }),
        });
    }
    if(feature.get('group') === 'LAYER_LN_NODE'){
        if(zoom<19) return null;
        
        return new Style({
            image: new Circle({
                radius: 5,
                fill: new Fill({
                color: '#FFFF00',
                }),
            }),
        });
        
    }
    if(feature.get('group') === 'LAYER_LN_LINK'){
        if(zoom<19) return null;
        return new Style({
            stroke: new Stroke({
                color:'BLACK', width:4
            }),
        });
    }
    if(feature.get('group') === 'LAYER_ROADMARK'){
        var color = 'RED';
        var type = feature.get("Type"); 
        if(type==="RM_CROSSWALK") color = 'WHITE';
        if(type==="RM_SPEEDBUMP") color = 'YELLOW';
        if(type==="RM_ARROW") color = '#CCCCFF';
        if(type==="RM_NUMERIC") color = '#999966';
        if(type==="RM_CHAR") color = '#CC66CC';
        if(type==="RM_SHAPE") color = '#FF66FF';
        if(type==="RM_STOPLINE") color = 'RED';
        if(type==="RM_BUSSTOP") color = 'BLUE';
        if(type==="RM_VIRTUAL_STOPLINE") color = '#CC3333';
        return new Style({
            fill: new Fill({
                    color: color,
            }),
        });
    }
    if(feature.get('group') === 'LAYER_ROADLIGHT'){
        if(zoom<19) return null;
        const geometry = feature.getGeometry();
        let styles  = [];
        styles.push(
            new Style({
                stroke: new Stroke({
                    color:'rgba(0,0,0,1)', width:4
                }),
            })
        );
        styles.push(
            new Style({
                geometry: new Point(geometry.getLastCoordinate()),
                image: new Circle({
                    radius: 5,
                    fill: new Fill({
                        color: 'rgba(0,0,255,1)'
                    })
                }), 
            })
        );
        styles.push(
            new Style({
                geometry: new Point(geometry.getFirstCoordinate()),
                image: new Circle({
                    radius: 5,
                    fill: new Fill({
                        color: 'rgba(255,0,0,1)'
                    })
                })
            })
        );
        return styles;
    }

    if(feature.get('group') === 'GPS_LOG'){
        return new Style({
            stroke: new Stroke({
                color:'RED', width:4
            }),
        });
    }

};

export default HdMapStyle;