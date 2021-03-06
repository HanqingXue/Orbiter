function getLang() {
	var lang = '';
	var match = location.search.match(/lang=(.*?)(&|$)/);
	//var match = location.href.match(/\/([a-z]{2})\/[^\/]*$/);
	if (match) {
		lang = decodeURIComponent(match[1]).substring(0, 2);
	}
	if (lang === 'ja' || lang === 'en') {
		return lang;
	}
	lang = (window.navigator.languages && window.navigator.languages[0]) ||
		window.navigator.language ||
		window.navigator.userLanguage ||
		window.navigator.browserLanguage;
	return (lang && lang.substring(0, 2) === 'ja') ? 'ja' : 'en';
}

function loadLangCSS(lang) {
	if (lang !== 'en') {
		var tags = document.createDocumentFragment();
		var link = document.createElement('link');
		link.rel = 'stylesheet';
		link.type = 'text/css';
		link.href = 'style.' + lang + '.css';
		tags.appendChild(link);
		document.getElementsByTagName('head')[0].appendChild(tags);
	}
}


var Selection = function(selectedYear, selectedTest) {
	this.selectedYear = selectedYear;
	this.selectedTest = selectedTest;

	this.outcomeCategories = new Object();
	/*for (var i in outcomeLookup) {
		this.outcomeCategories[i] = true;
	}*/
	this.missileCategories = new Object();
	for (var i in missileLookup) {
		this.missileCategories[i] = true;
	}

	this.getOutcomeCategories = function() {
		var list = [];
		for (var i in this.outcomeCategories) {
			if (this.outcomeCategories[i]) {
				list.push(i);
			}
		}
		return list;
	}

	this.getMissileCategories = function() {
		var list = [];
		for (var i in this.missileCategories) {
			if (this.missileCategories[i]) {
				list.push(i);
			}
		}
		return list;
	}
};

