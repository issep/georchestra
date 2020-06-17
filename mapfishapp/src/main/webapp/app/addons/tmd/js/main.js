/*global
 Ext, GeoExt, OpenLayers, GEOR

JSTS version : 0.11.1
    Needs Javascript Topology suite (JSTS)
    2 files : jsts2.js, javascript.util.js (http://gis.ibbeck.de/ginfo/apps/OLExamples/OL210/JSTS_Example/jsts_example.asp )
*/
Ext.namespace("GEOR.Addons");

//Replace Template by a representative name
GEOR.Addons.Tmd = Ext.extend(GEOR.Addons.Base, {

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
                iconCls: "addon-tmd",
                handler: this._sampleHandler,
                scope: this
            });
            this.target.doLayout();
        } else {
            // create a menu item for the "tools" menu:
            this.item = new Ext.menu.CheckItem({
                text: this.getText(record),
                qtip: this.getQtip(record),
                iconCls: "addon-tmd",
                checked: false,
                listeners: {
                    "checkchange": this._sampleHandler,
                    scope: this
                }
            });
        }
    //console.log(record);

    this.initMap();
    /*
    style = new OpenLayers.StyleMap({
        "default": new OpenLayers.Style({
            strokeColor: "#339933",
            strokeOpacity: 1,
            strokeWidth: 3,
            pointRadius: 6,
        }),
        "select": new OpenLayers.Style({
            strokeColor: "#ffffff",
            strokeOpacity: 1,
            strokeWidth: 3,
            pointRadius: 6,
        })
    });
    */
    var layerOptions = OpenLayers.Util.applyDefaults(
        this.layerOptions, 
        {
            //styleMap: style,
            displayInLayerSwitcher: true
        }
    );
    this.layer = new OpenLayers.Layer.Vector("TMD", layerOptions);
    this.layer_isochrones = new OpenLayers.Layer.Vector("TMD isochrones 7/12 min.", layerOptions);
    //this.map.addLayer(layer);
    },

    /**
     *
     */
    _sampleHandler: function() {
        GEOR.helper.msg(this.options.title, this.tr("tmd_helper_message"))
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
     *      *  Convenience method to make sure that the map object is correctly set.
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
        this.layer.destroyFeatures();
        this.layer_isochrones.destroyFeatures();
        this.map.removeLayer(this.layer);
        this.map.removeLayer(this.layer_isochrones);
        GEOR.Addons.Base.prototype.destroy.call(this);
    },
    
    //=========================================================================
    createWindow: function() {
        /*
        var FIELD_WIDTH = 170,
        base = {
            forceSelection: true,
            editable: false,
            triggerAction: 'all',
            mode: 'local',
            width: FIELD_WIDTH,
            labelSeparator: OpenLayers.i18n("labelSeparator"),
            valueField: 'value',
            displayField: 'text'
        };
        */

        /*
        this.typeRisque = new Ext.form.ComboBox(Ext.apply({
            name: "typerisque",
            fieldLabel: OpenLayers.i18n("Type de risque"),
            value: this.options.defaultType,
            store: new Ext.data.SimpleStore({
                fields: ['value', 'text'],
                data: this.options.typesTransportData
            })
        }, base));
        */

        // create a Record constructor for transport types:
        this.rt = Ext.data.Record.create([
            {name: 'id'},
            {name: 'produit'},
            {name: 'description'},
            {name: 'remarques'},
            {name: 'the_geom'},
            {name: 'typerisque'},
            {name: 'entreprise'},
            {name: 'denom'},
            {name: 'entrepriseNom'},
            {name: 'radiuszdi'},
            {name: 'radiuszr'},
            {name: 'radiuszv'},
            {name: 'materials'}
        ]);

        // creates a grid populated by all transport types
        this.grid = new Ext.grid.GridPanel({
            store: new Ext.data.Store({
                autoDestroy: true,
                reader: new Ext.data.ArrayReader(
                    {
                        idIndex: 0  // id for each record will be the first element
                    },
                    this.rt // recordType
                ),//reader,
                //data are defined in config.json
                data: this.options.typesTransportData//xg.dummyData
            }),
            colModel: new Ext.grid.ColumnModel({
                defaults: {
                    width: 120,
                    sortable: true
                },
                columns: [
                    //{id: 'id', header: 'ID', width: 200, sortable: true, dataIndex: 'id'},
                    {header: tr('tmd.grid.header.type'), dataIndex: 'typerisque', width: 50},
                    {header: tr('tmd.grid.header.product'), dataIndex: 'produit'},
                    {header: tr('tmd.grid.header.radiuszdi'), dataIndex: 'radiuszdi', width: 60},
                    {header: tr('tmd.grid.header.radiuszr'), dataIndex: 'radiuszr', width: 60},
                    {header: tr('tmd.grid.header.radiuszv'), dataIndex: 'radiuszv', width: 60},
                    {header: tr('tmd.grid.header.company'), dataIndex: 'entreprise'},
                    {header: tr('tmd.grid.header.carrier'), dataIndex: 'denom'},
                ]
            }),
            viewConfig: {
                forceFit: true,
                //Return CSS class to apply to rows depending upon data values
                getRowClass: function(record, index) {
                    var c = record.get('typerisque');
                    switch(c) {
                        case "TO":
                            return 'typerisque-to';
                            break;
                        case "SU":
                            return 'typerisque-su';
                            break;
                        case "CH":
                            return 'typerisque-ch';
                            break;
                        default: break;
                    }
                }
            },
            //autoExpandColumn : 1,//ne peut pas être zéro
            //autoExpandMin : 10,
            sm: new Ext.grid.RowSelectionModel({singleSelect:true}),
            //width: 600,
            height: 300,
            //autoHeight: true,
            //frame: true,
            title: OpenLayers.i18n("tmd.grid.title"),
            iconCls: 'icon-grid',
            options: this.options,
            currentTypeTransport: -1,
            currentRecord: null,
            listeners: {
                rowclick : function(grid, rowIndex, event){
                    this.currentRecord = grid.getSelectionModel().getSelected();
                    this.currentTypeTransport = rowIndex;
                    grid.setTitle("Type sélectionné : " + 
                        this.currentRecord.data["typerisque"] + " - " +
                        this.currentRecord.data["denom"] + " - " +
                        this.currentRecord.data["produit"] + " - (" +
                        this.currentRecord.data["radiuszdi"] + "/" +
                        this.currentRecord.data["radiuszr"] + "/" +
                        this.currentRecord.data["radiuszv"] + ")"
                    );
                    console.log("currentRecord.data.id : " + this.currentRecord.data.id + this.currentRecord.data["produit"]);
                    /*console.log('[TESTS] radiuses : ' +
                        this.currentRecord.data["RadiusZdi"] + '/' +
                        this.currentRecord.data["RadiusZr"] + '/' +
                        this.currentRecord.data["RadiusZv"]
                    );
                    */
                }
            }  
        });

        return new Ext.Window({
            closable: true,
            closeAction: 'close',
            width: 1000,
            height: 400,
            title: OpenLayers.i18n("tmd.title"),
            border: false,
            buttonAlign: 'left',
            layout: 'fit',
            items: [{
                xtype: 'form',
                labelWidth: 120,
                bodyStyle: "padding:5px;",
                items: [
                    //this.typeRisque,
                    this.grid
                    //this.vectorFormatField,
                    //this.rasterFormatField,
                    //this.resField,
                    //this.emailField
                ]
            }],
            fbar: ['->',
                {
                    text: OpenLayers.i18n("Effacer"),
                    handler: function() {
                        this.layer.removeAllFeatures({silent: true});
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
                    /*
                    if (!this.layer.features.length) {
                        this.layer.addFeatures([
                            new OpenLayers.Feature.Vector(
                                this.map.getExtent().scale(0.83).toGeometry()
                            )
                        ]);
                    }
                    */
                    this.map.addLayer(this.layer);
                    this.map.addLayer(this.layer_isochrones);
                    /*
                    this.map.zoomToExtent(
                        this.layer.features[0].geometry.getBounds().scale(1.2)
                    );
                    this.modifyControl = new OpenLayers.Control.ModifyFeature(
                        this.layer, {
                            standalone: true,
                            mode: OpenLayers.Control.ModifyFeature.RESHAPE |
                                  OpenLayers.Control.ModifyFeature.RESIZE |
                                  OpenLayers.Control.ModifyFeature.DRAG,
                            autoActivate: true
                    });
                    this.map.addControl(this.modifyControl);
                    this.modifyControl.selectFeature(this.layer.features[0]);
                    */
                    this.control = this.initDrawControls(this.layer);
                    this.grid.store.sort([
                        {field: "typerisque", direction: "ASC"},
                        {field: "radiuszdi", direction: "DESC"}
                    ]);
                },
                "close": function() {
                    /*
                    this.map.removeControl(this.modifyControl);
                    this.modifyControl.unselectFeature(this.layer.features[0]);
                    */
                    //this.map.removeLayer(this.layer);
                    
                    //this.layer.destroyFeatures();
                    /*
                    this.item && this.item.setChecked(false);
                    this.components && this.components.toggle(false);
                    this.layerRecord = null;
                    */
                    this.window = null;
                    //console.log('[TESTS] currentTypeTransport : ' + this.options.typesTransportData[this.grid.currentTypeTransport][7]);//ok, fonctionne
                    this.control.deactivate();
                    this.map.removeControl(this.control);
                    this.control = null;
                },
                scope: this
            }
        });
    },

    /** private: method[initDrawControls]
     *      *  :param layer: ``OpenLayers.Layer.Vector``
     *           *  Create DrawFeature controls linked to the passed layer and
     *                *  depending on its geometryType property and add them to the map.
     *                     *  GeoExt.Action are also created and pushed to the actions array.
     *                          */
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
        //iconCls = "gx-featureediting-draw-point";
        //tooltip = OpenLayers.i18n("annotation.create_point");

        control = new OpenLayers.Control.DrawFeature(layer, handler, options);
        //this.drawControls.push(control);

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
        //parser.inject(OpenLayers.Geometry.Point, OpenLayers.Geometry.LineString, OpenLayers.Geometry.LinearRing, OpenLayers.Geometry.Polygon, OpenLayers.Geometry.MultiPoint, OpenLayers.Geometry.MultiLineString, OpenLayers.Geometry.MultiPolygon);//Openlayers >=3

        // convert the OpenLayers geometry to a JSTS geometry
        var jstsGeom = parser.read(event.feature.geometry);

        //console.log("zdi : " + this.grid.currentRadiusZdi + "/zr : " + this.grid.currentRadiusZr + "/zv : " + this.grid.currentRadiusZv);
        
        // create tmd buffers
        // needs lat correction
        var bufferedzdi = jstsGeom.buffer(parseInt(this.grid.currentRecord.data["radiuszdi"])/Math.cos(geometry4326.y*Math.PI/180));
        var bufferedzr = jstsGeom.buffer(parseInt(this.grid.currentRecord.data["radiuszr"])/Math.cos(geometry4326.y*Math.PI/180));
        var bufferedzv = jstsGeom.buffer(parseInt(this.grid.currentRecord.data["radiuszv"])/Math.cos(geometry4326.y*Math.PI/180));
        
        //create external ring for zv (sym difference)
        bufferedzv = bufferedzv.symDifference(bufferedzr);
        
        //create middle ring for zr (sym difference)
        bufferedzr = bufferedzr.symDifference(bufferedzdi);
        
        
        var fzdi = new OpenLayers.Feature.Vector(
            parser.write(bufferedzdi),
            null, 
            { 
                fillColor: 'red',
                fillOpacity: 0.5,
                stroke: false,
                label: this.grid.currentRecord.data["typerisque"] + " : " + this.grid.currentRecord.data["denom"],
                labelColor: "#000000",
                fontWeight: "bold",
                fontOpacity: 1
            }
        );
        
        fzdi.attributes = {"zone": "danger immédiat"};

        var fzr = new OpenLayers.Feature.Vector(
            parser.write(bufferedzr),
            null,
            {
                fillColor: 'orange',
                fillOpacity: 0.5,
                stroke: false
            }
        );
        
        fzr.attributes = {"zone": "risque"};
        
        var fzv = new OpenLayers.Feature.Vector(
            parser.write(bufferedzv),
            null,
            {
                fillColor: 'yellow',
                fillOpacity: 0.5,
                stroke: false
            }
        );
        
        fzv.attributes = {"zone": "vigilance"};

        this.layer.addFeatures([fzdi, fzr, fzv]);
        this.layer.setOpacity(0.75);


        //console.log('feature added');

        //Isochrones (openrouteservice.org), 7 et 12 minutes à partir du point de l'accident
        OpenLayers.Request.GET({
            url: 'https://api.openrouteservice.org/isochrones',
            params: {
                api_key: '5b3ce3597851110001cf624880cfae12bd97407387e08cb9124e617f',
                profile: 'driving-car',
                locations: geometry4326_str,
                range: '420,720',//7 et 12 minutes,
                location_type: 'destination',
                smoothing: 0
            },
            //proxy: "/cgi-bin/proxy.cgi?url=",
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
