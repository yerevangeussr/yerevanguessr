    const script = document.createElement("script");
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=b724f9e6-7c75-4c36-aede-2d13f4718286&lang=en_US`;
    document.head.appendChild(script);
    // Run when the API loads
    script.onload = () => {
       
       function newGame() {
            let guessCoords = [0, 0];
            let panorama, miniMap, guessPlacemark, correctPlacemark, polyline, realPos;
            ymaps.ready(function () {

            // Initialize map
            var miniMap = new ymaps.Map("map", {
                center: [40.17, 44.51],
                zoom: 10,
                controls: [],
                yandexMapDisablePoiInteractivity: true
            }, {
                suppressMapOpenBlock: true
            });
            
            function safeDestroy(obj) {
                
                try { console.log(8),obj?.destroy?.(); } catch { console.log(99)/* ignore */ }
            }

            /*
            // Placemark variable so we can move it instead of creating new ones each time
            var myPlacemark = null;

            // Custom behavior: place placemark on click and log coordinates
            function MyBehavior() {
                this.options = new ymaps.option.Manager();
                this.events = new ymaps.event.Manager();
            }

            MyBehavior.prototype = {
                constructor: MyBehavior,
                enable: function () {
                    this._parent.getMap().events.add('click', this._onClick, this);
                },
                disable: function () {
                    this._parent.getMap().events.remove('click', this._onClick, this);
                },
                setParent: function (parent) { this._parent = parent; },
                getParent: function () { return this._parent; },

                _onClick: function (e) {
                    var coords = e.get('coords');
                    guessCoords = coords;
                    // If placemark exists — move it; otherwise create it
                    if (myPlacemark) {
                        myPlacemark.geometry.setCoordinates(coords);
                    } else {
                        myPlacemark = new ymaps.Placemark(coords, {
                            balloonContent: 'Вы кликнули сюда'
                        }, {
                            draggable: true
                        });
                        this._parent.getMap().geoObjects.add(myPlacemark);
                    }

                    // Output the precise coordinates
                    console.log("Clicked coordinates:", coords);
                    console.log(`Координаты: ${coords[0].toFixed(6)}, ${coords[1].toFixed(6)}`);
                }
            };

            // Add the new behavior type to storage
            ymaps.behavior.storage.add('mybehavior', MyBehavior);

            // Enable our behavior
            miniMap.behaviors.enable('mybehavior');
            */
           miniMap.events.add('click', (e) => {
                const coords = e.get('coords');
                guessCoords = coords;
                if (guessPlacemark) miniMap.geoObjects.remove(guessPlacemark);
                guessPlacemark = new ymaps.Placemark(coords, {}, { preset: 'islands#greenDotIcon' });
                miniMap.geoObjects.add(guessPlacemark);
            });
        
            /*let coord = [0, 0];
            function getPanorama() {
            // Locate panorama for Moscow example coords
            panorama = safeDestroy(panorama);
            coord = getRandomCoord();
            var locateRequest = ymaps.panorama.locate(coord);
            
            // The ymaps.panorama.locate function returns a Promise object,
            // which is resolved by an array with the found panorama, or an empty
            // array, if a panorama wasn't found near the point.
            
            locateRequest.then(
            function (panoramas) {
                if (panoramas.length) {

                    console.log(coord);
                    var panorama = new ymaps.panorama.Player('panorama', panoramas[0], {
                        // Panorama options. 
                        // direction - viewing direction.
                        direction: [0, -50],
                        controls: [],
                        suppressMapOpenBlock: true,
                        layer: { panoramaMarkers: false }
                        
                    })
                    coord = panorama.getPosition()
                    }
                    
                    else {
                        console.log(1);
                        getPanorama();
                    };
            });
            
            }*/
            async function findPanoramaRandom() {
                try {
                    const arr = await ymaps.panorama.locate(getRandomCoord());
                    const panos = Array.isArray(arr) ? arr : arr?.data || [];
                    const valid = panos.filter((p) => p?.getPosition?.());
                    console.log(arr, panos, valid)
                    if (valid.length) return valid[0];
                } catch { /* ignore */ }
                
                return null;
                }

            async function loadPanorama() {
                panorama = safeDestroy(panorama)
                const pano = await findPanoramaRandom();
                console.log(pano)
                if (!pano) {
                    return loadPanorama();
                }

                realPos = pano.getPosition();

                panorama = new ymaps.panorama.Player('panorama', pano, {
                    controls: [],
                    suppressMapOpenBlock: true,
                    layer: { panoramaMarkers: false }
                });
            }

            document.querySelector(".guess").addEventListener("click", function () {
                var distance = ymaps.coordSystem.geo.getDistance(guessCoords, realPos);
                document.querySelector(".guess_text").innerText = `Your score is ${calculatePoints(distance)} points.`;
                console.log(`Your guess is ${(distance / 1000).toFixed(2)} km away from the actual location.`);
                

                var actualPoint = new ymaps.Placemark(realPos, {}, {
                    preset: 'islands#redIcon'
                });
                miniMap.geoObjects.add(actualPoint);

                var myPolyline = new ymaps.Polyline([guessCoords, realPos], {}, {
                    strokeColor: '#00d4aa',
                    strokeWidth: 3,
                    strokeStyle: 'dash'   // Line transparency
                });

                
                miniMap.geoObjects.add(myPolyline);
            });
            loadPanorama();
            document.querySelector(".newGame").addEventListener("click", function () {
        
            // Clear previous map objects
            miniMap.geoObjects.removeAll();
            loadPanorama();
           
        });
        });

        
    }
    newGame();

    function getRandomCoord() {
        // Latitude: between 40.099999 and 40.240000
        const minLat = 40.099999;
        const maxLat = 40.240000;
        const lat = Math.random() * (maxLat - minLat) + minLat;

        // Longitude: between 44.390000 and 44.619999
        const minLon = 44.390000;
        const maxLon = 44.619999;
        const lon = Math.random() * (maxLon - minLon) + minLon;

        return [lat, lon];
    }   
    
    function calculatePoints(distance) {
        const maxDistance = 15000; // 15 km → 0 points
        const minDistance = 300;   // 0.3 km → 5000 points
    
        if (distance >= maxDistance) return 0;
        if (distance <= minDistance) return 5000;
    
        // Exponential rise: closer = more points
        const normalized = (distance - minDistance) / (maxDistance - minDistance); // 0..1
        const points = Math.round(5000 * Math.pow(1 - normalized, 2)); // squared for exponential effect
    
        return points;
    }

    }