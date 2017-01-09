'use strict';

var aeTimelines = (function (webcharts, d3$1) {
	'use strict';

	var settings = {
		//Addition settings for this template
		id_col: 'USUBJID',
		seq_col: 'AESEQ',
		soc_col: 'AEBODSYS',
		term_col: 'AETERM',
		stdy_col: 'ASTDY',
		endy_col: 'AENDY',
		sev_col: 'AESEV',
		rel_col: 'AEREL',
		ser_col: 'AESER',
		filter_cols: [],
		detail_cols: [],

		//Standard webcharts settings
		x: {
			"label": null,
			"type": "linear",
			"column": 'wc_value'
		},
		y: {
			"column": null, //set in syncSettings()
			"label": '',
			"sort": "earliest",
			"type": "ordinal",
			"behavior": 'flex'
		},
		"margin": { "top": 50, bottom: null, left: null, right: null },
		"legend": {
			"mark": "circle",
			"label": 'Severity'
		},
		"marks": [{
			"per": null, //set in syncSettings()
			"tooltip": null, //set in syncSettings()
			"type": "line",
			"attributes": { 'stroke-width': 5, 'stroke-opacity': .8 }
		}, {
			"per": null, //set in syncSettings()
			"tooltip": null, //set in syncSettings()
			"type": "circle"
		}, {
			"per": null, //set in syncSettings()
			"tooltip": null, //set in syncSettings()
			"type": "line",
			"attributes": { 'stroke-width': 3, 'stroke-opacity': .8, 'stroke': 'black' },
			"values": { "AESER": ["Yes", 'Y'] }
		}, {
			"per": null, //set in syncSettings()
			"tooltip": null, //set in syncSettings()
			"type": "circle",
			"attributes": { 'stroke-width': 3, 'stroke': 'black' },
			"radius": 5,
			"values": { "AESER": ["Yes", 'Y'] }
		}],
		"colors": ['#66bd63', '#fdae61', '#d73027', '#6e016b'],
		"date_format": "%m/%d/%y",
		"resizable": true,
		"max_width": 1000,
		"y_behavior": 'flex',
		"gridlines": "y",
		"no_text_size": false,
		"range_band": 15,
		"color_by": null //set in syncSettings()
	};

	function syncSettings(preSettings) {
		var nextSettings = Object.create(preSettings);
		nextSettings.y.column = nextSettings.id_col;
		nextSettings.marks[0].per = [nextSettings.id_col, nextSettings.seq_col];
		nextSettings.marks[0].tooltip = 'System Organ Class: [' + nextSettings.soc_col + ']\nPreferred Term: [' + nextSettings.term_col + ']\nStart Day: [' + nextSettings.stdy_col + ']\nStop Day: [' + nextSettings.endy_col + ']';
		nextSettings.marks[1].per = [nextSettings.id_col, nextSettings.seq_col, 'wc_value'];
		nextSettings.marks[1].tooltip = 'System Organ Class: [' + nextSettings.soc_col + ']\nPreferred Term: [' + nextSettings.term_col + ']\nStart Day: [' + nextSettings.stdy_col + ']\nStop Day: [' + nextSettings.endy_col + ']';
		nextSettings.marks[2].per = [nextSettings.id_col, nextSettings.seq_col];
		nextSettings.marks[2].tooltip = 'System Organ Class: [' + nextSettings.soc_col + ']\nPreferred Term: [' + nextSettings.term_col + ']\nStart Day: [' + nextSettings.stdy_col + ']\nStop Day: [' + nextSettings.endy_col + ']';
		nextSettings.marks[3].per = [nextSettings.id_col, nextSettings.seq_col, 'wc_value'];
		nextSettings.marks[3].tooltip = 'System Organ Class: [' + nextSettings.soc_col + ']\nPreferred Term: [' + nextSettings.term_col + ']\nStart Day: [' + nextSettings.stdy_col + ']\nStop Day: [' + nextSettings.endy_col + ']';
		nextSettings.color_by = nextSettings.sev_col;

		return nextSettings;
	}

	var controlInputs = 
        [ { label: "Site", type: "subsetter", value_col: "SITEID", multiple: true }
        , { label: "Severity", type: "subsetter", value_col: "AESEV", multiple: true }
        , { label: "System Organ Class", type: "subsetter", value_col: "AEBODSYS" }
        , { label: "Subject ID", type: "subsetter", value_col: "USUBJID" }
        , { label: "Related to Treatment", type: "subsetter", value_col: "AEREL" }
        , { label: "Serious?", type: "subsetter", value_col: "AESER" }
        , { label: "Sort Ptcpts", type: "dropdown", option: "y.sort", values: ["earliest", "alphabetical-descending"], require: true }];

	function syncControlInputs(preControlInputs, preSettings) {
		var severityControl = preControlInputs.filter(function (d) {
			return d.label == "Severity";
		})[0];
		severityControl.value_col = preSettings.sev_col;

		var sOCControl = preControlInputs.filter(function (d) {
			return d.label == "System Organ Class";
		})[0];
		sOCControl.value_col = preSettings.soc_col;

		var subjectControl = preControlInputs.filter(function (d) {
			return d.label == "Subject ID";
		})[0];
		subjectControl.value_col = preSettings.id_col;

		var relatedControl = preControlInputs.filter(function (d) {
			return d.label == "Related to Treatment";
		})[0];
		relatedControl.value_col = preSettings.rel_col;

		var seriousControl = preControlInputs.filter(function (d) {
			return d.label == "Serious?";
		})[0];
		seriousControl.value_col = preSettings.ser_col;

		settings.filter_cols.forEach(function (d, i) {
			var thisFilter = {
				type: "subsetter",
				value_col: d,
				label: d,
				multiple: true
			};
			var filter_vars = preControlInputs.map(function (d) {
				return d.value_col;
			});
			if (filter_vars.indexOf(thisFilter.value_col) == -1) {
				preControlInputs.push(thisFilter);
			}
		});

		return preControlInputs;
	}

	//Setting for custom details view
	var secondSettings = {
		"x": { label: '', "type": "linear", "column": "wc_value" },
		"y": { label: '', "sort": "alphabetical-descending", "type": "ordinal", "column": "AESEQ" },
		"marks": [{ "type": "line", "per": ["AESEQ"], attributes: { 'stroke-width': 5, 'stroke-opacity': .8 } }, { "type": "circle", "per": ["AESEQ", "wc_value"] }, { "type": "line", "per": ["AESEQ"], attributes: { 'stroke-width': 3, 'stroke-opacity': .8, 'stroke': 'black' }, "values": { "AESER": ["Yes", 'Y'] } }, { "type": "circle", "per": ["AESEQ", "wc_value"], "attributes": { 'stroke': 'black', 'stroke-width': 2 }, "radius": 5, "values": { "AESER": ["Yes", 'Y'] } }],
		color_by: "AESEV",
		colors: ['#66bd63', '#fdae61', '#d73027', '#6e016b'],
		"legend": {
			"mark": "circle",
			"label": 'Severity'
		},
		"date_format": "%d%b%Y:%X",
		transitions: false,
		"max_width": 1000,
		"gridlines": "y",
		"no_text_size": false,
		"range_band": 28
	};

	function syncSecondSettings(settings1, settings2) {
		var nextSettings = Object.create(settings1);
		nextSettings.y.column = settings2.seq_col;
		nextSettings.marks[0].per[0] = settings2.seq_col;
		nextSettings.marks[1].per[0] = settings2.seq_col;
		nextSettings.color_by = settings2.sev_col;
		nextSettings.color_dom = settings2.legend ? nextSettings.legend.order : null;
		nextSettings.colors = settings2.colors;

		return nextSettings;
	}

	function lengthenRaw(data, columns) {
		var my_data = [];

		data.forEach(function (e) {
			columns.forEach(function (g) {
				var obj = Object.assign({}, e);
				obj.wc_category = g;
				obj.wc_value = e[g];
				my_data.push(obj);
			});
		});

		return my_data;
	}

	function onInit() {
		var _this = this;

		this.superRaw = this.raw_data;
		this.raw_data = lengthenRaw(this.raw_data, [this.config.stdy_col, this.config.endy_col]);
		this.raw_data.forEach(function (d) {
			d.wc_value = d.wc_value == "" ? NaN : +d.wc_value;
		});
		//create back button
		var myChart = this;
		this.chart2.wrap.insert('button', 'svg').html('&#8592; Back').style('cursor', 'pointer').on('click', function () {
			_this.wrap.style('display', 'block');
			_this.table.draw([]);
			_this.chart2.wrap.style('display', 'none');
			_this.chart2.wrap.select('.id-title').remove();
			_this.controls.wrap.style('display', 'block');
		});
	};

	function onLayout() {
		//add div for participant counts
		this.wrap.append("span").classed("annote", true);

		//add top x-axis
		var x2 = this.svg.append("g").attr("class", "x2 axis linear");
		x2.append("text").attr("class", "axis-title top").attr("dy", "2em").attr("text-anchor", "middle").text(this.config.x_label);
	}

	function onDataTransform() {}

	// Takes a webcharts object creates a text annotation giving the
	// number and percentage of observations shown in the current view
	// inputs:
	// chart - a webcharts chart object
	// id_col - a column name in the raw data set (chart.raw_data) representing the observation of interest
	// id_unit - a text string to label the units in the annotation (default = "participants")
	// selector - css selector for the annotation
	function updateSubjectCount(chart, id_col, selector, id_unit) {
		//count the number of unique ids in the data set
		var totalObs = d3.set(chart.raw_data.map(function (d) {
			return d[id_col];
		})).values().length;

		//count the number of unique ids in the current chart and calculate the percentage
		var currentObs = chart.y_dom.length;
		var percentage = d3.format('0.1%')(currentObs / totalObs);

		//clear the annotation
		var annotation = d3.select(selector);
		d3.select(selector).selectAll("*").remove();

		//update the annotation
		var units = id_unit ? " " + id_unit : " participant(s)";
		annotation.text(currentObs + " of " + totalObs + units + " shown (" + percentage + ")");
	}

	function onDraw() {
		updateSubjectCount(this, this.config.id_col, ".annote");
	}

	function onResize() {
		var _this2 = this;

		var chart = this;
		this.chart2.on('datatransform', function () {
			//make sure color scales stay consistent
			this.config.color_dom = chart.colorScale.domain();
		});
		this.chart2.x_dom = this.x_dom;
		this.svg.select('.y.axis').selectAll('.tick').style('cursor', 'pointer').on('click', function (d) {
			var csv2 = _this2.raw_data.filter(function (f) {
				return f[_this2.config.id_col] === d;
			});
			_this2.chart2.wrap.style('display', 'block');
			_this2.chart2.draw(csv2);
			_this2.chart2.wrap.insert('h4', 'svg').attr('class', 'id-title').text(d);
			//force legend to be drawn
			_this2.chart2.makeLegend(_this2.colorScale);

			var tableData = _this2.superRaw.filter(function (f) {
				return f[_this2.config.id_col] === d;
			});
			//set cols for table, otherwise can get mismatched
			_this2.table.config.cols = d3.merge([[chart.config.seq_col, chart.config.id_col, chart.config.soc_col, chart.config.term_col, chart.config.stdy_col, chart.config.endy_col, chart.config.sev_col, chart.config.rel_col], chart.config.filter_cols, chart.config.detail_cols]);
			_this2.table.draw(tableData);
			_this2.wrap.style('display', 'none');
			_this2.controls.wrap.style('display', 'none');
		});

		var x2Axis = d3$1.svg.axis().scale(this.x).orient('top').tickFormat(this.xAxis.tickFormat()).innerTickSize(this.xAxis.innerTickSize()).outerTickSize(this.xAxis.outerTickSize()).ticks(this.xAxis.ticks()[0]);

		var g_x2_axis = this.svg.select("g.x2.axis").attr("class", "x2 axis linear");

		g_x2_axis.call(x2Axis);

		g_x2_axis.select("text.axis-title.top").attr("transform", "translate(" + this.raw_width / 2 + ",-" + this.config.margin.top + ")");

		g_x2_axis.select('.domain').attr({
			'fill': 'none',
			'stroke': '#ccc',
			'shape-rendering': 'crispEdges'
		});
		g_x2_axis.selectAll('.tick line').attr('stroke', '#eee');
	}

	if (typeof Object.assign != 'function') {
		(function () {
			Object.assign = function (target) {
				'use strict';
				if (target === undefined || target === null) {
					throw new TypeError('Cannot convert undefined or null to object');
				}

				var output = Object(target);
				for (var index = 1; index < arguments.length; index++) {
					var source = arguments[index];
					if (source !== undefined && source !== null) {
						for (var nextKey in source) {
							if (source.hasOwnProperty(nextKey)) {
								output[nextKey] = source[nextKey];
							}
						}
					}
				}
				return output;
			};
		})();
	}

	function aeTimeline(element, settings$$) {
		//merge user's settings with defaults
		var initialSettings = Object.assign({}, settings, settings$$);
		// console.log(settings)
		// console.log(Object.create(settings))
		// debugger;
		//keep settings in sync with the data mappings
		var mergedSettings = syncSettings(initialSettings);

		//keep settings for secondary chart in sync
		var initialMergedSecondSettings = Object.assign({}, secondSettings, Object.create(settings$$));
		var mergedSecondSettings = syncSecondSettings(initialMergedSecondSettings, mergedSettings);

		//keep control inputs settings in sync
		var syncedControlInputs = syncControlInputs(controlInputs, Object.create(mergedSettings));

		//create controls now
		var controls = webcharts.createControls(element, { location: 'top', inputs: syncedControlInputs });

		//create chart
		var chart = webcharts.createChart(element, mergedSettings, controls);
		chart.on('init', onInit);
		chart.on('layout', onLayout);
		chart.on('datatransform', onDataTransform);
		chart.on('draw', onDraw);
		chart.on('resize', onResize);

		//set up secondary chart and table
		var chart2 = webcharts.createChart(element, mergedSecondSettings).init([]);
		chart2.wrap.style('display', 'none');
		chart.chart2 = chart2;
		var table = webcharts.createTable(element, {}).init([]);
		chart.table = table;

		return chart;
	}

	return aeTimeline;
})(webCharts, d3);