//	-----------------------------------------------------------------------------
//	All the initialization stuff for THREE
function initScene() {

	//	-----------------------------------------------------------------------------
	//	Let's make a scene
	scene = new THREE.Scene();
	scene.matrixAutoUpdate = false;
	// scene.fog = new THREE.FogExp2( 0xBBBBBB, 0.00003 );

	scene2d = new THREE.Scene();

	scene.add( new THREE.AmbientLight( 0x505050 ) );

	light1 = new THREE.SpotLight( 0xeeeeee, 3 );
	light1.position.x = 730;
	light1.position.y = 520;
	light1.position.z = 626;
	light1.castShadow = true;
	scene.add( light1 );

	light2 = new THREE.PointLight( 0x222222, 14.8 );
	light2.position.x = -640;
	light2.position.y = -500;
	light2.position.z = -1000;
	scene.add( light2 );

	rotating = new THREE.Object3D();
	scene.add(rotating);

	var outlinedMapTexture = new THREE.Texture( mapOutlineImage );
	outlinedMapTexture.needsUpdate = true;

	var mapMaterial = new THREE.MeshBasicMaterial({
		map: outlinedMapTexture,
		polygonOffset: true,
		polygonOffsetFactor: 1,
		polygonOffsetUnits: 1
	});


	//	-----------------------------------------------------------------------------
	sphere = new THREE.Mesh( new THREE.SphereBufferGeometry( 100, 40, 40 ), mapMaterial );
	sphere.doubleSided = false;
	sphere.rotation.x = Math.PI;
	sphere.rotation.y = -Math.PI/2;
	sphere.rotation.z = Math.PI;
	sphere.id = "base";
	rotating.add( sphere );
    /***
	 确定所有的经线和维线
    **/
	var wireframeGeo = new THREE.EdgesGeometry(sphere.geometry, 0.3);
	var wireframeMaterial = new THREE.LineBasicMaterial({
		color: Math.random() * 0xffffff,
		linewidth: 0.5
	});
	var wireframe = new THREE.LineSegments(wireframeGeo, wireframeMaterial);
	sphere.add(wireframe);


	var atmosphereMaterial = new THREE.ShaderMaterial({
		vertexShader: document.getElementById('vertexShaderAtmosphere').textContent,
		fragmentShader: document.getElementById('fragmentShaderAtmosphere').textContent,
		// atmosphere should provide light from behind the sphere, so only render the back side
		side: THREE.BackSide
	});

	var atmosphere = new THREE.Mesh(sphere.geometry.clone(), atmosphereMaterial);
	atmosphere.scale.x = atmosphere.scale.y = atmosphere.scale.z = 1.8;
	rotating.add(atmosphere);


	// load geo data (facility lat lons in this case)
	console.time('loadGeoData');
	loadGeoData( latlonData );
	console.timeEnd('loadGeoData');

	console.time('buildDataVizGeometries');
	var vizilines = buildDataVizGeometries(timeBins);
	console.timeEnd('buildDataVizGeometries');

	visualizationMesh = new THREE.Object3D();
	rotating.add(visualizationMesh);

	var latestBin = timeBins[timeBins.length - 1];
	var selectedYear = latestBin.year;

	var latestTest = latestBin.data[latestBin.data.length - 1];
	var selectedTestName = latestTest.testName;

	selectionData = new Selection(selectedYear, selectedTestName);


	selectVisualization(timeBins, selectedYear, [selectedTestName], Object.keys(outcomeLookup), Object.keys(missileLookup));


	//	-----------------------------------------------------------------------------
	//	Setup our renderer
	renderer = new THREE.WebGLRenderer({antialias:false});
	renderer.setPixelRatio(dpr);
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.autoClear = false;

	renderer.sortObjects = false;
	renderer.generateMipmaps = false;

	glContainer.appendChild( renderer.domElement );


	//	-----------------------------------------------------------------------------
	//	Event listeners
	document.addEventListener( 'mousemove', onDocumentMouseMove, true );
	document.addEventListener( 'touchmove', onDocumentMouseMove, true );
	document.addEventListener( 'windowResize', onDocumentResize, false );

	//masterContainer.addEventListener( 'mousedown', onDocumentMouseDown, true );
	//masterContainer.addEventListener( 'mouseup', onDocumentMouseUp, false );
	document.addEventListener( 'mousedown', onDocumentMouseDown, true );
	document.addEventListener( 'touchstart', onDocumentMouseDown, true );
	document.addEventListener( 'mouseup', onDocumentMouseUp, false );
	document.addEventListener( 'touchend', onDocumentMouseUp, false );
	document.addEventListener( 'touchcancel', onDocumentMouseUp, false );

	var mc = new Hammer(document);
	mc.get('pinch').set({ enable: true });
	mc.get('pan').set({ threshold: 0, pointers: 3, direction: Hammer.DIRECTION_VERTICAL });
	mc.on('pinchstart pinchmove', onDocumentPinch);
	mc.on('panmove', onDocumentPan);

	masterContainer.addEventListener( 'click', onClick, true );
	masterContainer.addEventListener( 'mousewheel', onMouseWheel, false );

	//	firefox
	masterContainer.addEventListener( 'DOMMouseScroll', function(e){
			var evt=window.event || e; //equalize event object
			onMouseWheel(evt);
	}, false );

	document.addEventListener( 'keydown', onKeyDown, false);

	//	-----------------------------------------------------------------------------
	//	Setup our camera
	var aspect = window.innerWidth / window.innerHeight;
	camera = new THREE.PerspectiveCamera(12 / Math.min(aspect, 1), aspect, 1, 20000);
	camera.position.z = 400;
	camera.position.y = 0;
	camera.lookAt(scene.position);
	camera.zoom = 0.5;
	scene.add( camera );

	camera2d = new THREE.OrthographicCamera(0, window.innerWidth, 0, window.innerHeight, 1, 20000);
	camera2d.position.z = 400;
	camera2d.position.y = 0;
	camera.lookAt(scene2d.position);

	/*var material_test = new THREE.LineBasicMaterial({color:0xffffff});
	var geometry_test = new THREE.Geometry();
	geometry_test.vertices.push(new THREE.Vector3(61.7152081255694, 60.57021282243692, -50.22432084819417));
    geometry_test.vertices.push(new THREE.Vector3(64.87195729033834, 69.51603950524398, -30.970137371763073));
    geometry_test.vertices.push(new THREE.Vector3(72.1643654183197, 63.09466603018497,  -28.484513025688983));*/
	testpoint = []
	testpoint.push(new THREE.Vector3(61.7152081255694, 60.57021282243692, -50.22432084819417));
	testpoint.push(new THREE.Vector3(64.87195729033834, 69.51603950524398, -30.970137371763073));
	testpoint.push(new THREE.Vector3(72.1643654183197, 63.09466603018497,  -28.484513025688983));

	var set = {
		'missile': "hwasong-12",
		'lineGeometry': createLineGeometry(testpoint)
	}
	var mymesh = getVisualizedMeshCustuom(set);
	//	add it to scene graph
	visualizationMesh.add( mymesh );
	var windowResize = THREEx.WindowResize(renderer, camera, camera2d);
}


