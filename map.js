mapboxgl.accessToken = 'pk.eyJ1Ijoic2luZGh1MTkiLCJhIjoiY2t2NDBicWh0MzlheDJwcDZ2Z2hpa3ZrdSJ9.BgVB8bAe1BieSBUm47d2Zg';
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/dark-v10',
    center: [50.09583036227829, 9.050960740284873],
    zoom: 2,
    pitch: 60,
    antialias: true
});

const countries = {
    'germany': {
        center: [9.050960740284873, 50.09583036227829], //germany
        zoom: 5
    },
    'russia': {
        center: [37.53970042515579, 55.7509083952502], //Russia
        zoom: 5
    },
    'china': {
        center: [103.3829085038708, 34.785875541974406], //china
        zoom: 5
    },
    'africa': {
        center: [27.218846895602617, -25.622416124377214], //africa
        zoom: 5
    },
    'canada': {
        center: [-73.56771348315796, 45.49649550157406], //Canada
        zoom: 5
    },
    'china1': {
        center: [103.3829085038708, 34.785875541974406], //production
        zoom: 5
    }
};

const fitBitModelCountries = {
    'germany': {
        center: [9.922655804308208, 51.11748708576705]
    },
    'hongkong': {
        center: [114.14962675651874, 22.33215931683254]
    },
    'spain': {
        center: [3.1062323432580494, 39.564937110430066]
    },
    'ireland': {
        center: [-8.350922557320109, 53.211324440346544]
    },
    'sweden': {
        center: [16.169312094192804, 64.38487212151321]
    }
}

for (const country in countries) {
    let marker = new mapboxgl.Marker()
    marker.setLngLat(countries[country].center)
    marker.addTo(map)
}

function onClickDiv(country) {
    map.flyTo(countries[country]);
    document.getElementById(country).classList.add('active');
}

function addFitBitModelLayer(country) {
    const modelOrigin = [fitBitModelCountries[country].center[0], fitBitModelCountries[country].center[1]];
    const modelAltitude = 0;
    const modelRotate = [Math.PI / 2, 0, 0];

    const modelAsMercatorCoordinate = mapboxgl.MercatorCoordinate.fromLngLat(
        modelOrigin,
        modelAltitude
    );

    // transformation parameters to position, rotate and scale the 3D model onto the map
    const modelTransform = {
        translateX: modelAsMercatorCoordinate.x,
        translateY: modelAsMercatorCoordinate.y,
        translateZ: modelAsMercatorCoordinate.z,
        rotateX: modelRotate[0],
        rotateY: modelRotate[1],
        rotateZ: modelRotate[2],
        /* Since the 3D model is in real world meters, a scale transform needs to be
         * applied since the CustomLayerInterface expects units in MercatorCoordinates.
         */
        scale: modelAsMercatorCoordinate.meterInMercatorCoordinateUnits()
    };

    const THREE = window.THREE;

    // configuration of the custom layer for a 3D model per the CustomLayerInterface
    const customLayer = {
        id: country,
        type: 'custom',
        renderingMode: '3d',
        onAdd: function(map, gl) {
            this.camera = new THREE.Camera();
            this.scene = new THREE.Scene();

            // create two three.js lights to illuminate the model
            const directionalLight = new THREE.DirectionalLight(0xffffff);
            directionalLight.position.set(0, -70, 100).normalize();
            this.scene.add(directionalLight);

            const directionalLight2 = new THREE.DirectionalLight(0xffffff);
            directionalLight2.position.set(0, 70, 100).normalize();
            this.scene.add(directionalLight2);

            // use the three.js GLTF loader to add the 3D model to the three.js scene
            const loader = new THREE.GLTFLoader();
            loader.load(
                'https://docs.mapbox.com/mapbox-gl-js/assets/34M_17/34M_17.gltf',
                (gltf) => {
                    this.scene.add(gltf.scene);
                }
            );
            this.map = map;

            // use the Mapbox GL JS map canvas for three.js
            this.renderer = new THREE.WebGLRenderer({
                canvas: map.getCanvas(),
                context: gl,
                antialias: true
            });

            this.renderer.autoClear = false;
        },
        render: function(gl, matrix) {
            const rotationX = new THREE.Matrix4().makeRotationAxis(
                new THREE.Vector3(1, 0, 0),
                modelTransform.rotateX
            );
            const rotationY = new THREE.Matrix4().makeRotationAxis(
                new THREE.Vector3(0, 1, 0),
                modelTransform.rotateY
            );
            const rotationZ = new THREE.Matrix4().makeRotationAxis(
                new THREE.Vector3(0, 0, 1),
                modelTransform.rotateZ
            );

            const m = new THREE.Matrix4().fromArray(matrix);
            const l = new THREE.Matrix4()
                .makeTranslation(
                    modelTransform.translateX,
                    modelTransform.translateY,
                    modelTransform.translateZ
                )
                .scale(
                    new THREE.Vector3(
                        modelTransform.scale * 50000,
                        -modelTransform.scale * 50000,
                        modelTransform.scale * 50000
                    )
                )
                .multiply(rotationX)
                .multiply(rotationY)
                .multiply(rotationZ);

            this.camera.projectionMatrix = m.multiply(l);
            this.renderer.resetState();
            this.renderer.render(this.scene, this.camera);
            this.map.triggerRepaint();
        }
    };

    map.addLayer(customLayer, 'waterway-label');
}

//Layer to add 3d model
map.on('style.load', () => {
    for (country in fitBitModelCountries) {
        //addFitBitModelLayer(country)
    }
});


function addfitBitImageLayer(country) {
    // Load an image from an external URL.
    map.loadImage(
        '/Walking_Map.png', //Image from folder
        (error, image) => {
            if (error) throw error;

            let imageId = 'image' + country
            let dataSourceId = 'dataSource' + country
            let layerId = 'layer' + country

            // Add the image to the map style.
            map.addImage(imageId, image);

            // Add a data source containing one point feature.
            map.addSource(dataSourceId, {
                'type': 'geojson',
                'data': {
                    'type': 'FeatureCollection',
                    'features': [{
                        'type': 'Feature',
                        'geometry': {
                            'type': 'Point',
                            'coordinates': fitBitModelCountries[country].center
                        }
                    }]
                }
            });

            // Add a layer to use the image to represent the data.
            map.addLayer({
                'id': layerId,
                'type': 'symbol',
                'source': dataSourceId, // reference the data source
                'layout': {
                    'icon-image': imageId, // reference the image
                    'icon-size': 0.1
                }
            });
        }
    );
}

//Layer to add images
map.on('load', () => {
    for (country in fitBitModelCountries) {
        addfitBitImageLayer(country)
    }
});
