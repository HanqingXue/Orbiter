/**
ui.control.js
Created by Pitch Interactive
Created on 6/26/2012
This code will control the primary functions of the UI in the ArmsGlobe app
**/
d3.selection.prototype.moveToFront = function() {
	return this.each(function() {
		this.parentNode.appendChild(this);
	});
};

function mediaType() {
	if (screen.width < 640 && window.innerWidth < 640) {
		return 'phone';
	} else if (screen.width < 1280 && window.innerWidth < 1280) {
		return 'tablet';
	}
	return 'pc';
}

function size(sizeArray) {
	return sizeArray[mediaType() !== 'phone' ? 0 : 1];
}
var counter = 0;
var d3Graphs = {
	barGraphWidth: 420,
	barGraphHeight: 800,
	barGraphMinHeight: 540,
	barGraphMaxHeight: 800,
	barWidth: 14,
	barGraphTopPadding: 20,
	barGraphBottomPadding: 50,
	histogramWidth: [686, 371],
	histogramHeight: 160,
	histogramBarWidth: [28, 14],
	histogramLeftPadding: 28,
	histogramRightPadding: 28,
	histogramVertPadding: 20,
	barGraphSVG: d3.select("#wrapper").append("svg").attr('id','barGraph'),
	histogramSVG: null,
	histogramYScale: null,
	histogramXScale: null,
	cumOutcomeY: 0,
	cumSuccessY: 0,cumFailureY: 0,cumUnknownY: 0,
	cumSuccessLblY: 0,cumFailureLblY: 0,cumUnknownLblY: 0,
	inited: false,
	hudButtonsOpen: false,
	histogramOpen: false,
	handleLeftOffset: [34, 24],
	handleInterval: [42, 21],
	windowResizeTimeout: -1,
	histogramAbsMax: 0,
	graphIconPadding: [20, -20],
	previousSuccessLabelTranslateY: -1,
	previousFailureLabelTranslateY: -1,
	previousUnknownLabelTranslateY: -1,
	tiltBtnInterval: -1,
	zoomBtnInterval: -1,
	selectedYearIndex: 14,


	setTest: function(test) {
		$("#hudButtons .testTextInput").val(test);
		d3Graphs.updateViz();
	},
	initGraphs: function() {
		this.showHud();
	},
	showHud: function() {
		if(this.inited) return;
		this.inited = true;
		$("#hudHeader .title").text("Missile Tracker");
		$("#hudHeader .subtitle").text(dict['_subtitle']);
		$("#hudButtons .searchBtn").val(dict['search'].toUpperCase());
		$("#hudButtons .aboutBtn").val("INPUT");
		/*$("#history .graph .labels .outcome").text(dict['test-outcome'].toUpperCase());
		$("#history .graph .labels .successes").text(dict['success'].toUpperCase());
		$("#history .graph .labels .failures").text(dict['failure'].toUpperCase());
		$("#history .graph .labels .unknowns").text(dict['unknown'].toUpperCase());
		$("#outcomeBtns .success .label").text(dict['success']);
		$("#outcomeBtns .failure .label").text(dict['failure']);
		$("#outcomeBtns .unknown .label").text(dict['unknown']);*/
		for (var i in missileLookup) {
			$("#missileTypeBtns ." + i + " .label").text(missileLookup[i].name);
		}
		$("#aboutBox .title").text(dict['_abouttitle']);
		$("#aboutBox .text").html(dict['_about']);
		d3Graphs.windowResize();
		$("#hudHeader").show();
		$("#hudButtons").show();
		$("#outcomeBtns").show();
		$("#missileTypeBtns").show();
		$("#history").hide();
		$("#graphIcon").show();
		$("#graphIcon").on('click', d3Graphs.graphIconClick);
		$("#history .close").on('click', d3Graphs.closeHistogram);
		$("#history ul li").on('click', d3Graphs.clickTimeline);
		$("#handle").draggable({axis: 'x',containment: "parent",grid:[size(this.handleInterval), 0], stop: d3Graphs.dropHandle, drag: d3Graphs.dropHandle });
		$("#hudButtons .searchBtn").on('click', d3Graphs.updateViz);
		$("#outcomeBtns>div>.label").on('click', d3Graphs.outcomeLabelClick);
		$("#missileTypeBtns .check").on('click', d3Graphs.missileBtnClick);
		$("#hudButtons .testTextInput").autocomplete({ source:selectableTests, autoFocus: true });
		$("#hudButtons .testTextInput").keyup(d3Graphs.testKeyUp);
		$("#hudButtons .testTextInput").focus(d3Graphs.testFocus);
		$("#hudButtons .aboutBtn").on('click', d3Graphs.toggleAboutBox);
		$(document).on('click', '.ui-autocomplete li', d3Graphs.menuItemClick);
		$(window).resize(d3Graphs.windowResizeCB);
		$(".tiltBtn").on('mousedown touchstart', d3Graphs.tiltBtnClick);
		$(".tiltBtn").on('mouseup touchend touchcancel', d3Graphs.tiltBtnMouseup);
		$(".zoomBtn").on('mousedown touchstart', d3Graphs.zoomBtnClick);
		$(".zoomBtn").on('mouseup touchend touchcancel', d3Graphs.zoomBtnMouseup);
		$("#hudButtonHandle").on('click', d3Graphs.hudButtonHandleClick);
	},
	tiltBtnMouseup: function() {
		clearInterval(d3Graphs.tiltBtnInterval);
	},
	tiltBtnClick:function() {
		var delta;
		if($(this).hasClass('sideViewBtn')) {
			delta = 5;
		} else {
			delta = -5;
		}
		d3Graphs.doTilt(delta);
		d3Graphs.tiltBtnInterval = setInterval(d3Graphs.doTilt, 50, delta);
	},
	doTilt:function(delta) {
		tilt += delta * 0.01;
		tilt = constrain(tilt, 0, Math.PI / 2);
		camera.position.y = 300 * Math.sin(-tilt);
		camera.position.z = 100 + 300 * Math.cos(-tilt);
		camera.lookAt(new THREE.Vector3(0, 0, 100));
		tiltTarget = undefined;
	},
	zoomBtnMouseup: function() {
		clearInterval(d3Graphs.zoomBtnInterval);
	},
	zoomBtnClick:function() {
		var delta;
		if($(this).hasClass('zoomOutBtn')) {
			delta = -0.5;
		} else {
			delta = 0.5;
		}
		d3Graphs.doZoom(delta);
		d3Graphs.zoomBtnInterval = setInterval(d3Graphs.doZoom,50,delta);
	},
	doZoom:function(delta) {
		camera.zoom += delta * 0.1;
		camera.zoom = constrain( camera.zoom, 0.5, 5.0 );
		camera.updateProjectionMatrix();
		scaleTarget = undefined;
	},
	toggleAboutBox:function() {
		$("#aboutContainer").toggle();
	},
	clickTimeline:function() {
		var year = $(this).html();
		if (year < 70) {
			year = (year * 1) + 2000;
		}
		if (year < 100) {
			year = (year * 1) + 1900;
		}
		d3Graphs.setHandlePosition(yearIndexLookup[year]);
		d3Graphs.updateViz(true);
	},
	windowResizeCB:function() {
		clearTimeout(d3Graphs.windowResizeTimeout);
		d3Graphs.windowResizeTimeout = setTimeout(d3Graphs.windowResize, 50);
	},
	windowResize: function() {
		var windowWidth = $(window).width();
		var windowHeight = $(window).height();
		var minWidth = 1280;
		var minHeight = 600;
		if (mediaType() === 'pc') {
			var w = windowWidth < minWidth ? minWidth : windowWidth;
			var hudButtonWidth = 489;
			$('#hudButtons').css('left', w - hudButtonWidth - 20);
			var missileButtonWidth = $("#missileTypeBtns").width();
			$("#missileTypeBtns").css('left', w - missileButtonWidth);
			var outcomeButtonWidth = $("#outcomeBtns").width();
			$("#outcomeBtns").css('left', w - missileButtonWidth - outcomeButtonWidth - 10);
		} else {
			$("#hudButtons").css('right', d3Graphs.hudButtonsOpen ?
				0 : $("#hudButtonHandle").width() - $("#hudButtons").width() + 'px');
		}
		d3Graphs.barGraphHeight = Math.min(
			Math.max(windowHeight - 60, size([d3Graphs.barGraphMinHeight, 0])),
			d3Graphs.barGraphMaxHeight);
		var barGraphBottomPadding = 10;
		var barGraphTopPos = Math.max(windowHeight, minHeight) - d3Graphs.barGraphHeight - barGraphBottomPadding;

		$("#barGraph").css('top', barGraphTopPos + 'px');
		/*
		var hudHeaderLeft = $("#hudHeader").css('left');
		hudHeaderLeft = hudHeaderLeft.substr(0,hudHeaderLeft.length-2);
		console.log(hudHeaderLeft);
		var hudPaddingRight = 30;
		$("#hudHeader").width(w-hudHeaderLeft - hudPaddingRight);
		*/
		//success
		//d3Graphs.drawBarGraph();
		d3Graphs.drawHistogram();
		d3Graphs.setHandlePosition(d3Graphs.selectedYearIndex);
		$("#handle").draggable({
			axis: 'x',
			containment: "parent",
			grid:[size(d3Graphs.handleInterval), 0],
			stop: d3Graphs.dropHandle,
			drag: d3Graphs.dropHandle
		});
		d3Graphs.positionHistory(windowWidth);
	},
	positionHistory: function(windowWidth) {
		var graphIconPadding = size(d3Graphs.graphIconPadding);
		var historyWidth = $("#history").width();
		var totalWidth = historyWidth + $("#graphIcon").width() + graphIconPadding;
//		var windowWidth = $(window).width();
		var historyLeftPos = (windowWidth - totalWidth) / 2.0;
		var minLeftPos = 280;
		if (mediaType() === 'pc' && historyLeftPos < minLeftPos) {
			historyLeftPos = minLeftPos;
		}
		$("#history").css('left',historyLeftPos+"px");
		$("#graphIcon").css('left',historyLeftPos + historyWidth + graphIconPadding+'px');
	},
	testFocus:function(event) {
		//console.log("focus");
		setTimeout(function() { $('#hudButtons .testTextInput').select() },50);
	},
	menuItemClick:function(event) {
		setTimeout(function() {
			$('#hudButtons .testTextInput').blur();
		}, 50);
		d3Graphs.updateViz();
	},
	testKeyUp: function(event) {
		if(event.keyCode == 13 /*ENTER */) {
			$('#hudButtons .testTextInput').blur();
			d3Graphs.updateViz();
		}
	},

	updateViz:function(filterChanged) {
		var test = $("#hudButtons .testTextInput").val().toUpperCase();
		if (typeof testData[test] == 'undefined') {
			if (!filterChanged) {
				return;
			}
			test = selectedTest ? selectedTest.testName : '';
		}

		// year
		var year = timeBins[d3Graphs.selectedYearIndex].year;
		if (!filterChanged) {
			year = testData[test].date.substr(0, 4);
			d3Graphs.setHandlePosition(yearIndexLookup[year]);
		}

		// outcome
		var outcomeArray = []
		var outcomeBtns = $("#outcomeBtns>div");
		for(var i = 0; i < outcomeBtns.length; i++) {
			var btn = $(outcomeBtns[i]);
			var outcomeKey = btn.attr('class');
			if(btn.find('.inactive').length == 0) {
				outcomeArray.push(outcomeKey);
				selectionData.outcomeCategories[outcomeKey] = true;
			} else {
				selectionData.outcomeCategories[outcomeKey] = false;
			}
		}
		if (!filterChanged && !selectionData.outcomeCategories[testData[test].outcome]) {
			outcomeArray.push(testData[test].outcome);
			selectionData.outcomeCategories[testData[test].outcome] = true;
			outcomeBtns.filter('.' + testData[test].outcome).find('.label').removeClass('inactive');
		}

		//missile
		var missileArray = [];
		var missileBtns = $("#missileTypeBtns>div");
		for(var i = 0; i < missileBtns.length; i++) {
			var btn = $(missileBtns[i]);
			var missileKey = btn.attr('class');
			if(btn.find('.inactive').length == 0) {
				missileArray.push(missileKey);
				selectionData.missileCategories[missileKey] = true;
			} else {
				selectionData.missileCategories[missileKey] = false;
			}
		}
		if (!filterChanged && !selectionData.missileCategories[testData[test].missile]) {
			missileArray.push(testData[test].missile);
			selectionData.missileCategories[testData[test].missile] = true;
			missileBtns.filter('.' + testData[test].missile).find('.check').removeClass('inactive');
		}

		selectionData.selectedYear = year;
		selectionData.selectedTest = test;
		selectVisualization(timeBins, year, [test], outcomeArray, missileArray);
	},
	dropHandle:function() {
		var yearOffset = $("#handle").css('left');
		yearOffset = yearOffset.substr(0, yearOffset.length - 2);
		yearOffset -= size(d3Graphs.handleLeftOffset);
		yearOffset /= size(d3Graphs.handleInterval);
		d3Graphs.selectedYearIndex = yearOffset;
		$("#handle").css('top','');
		d3Graphs.updateViz(true);
	},
	outcomeLabelClick: function() {
		var label = $(this);
		if(label.hasClass('inactive')) {
			label.removeClass('inactive');
		} else {
			label.addClass('inactive');
		}
		d3Graphs.updateViz(true);
	},
	missileBtnClick:function() {
		var check = $(this);
		if(check.hasClass('inactive')) {
			check.removeClass('inactive');
		} else {
			check.addClass('inactive');
		}
		d3Graphs.updateViz(true);
	},
	hudButtonHandleClick: function() {
		if (!d3Graphs.hudButtonsOpen) {
			d3Graphs.hudButtonsOpen = true;
			$("#hudButtons").animate({right: '0px'});
		} else {
			d3Graphs.hudButtonsOpen = false;
			$("#hudButtons").animate({right: $("#hudButtonHandle").width() - $("#hudButtons").width() + 'px'});
			$("#aboutContainer").hide();
		}
	},
	graphIconClick: function() {
		if(!d3Graphs.histogramOpen) {
			d3Graphs.histogramOpen = true;
			$("#history .graph").slideDown();
		} else {
			d3Graphs.closeHistogram();
		}
	},
	closeHistogram: function() {
		d3Graphs.histogramOpen = false;
		$("#history .graph").slideUp();
	},
	line: d3.line()
		// assign the X function to plot our line as we wish
	.x(function(d,i) {
		if(d == null) {
			return null;
		}
		return d3Graphs.histogramXScale(d.x) + d3Graphs.histogramLeftPadding;
	 })
	.y(function(d) {
		if(d == null) {
			return null;
		}
		return d3Graphs.histogramYScale(d.y) + d3Graphs.histogramVertPadding;
	}),
	setHistogramData:function() {

	},
	drawHistogram:function() {},
	setHandlePosition: function(index) {
		var leftPos = size(d3Graphs.handleLeftOffset) + size(d3Graphs.handleInterval) * index;
		$("#handle").css('left', leftPos + "px");
		d3Graphs.selectedYearIndex = index;
	}
}