function animate() {

	//	Disallow roll for now, this is interfering with keyboard input during search
/*
	if(keyboard.pressed('o') && keyboard.pressed('shift') == false)
		camera.rotation.z -= 0.08;
	if(keyboard.pressed('p') && keyboard.pressed('shift') == false)
		camera.rotation.z += 0.08;
*/

	if( rotateTargetX !== undefined && rotateTargetY !== undefined ){

		rotateVX += (rotateTargetX - rotateX) * 0.012;
		rotateVY += (rotateTargetY - rotateY) * 0.012;

		// var move = new THREE.Vector3( rotateVX, rotateVY, 0 );
		// var distance = move.length();
		// if( distance > .01 )
		// 	distance = .01;
		// move.normalize();
		// move.multiplyScalar( distance );

		// rotateVX = move.x;
		// rotateVy = move.y;

		if( Math.abs(rotateTargetX - rotateX) < 0.02 && Math.abs(rotateTargetY - rotateY) < 0.02 ){
			rotateTargetX = undefined;
			rotateTargetY = undefined;
		}
	}

	rotateX += rotateVX;
	rotateY += rotateVY;

	//rotateY = wrap( rotateY, -Math.PI, Math.PI );

	rotateVX *= 0.98;
	rotateVY *= 0.98;

	if(dragging || rotateTargetX !== undefined ){
		rotateVX *= 0.6;
		rotateVY *= 0.6;
	}

	//	constrain the pivot up/down to the poles
	//	force a bit of bounce back action when hitting the poles
	if(rotateX < -rotateXMax){
		rotateX = -rotateXMax;
		rotateVX *= -0.95;
	}
	if(rotateX > rotateXMax){
		rotateX = rotateXMax;
		rotateVX *= -0.95;
	}

	rotating.rotation.x = rotateX;
	rotating.rotation.y = rotateY;

	if (tiltTarget !== undefined) {
		tilt += (tiltTarget - tilt) * 0.012;
		camera.position.y = 300 * Math.sin(-tilt);
		camera.position.z = 100 + 300 * Math.cos(-tilt);
		camera.lookAt(new THREE.Vector3(0, 0, 100));

		if (Math.abs(tiltTarget - tilt) < 0.05) {
			tiltTarget = undefined;
		}
	}

	if (scaleTarget !== undefined) {
		camera.zoom *= Math.pow(scaleTarget / camera.zoom, 0.012);
		camera.updateProjectionMatrix();

		if (Math.abs(Math.log(scaleTarget / camera.zoom)) < 0.05) {
			scaleTarget = undefined;
		}
	}

	render();

	requestAnimationFrame( animate );


	rotating.traverse(function(mesh) {
		if (mesh.update !== undefined) {
			mesh.update();
		}
	});

	render2d();
}

function render() {


	renderer.clear();
	renderer.render( scene, camera );
}

function render2d() {
	renderer.render( scene2d, camera2d );
}