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

           miniMap.events.add('click', (e) => {
                const coords = e.get('coords');
                guessCoords = coords;
                if (guessPlacemark) miniMap.geoObjects.remove(guessPlacemark);
                guessPlacemark = new ymaps.Placemark(coords, {}, { preset: 'islands#greenDotIcon' });
                miniMap.geoObjects.add(guessPlacemark);
            });
    
            async function findPanoramaRandom() {
                try {
                    const arr = await ymaps.panorama.locate(getRandomCoord());
                    const panos = Array.isArray(arr) ? arr : arr?.data || [];
                    const valid = panos.filter((p) => p?.getPosition?.());
                    if (valid.length) return valid[0];
                } catch { /* ignore */ }
                
                return null;
                }

            async function loadPanorama() {
                panorama = safeDestroy(panorama)
                const pano = await findPanoramaRandom();
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
                let points = calculatePoints(distance);
                let color = "white";
                if (points >= 4000) {
                    color = "#8CFF85";
                }
                else {
                    color = "#FF616B";
                }
                document.querySelector(".guess_points").innerHTML = `Your score is <p class="points" style="margin:0; display:inline;color: ${color}; text-shadow: 0px 0px 10px ${color};">${calculatePoints(distance)}</p>/6000 points.`;
                document.querySelector(".guess_km").innerText = `Your guess is ${(distance / 1000).toFixed(2)} km away from the actual location.`;
                

                var actualPoint = new ymaps.Placemark(realPos, {}, {
                    preset: 'islands#redIcon'
                });
                miniMap.geoObjects.add(actualPoint);

                var myPolyline = new ymaps.Polyline([guessCoords, realPos], {}, {
                    strokeColor: '#8CFF85',
                    strokeWidth: 3,
                    strokeStyle: 'dash'   // Line transparency
                });

                document.querySelector(".guess").disabled = true;
                miniMap.geoObjects.add(myPolyline);

                x = document.querySelector(".bg_blocker");
                y = document.querySelector(".guess_container");
                x.style.opacity = 0;
                x.style.display = "flex";
                y.style.right = '-100%';

                // Small timeout to ensure reset takes effect
                setTimeout(() => {
                    // Fade in x
                    x.style.opacity = 1;

                    const divWidth = y.offsetWidth;
                    const windowWidth = window.innerWidth;
                    y.style.right = `${(windowWidth - divWidth)/2}px`; // adjust final position
                }, 50);
            });
            loadPanorama();
            document.querySelector(".button_newGame").addEventListener("click", function () {
        
            // Clear previous map objects
            document.querySelector(".guess_container").style.right = '-100%'; // slide off-screen left
            document.querySelector(".bg_blocker").style.opacity = 0;
            document.querySelector(".guess").disabled = false;
            // reset after animation ends
            setTimeout(() => {
                document.querySelector(".bg_blocker").style.display = 'none';
            }, 1000); // same as transition duration


            miniMap.geoObjects.removeAll();
            loadPanorama();
           
        });
        });

        
    }
    

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
        const maxDistance = 15000; // 15 km -> 0 points
        const minDistance = 300;   // 0.3 km -> 6000 points
    
        if (distance >= maxDistance) return 0;
        if (distance <= minDistance) return 6000;
    
        // Exponential rise: closer = more points
        const normalized = (distance - minDistance) / (maxDistance - minDistance); // 0..1
        const points = Math.round(6000 * Math.pow(1 - normalized, 2)); // squared for exponential effect
    
        return points;
    }
    document.querySelector(".start").addEventListener("click", () => {
        document.querySelector(".main_menu").style.display = "none";
        newGame();
    })

    } 

