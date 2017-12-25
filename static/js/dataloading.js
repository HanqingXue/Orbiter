function loadFacilityData(callback) {
	// We're going to ask a file for the JSON data.
	xhr = new XMLHttpRequest();

	// Where do we get the data?
	xhr.open('GET', facilityFile, true);

	// What do we do when we have it?
	xhr.onreadystatechange = function() {
		// If we've received the data
		if ( xhr.readyState === 4 && xhr.status === 200 ) {
			// Parse the JSON
			latlonData = JSON.parse( xhr.responseText );
			if( callback )
				callback();
		}
	};

	// Begin request
	xhr.send( null );
}

function loadMissileData( callback ){
	cxhr = new XMLHttpRequest();
	cxhr.open( 'GET', missileFile, true );
	cxhr.onreadystatechange = function() {
		if ( cxhr.readyState === 4 && cxhr.status === 200 ) {
			missileLookup = JSON.parse( cxhr.responseText );
			callback();
		}
	};
	cxhr.send( null );
}

function loadDictData(callback) {
	cxhr = new XMLHttpRequest();
	cxhr.open('GET', dictFile, true);
	cxhr.onreadystatechange = function() {
		if (cxhr.readyState === 4 && cxhr.status === 200) {
			dict = JSON.parse(cxhr.responseText);
			callback();
		}
	};
	cxhr.send(null);
}
