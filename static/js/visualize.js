/**
🈶初始的经纬度，方位角，距离计算落点
**/


function landingLatLon(lat, lon, bearing, distance) {
	var a = 6378137.06; // radius at equator

	var phi1 = lat * Math.PI / 180;
	var L1 = lon * Math.PI / 180;
	var alpha1 = bearing * Math.PI / 180;
	var delta = distance * 1000 / a;

	var phi2 = Math.asin(Math.sin(phi1) * Math.cos(delta) +
		Math.cos(phi1) * Math.sin(delta) * Math.cos(alpha1));
	var dL = Math.atan2(Math.sin(alpha1) * Math.sin(delta) * Math.cos(phi1),
		Math.cos(delta) - Math.sin(phi1) * Math.sin(phi2));
	var L2 = (L1 + dL + 3 * Math.PI) % (2 * Math.PI) - Math.PI;

	return {'lat': phi2 * 180 / Math.PI, 'lon': L2 * 180 / Math.PI};
}

// For best precision
/**
	由球面坐标反推另一个点
	*/
function vincenty(lat, lon, bearing, distance) {
	//console.log();
	var a = 6378137.06; // radius at equator
	var f = 1/298.257223563; // flattening of the ellipsoid
	var b = (1 - f) * a; // radius at the poles

	var phi1 = lat * Math.PI / 180;
	var L1 = lon * Math.PI / 180;
	var alpha1 = bearing * Math.PI / 180;
	var s = distance * 1000; // in meters

	var sinAlpha1 = Math.sin(alpha1);
	var cosAlpha1 = Math.cos(alpha1);

	var tanU1 = (1 - f) * Math.tan(phi1);
	var cosU1 = 1 / Math.sqrt((1 + tanU1 * tanU1));
	var sinU1 = tanU1 * cosU1;

	var sigma1 = Math.atan2(tanU1, cosAlpha1);
	var sinAlpha = cosU1 * sinAlpha1;
	var sinSqAlpha = sinAlpha * sinAlpha;
	var cosSqAlpha = 1 - sinSqAlpha;
	var uSq = cosSqAlpha * (a * a - b * b) / (b * b);
	var A = 1 + uSq / 16384 * (4096 + uSq * (-768 + uSq * (320 - 175 * uSq)));
	var B = uSq / 1024 * (256 + uSq * (-128 + uSq * (74 - 47 * uSq)));

	var sigma = s / (b * A), sigma0;
	do {
		var cos2SigmaM = Math.cos(2 * sigma1 + sigma);
		var cosSq2SigmaM = cos2SigmaM * cos2SigmaM;
		var sinSigma = Math.sin(sigma);
		var cosSigma = Math.cos(sigma);
		var dSigma = B * sinSigma * ( cos2SigmaM + B / 4 * (cosSigma * (-1 + 2 * cosSq2SigmaM) -
			B / 6 * cos2SigmaM * (-3 + 4 * sinSigma * sinSigma) * (-3 + 4 * cosSq2SigmaM)));
		sigma0 = sigma;
		sigma = s / (b * A) + dSigma;
	} while (Math.abs(sigma0 - sigma) > 1e-12);

	var tmp = sinU1 * sinSigma - cosU1 * cosSigma * cosAlpha1;
	var phi2 = Math.atan2(
		sinU1 * cosSigma + cosU1 * sinSigma * cosAlpha1,
		(1 - f) * Math.sqrt(sinSqAlpha + tmp * tmp)
	);
	var lamda = Math.atan2(
		sinSigma * sinAlpha1,
		cosU1 * cosSigma - sinU1 * sinSigma * cosAlpha1
	);
	var C = f / 16 * cosSqAlpha * (4 + f * (4 - 3 * cosSqAlpha));
	var L = lamda - (1 - C) * f * sinAlpha * (sigma + C * sinSigma * (
		cosSq2SigmaM + C * cosSigma * (-1 + 2 * cosSq2SigmaM )
	));
	var L2 = L + L1;

	var test = {'lat': phi2 * 180 / Math.PI, 'lon': L2 * 180 / Math.PI};

	return {'lat': phi2 * 180 / Math.PI, 'lon': L2 * 180 / Math.PI};
}

