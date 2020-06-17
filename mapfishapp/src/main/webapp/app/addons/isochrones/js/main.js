/*global
 Ext, GeoExt, OpenLayers, GEOR

JSTS version : 0.11.1
    Needs Javascript Topology suite (JSTS)
    2 files : jsts2.js, javascript.util.js (http://gis.ibbeck.de/ginfo/apps/OLExamples/OL210/JSTS_Example/jsts_example.asp )
*/
Ext.namespace("GEOR.Addons");

//Replace Template by a representative name
GEOR.Addons.Isochrones = Ext.extend(GEOR.Addons.Base, {

    window : null,
    layer_isochrones: null,

    /**
     * Method: init
     *
     * Parameters:
     * record - {Ext.data.record} a record with the addon parameters
     */
    init: function(record) {
        if (this.target) {
            // create a button to be inserted in toolbar:
            this.components = this.target.insertButton(this.position, {
                xtype: 'button',
                tooltip: this.getTooltip(record),
                iconCls: "addon-isochrones",
                handler: this._sampleHandler,
                scope: this
            });
            this.target.doLayout();

        } else {
            // create a menu item for the "tools" menu:
            this.item = new Ext.menu.CheckItem({
                text: this.getText(record),
                qtip: this.getQtip(record),
                iconCls: "addon-isochrones",
                checked: false,
                listeners: {
                    "checkchange": this._sampleHandler,
                    scope: this
                }
            });
        }
        //console.log(record);

        this.initMap();
        var layerOptions = OpenLayers.Util.applyDefaults(
        this.layerOptions, 
        {
            //styleMap: style,
            displayInLayerSwitcher: true
        }
        );
        this.layer_isochrones = new OpenLayers.Layer.Vector("Isochrones 7/12 min", layerOptions);
        //this.map.addLayer(layer);
    },

    /**
     *
     */
    _sampleHandler: function() {
        GEOR.helper.msg(this.options.title, this.tr("isochrones_helper_message"));
        //console.log('test...');
        this.window=this.createWindow();
        this.window.show();
    },

    /**
     *
     */
    tr: function(str) {
        return OpenLayers.i18n(str);
    },

    /** private: method[initMap]
     * Convenience method to make sure that the map object is correctly set.
     */
    initMap: function() {
        if (this.map instanceof GeoExt.MapPanel) {
            this.map = this.map.map;
        }

        if (!this.map) {
            this.map = GeoExt.MapPanel.guess().map;
        }
        // if no toggleGroup was defined, set to this.map.id
        if (!this.toggleGroup) {
            this.toggleGroup = this.map.id;
        }
    },
    /**
     * Method: destroy
     *
     */
    destroy: function() {
        //Place addon specific destroy here
        this.layer_isochrones.destroyFeatures();
        this.map.removeLayer(this.layer_isochrones);

        GEOR.Addons.Base.prototype.destroy.call(this);
    },
    
    //=========================================================================
    createWindow: function() {

        return new Ext.Window({
            closable: true,
            closeAction: 'close',
            width: 200,
            height: 100,
            title: OpenLayers.i18n("isochrones.title"),
            border: false,
            buttonAlign: 'left',
            layout: 'fit',
            /*
            items: [{
                xtype: 'form',
                labelWidth: 120,
                bodyStyle: "padding:5px;",
                items: [
                    //this.typeRisque,
                    //this.vectorFormatField,
                    //this.rasterFormatField,
                    //this.resField,
                    //this.emailField
                ]
            }],
            */
            fbar: ['->',
                {
                    text: OpenLayers.i18n("Effacer"),
                    handler: function() {
                        this.layer_isochrones.removeAllFeatures({silent: true});
                    },
                    scope: this
                },
                {
                    text: OpenLayers.i18n("Close"),
                    handler: function() {
                        this.window.close();
                        this.window = null;
                        },
                    scope: this
                }
            ],
            listeners: {
                "show": function() {
                    this.map.addLayer(this.layer_isochrones);
                    this.control = this.initDrawControls(this.layer_isochrones);
                },
                "close": function() {
                    this.window = null;
                    this.control.deactivate();
                    this.map.removeControl(this.control);
                    this.control = null;
                },
                scope: this
            }
        });
    },

    /** private: method[initDrawControls]
     * :param layer: ``OpenLayers.Layer.Vector``
     * Create DrawFeature controls linked to the passed layer and
     * depending on its geometryType property and add them to the map.
     * GeoExt.Action are also created and pushed to the actions array.
     *                          
    **/
    initDrawControls: function(layer) {
        var control, handler, geometryTypes, geometryType,
            options, action, iconCls, actionOptions, tooltip;

        options = {
            handlerOptions: {
                stopDown: true,
                stopUp: true
            }
        };

        handler = OpenLayers.Handler.Point;

        control = new OpenLayers.Control.DrawFeature(layer, handler, options);

        control.events.on({
            "featureadded": this.onFeatureAdded,
            scope: this
        });

        
        actionOptions = {
            control: control,
            map: this.map,
            // button options
            toggleGroup: this.toggleGroup,
            allowDepress: false,
            pressed: false,
            tooltip: tooltip,
            iconCls: iconCls,
            //text: OpenLayers.i18n("annotation." + geometryType.toLowerCase()),
            iconAlign: 'top',
            // check item options
            group: this.toggleGroup,
            checked: false
        };
        action = new GeoExt.Action(actionOptions);
        
        //this.actions.push(action);
        control.activate();

        return control;
    },

    onFeatureAdded: function(event) {
        //console.log(event.feature.geometry);
        

        //Point cloned as start point for tmd isochrones (Openrouteservice)
        var geometry4326 = event.feature.geometry.clone();
        geometry4326 = geometry4326.transform(GEOR.config.MAP_SRS, "EPSG:4326");//ORS needs lon/lat...
        //console.log(geometry4326);
        geometry4326_str = geometry4326.x.toString() + "," + geometry4326.y.toString();//...in the URL
        //console.log(geometry4326_str);
        //var parser = new jsts.io.OL3Parser();//Openlayers >=3
        
        //parser JSTS (version 0.11.1 ok pour Openlayers 2)
        var parser = new jsts.io.OpenLayersParser();

        this.layer_isochrones.setOpacity(0.75);

        //console.log('feature added');

        //Isochrones (openrouteservice.org), 7 et 12 minutes à partir du point
        OpenLayers.Request.GET({
            url: 'https://api.openrouteservice.org/isochrones',
            params: {
                api_key: '5b3ce3597851110001cf624880cfae12bd97407387e08cb9124e617f',
                profile: 'driving-car',
                locations: geometry4326_str,
                range: '420,720',//7 et 12 minutes,
                location_type: 'start',
                smoothing: 0
            },
            proxy: null,
            success: function (response) {
                var jsonReader = new OpenLayers.Format.GeoJSON();
                var features = jsonReader.read(response.responseText);
                for(i=0; i < features.length; i++){
                    console.log(features[i].geometry);
                    features[i].geometry.transform("EPSG:4326", GEOR.config.MAP_SRS);//retransformer dans le CRS de la carte
                }
                var f420 = parser.read(features[0].geometry);
                var f720 = parser.read(features[1].geometry);
                f720 = f720.symDifference(f420);
                features[0] = new OpenLayers.Feature.Vector(
                    parser.write(f420),
                    null,
                    {
                        fillColor: "green",
                        fillOpacity: 0.3,
                        stroke: true,
                        strokeColor: "black",
                        strokeOpacity: 1,
                        strokeWidth: 2
                    }
                );
                features[0].attributes = {"isochrone": "7 minutes"};
                features[1] = new OpenLayers.Feature.Vector(
                    parser.write(f720),
                    null,
                    {
                        fillColor: "red",
                        fillOpacity: 0.3,
                        stroke: true,
                        strokeColor: "black",
                        strokeOpacity: 1,
                        strokeWidth: 2
                    }
                );
                features[1].attributes = {"isochrone": "12 minutes"};
                //console.log(this.layer);
                this.layer_isochrones.addFeatures(features);
                //console.log(features);
            },
            scope: this
        });
    }
});