function buildDataVizGeometries( linearData ){

	var sphereRad = 1;
	var rad = 100;
	var loadLayer = document.getElementById('loading');

	for( var i in linearData ){
		var yearBin = linearData[i].data;


		var year = linearData[i].year;
		yearIndexLookup[year] = i;

		var count = 0;
		console.log('Building data for ...' + year);
		for( var s in yearBin ){
			var set = yearBin[s];

			var seriesPostfix = set.series ? ' [' + set.series + ']' : '';
			set.testName = (set.date + ' ' + missileLookup[set.missile].name + seriesPostfix).toUpperCase();

			var facilityName = set.facility;
			facility = facilityData[facilityName];

			//	we couldn't find the facility, it wasn't in our list...
			if( facility === undefined )
				continue;

			var distance = set.distance;
			if (isNaN(distance)) {
				distance = 0;
			}

			var apogee = set.apogee;
			if (apogee === 'unknown' && distance > 0) {
				// minimum energy trajectory
				apogee = -0.000013 * distance * distance + 0.26 * distance;
			}
			if (isNaN(apogee)) {
				apogee = 0;
			}

			var landing = landingLatLon(facility.lat, facility.lon, set.bearing, distance);
			var lon = landing.lon - 90;
			var lat = landing.lat;
			var phi = Math.PI/2 - lat * Math.PI / 180;
			var theta = 2 * Math.PI - (lon - 9.9) * Math.PI / 180;

			var lcenter = new THREE.Vector3();
			lcenter.x = Math.sin(phi) * Math.cos(theta) * rad;
			lcenter.y = Math.cos(phi) * rad;
			lcenter.z = Math.sin(phi) * Math.sin(theta) * rad;

			set.landingLocation = {
				name: set.landing,
				lat: landing.lat,
				lon: landing.lon,
				center: lcenter
			};

			if (distance == 0) {
				set.markerOnLeft = true;
			}

			//	visualize this event
			set.lineGeometry = makeConnectionLineGeometry( facility, set.landingLocation, apogee );

			testData[set.testName] = set;

		}

	}

	loadLayer.style.display = 'none';
}



function selectVisualization( linearData, year, tests, outcomeCategories, missileCategories ){
	//	we're only doing one test for now so...
	var cName = tests[0].toUpperCase();

	previouslySelectedTest = selectedTest;
	selectedTest = testData[tests[0].toUpperCase()];



	//	clear children
	/**
	清楚所有的已有轨迹
	**/
	while( visualizationMesh.children.length > 0 ){
		var c = visualizationMesh.children[0];
		visualizationMesh.remove(c);
	}


    // 核心代码
	//	build the mesh
	console.time('getVisualizedMesh');
	var mesh = getVisualizedMesh( timeBins, year, outcomeCategories, missileCategories );
	console.timeEnd('getVisualizedMesh');

	//	add it to scene graph
	visualizationMesh.add( mesh );


	/**
	这段代码和加载中心有关和绘图无关
	**/
	if( previouslySelectedTest !== selectedTest ){
		if( selectedTest ){
			var facility = facilityData[selectedTest.facility];
			var landing = selectedTest.landingLocation;

			rotateTargetX = (facility.lat + landing.lat) / 2 * Math.PI / 180;
			var targetY0 = -((facility.lon + landing.lon) / 2 - 9.9) * Math.PI / 180;
			var piCounter = 0;
			while(true) {
				var targetY0Neg = targetY0 - Math.PI * 2 * piCounter;
				var targetY0Pos = targetY0 + Math.PI * 2 * piCounter;
				if(Math.abs(targetY0Neg - rotating.rotation.y) < Math.PI) {
					rotateTargetY = targetY0Neg;
					break;
				} else if(Math.abs(targetY0Pos - rotating.rotation.y) < Math.PI) {
					rotateTargetY = targetY0Pos;
					break;
				}
				piCounter++;
				rotateTargetY = wrap(targetY0, -Math.PI, Math.PI);
			}

			rotateVX *= 0.6;
			rotateVY *= 0.6;

			scaleTarget = 90 / (landing.center.clone().sub(facility.center).length() + 30);
		}
	}

	d3Graphs.initGraphs();
}