"use strict";

var safetyOutlierExplorer = (function (webcharts, d3$1) {
	'use strict';

	var settings = {
		//Addition settings for this template
		id_col: "USUBJID",
		time_cols: ["VISITN", "VISIT", "DY"],
		measure_col: "TEST",
		value_col: "STRESN",
		unit_col: "STRESU",
		normal_col_low: "STNRLO",
		normal_col_high: "STNRHI",
		start_value: null,

		//Standard webcharts settings
		x: {
			column: null, //set in syncSettings()
			type: "linear",
			behavior: "flex",
			tickAttr: null
		},
		y: {
			column: null, //set in syncSettings()
			stat: "mean",
			type: "linear",
			label: "Value",
			behavior: "flex",
			format: "0.2f"
		},
		marks: [{
			per: null, //set in syncSettings()
			type: "line",
			attributes: {
				'stroke-width': .5,
				'stroke-opacity': .5,
				"stroke": "#999"
			},
			tooltip: null //set in syncSettings()

		}, {
			per: null, //set in syncSettings()
			type: "circle",
			radius: 2,
			attributes: {
				'stroke-width': .5,
				'stroke-opacity': .5,
				'fill-opacity': 1
			},
			tooltip: null //set in syncSettings()
		}],
		resizable: true,
		max_width: 600,
		margin: { right: 20 },
		aspect: 1.33
	};

	// Replicate settings in multiple places in the settings object
	function syncSettings(settings) {
		settings.y.column = settings.value_col;
		settings.x.column = settings.time_cols[0];
		settings.marks[0].per = [settings.id_col, settings.measure_col];
		settings.marks[0].tooltip = "[" + settings.id_col + "]";
		settings.marks[1].per = [settings.id_col, settings.measure_col, settings.time_cols[0], settings.value_col];
		settings.marks[1].tooltip = "[" + settings.id_col + "]:  [" + settings.value_col + "] [" + settings.unit_col + "] at " + settings.x.column + " = [" + settings.x.column + "]";
		return settings;
	}

	// Default Control objects
	var controlInputs = [{ label: "Lab Test", type: "subsetter", start: null }, { type: "dropdown", label: "X axis", option: "x.column", require: true }];

	// Map values from settings to control inputs
	function syncControlInputs(controlInputs, settings) {
		var labTestControl = controlInputs.filter(function (d) {
			return d.label == "Lab Test";
		})[0];
		labTestControl.value_col = settings.measure_col;

		var xAxisControl = controlInputs.filter(function (d) {
			return d.label == "X axis";
		})[0];
		xAxisControl.values = settings.time_cols;

		return controlInputs;
	}

	function onInit() {
		var _this = this;

		var config = this.config;
		var allMeasures = d3$1.set(this.raw_data.map(function (m) {
			return m[config.measure_col];
		})).values();
		this.controls.config.inputs.filter(function (f) {
			return f.value_col === config.measure_col;
		})[0].start = config.start_value || allMeasures[0];

		//warning for non-numeric endpoints
		var catMeasures = allMeasures.filter(function (f) {
			var measureVals = _this.raw_data.filter(function (d) {
				return d[config.measure_col] === f;
			});

			return webcharts.dataOps.getValType(measureVals, config.value_col) !== "continuous";
		});
		if (catMeasures.length) {
			console.warn(catMeasures.length + " non-numeric endpoints have been removed: " + catMeasures.join(", "));
		}

		//delete non-numeric endpoints
		var numMeasures = allMeasures.filter(function (f) {
			var measureVals = _this.raw_data.filter(function (d) {
				return d[config.measure_col] === f;
			});

			return webcharts.dataOps.getValType(measureVals, config.value_col) === "continuous";
		});

		this.raw_data = this.raw_data.filter(function (f) {
			return numMeasures.indexOf(f[config.measure_col]) > -1;
		});
	};

	function onLayout() {
		var _this2 = this;

		//custom filter behavior          
		var xColSelect = this.controls.wrap.selectAll(".control-group").filter(function (f) {
			return f.option === "x.column";
		}).select("select");

		xColSelect.on("change", function (d) {
			var value = xColSelect.property('value');

			_this2.config.x.column = value;
			_this2.config.marks[1].per[2] = value;

			//DY is a hardcoded variable...
			_this2.config.x.type = value == "DY" ? "linear" : "ordinal";
			_this2.draw();
		});

		//add wrapper for small multiples
		this.wrap.append('div').attr('class', 'multiples');
	}

	function onDataTransform() {
		var config = this.config;
		var units = this.filtered_data[0][config.unit_col];
		var measure = this.filtered_data[0][config.measure_col];
		this.config.y.label = measure + " level (" + units + ")";
		this.config.x.label = this.config.x.column;
	}

	function onDraw() {
		//clear current multiples
		this.wrap.select('.multiples').select('.wc-small-multiples').remove();
	}

	function addBoxplot(svg, results, height, width, domain, boxPlotWidth, boxColor, boxInsideColor, format, horizontal) {
		//set default orientation to "horizontal"
		var horizontal = horizontal == undefined ? true : horizontal;

		//make the results numeric and sort
		var results = results.map(function (d) {
			return +d;
		}).sort(d3.ascending);

		//set up scales
		var y = d3.scale.linear().range([height, 0]);

		var x = d3.scale.linear().range([0, width]);

		if (horizontal) {
			y.domain(domain);
		} else {
			x.domain(domain);
		}

		var probs = [0.05, 0.25, 0.5, 0.75, 0.95];
		for (var i = 0; i < probs.length; i++) {
			probs[i] = d3.quantile(results, probs[i]);
		}

		var boxplot = svg.append("g").attr("class", "boxplot").datum({ values: results, probs: probs });

		//set bar width variable
		var left = horizontal ? 0.5 - boxPlotWidth / 2 : null;
		var right = horizontal ? 0.5 + boxPlotWidth / 2 : null;
		var top = horizontal ? null : 0.5 - boxPlotWidth / 2;
		var bottom = horizontal ? null : 0.5 + boxPlotWidth / 2;

		//draw rectangle from q1 to q3
		var box_x = horizontal ? x(0.5 - boxPlotWidth / 2) : x(probs[1]);
		var box_width = horizontal ? x(0.5 + boxPlotWidth / 2) - x(0.5 - boxPlotWidth / 2) : x(probs[3]) - x(probs[1]);
		var box_y = horizontal ? y(probs[3]) : y(0.5 + boxPlotWidth / 2);
		var box_height = horizontal ? -y(probs[3]) + y(probs[1]) : y(0.5 - boxPlotWidth / 2) - y(0.5 + boxPlotWidth / 2);

		boxplot.append("rect").attr("class", "boxplot fill").attr("x", box_x).attr("width", box_width).attr("y", box_y).attr("height", box_height).style("fill", boxColor);

		//draw dividing lines at median, 95% and 5%
		var iS = [0, 2, 4];
		var iSclass = ["", "median", ""];
		var iSColor = [boxColor, boxInsideColor, boxColor];
		for (var i = 0; i < iS.length; i++) {
			boxplot.append("line").attr("class", "boxplot " + iSclass[i]).attr("x1", horizontal ? x(0.5 - boxPlotWidth / 2) : x(probs[iS[i]])).attr("x2", horizontal ? x(0.5 + boxPlotWidth / 2) : x(probs[iS[i]])).attr("y1", horizontal ? y(probs[iS[i]]) : y(0.5 - boxPlotWidth / 2)).attr("y2", horizontal ? y(probs[iS[i]]) : y(0.5 + boxPlotWidth / 2)).style("fill", iSColor[i]).style("stroke", iSColor[i]);
		}

		//draw lines from 5% to 25% and from 75% to 95%
		var iS = [[0, 1], [3, 4]];
		for (var i = 0; i < iS.length; i++) {
			boxplot.append("line").attr("class", "boxplot").attr("x1", horizontal ? x(0.5) : x(probs[iS[i][0]])).attr("x2", horizontal ? x(0.5) : x(probs[iS[i][1]])).attr("y1", horizontal ? y(probs[iS[i][0]]) : y(0.5)).attr("y2", horizontal ? y(probs[iS[i][1]]) : y(0.5)).style("stroke", boxColor);
		}

		boxplot.append("circle").attr("class", "boxplot mean").attr("cx", horizontal ? x(0.5) : x(d3.mean(results))).attr("cy", horizontal ? y(d3.mean(results)) : y(0.5)).attr("r", horizontal ? x(boxPlotWidth / 3) : y(1 - boxPlotWidth / 3)).style("fill", boxInsideColor).style("stroke", boxColor);

		boxplot.append("circle").attr("class", "boxplot mean").attr("cx", horizontal ? x(0.5) : x(d3.mean(results))).attr("cy", horizontal ? y(d3.mean(results)) : y(0.5)).attr("r", horizontal ? x(boxPlotWidth / 6) : y(1 - boxPlotWidth / 6)).style("fill", boxColor).style("stroke", 'None');

		var formatx = format ? d3.format(format) : d3.format(".2f");

		boxplot.selectAll(".boxplot").append("title").text(function (d) {
			return "N = " + d.values.length + "\n" + "Min = " + d3.min(d.values) + "\n" + "5th % = " + formatx(d3.quantile(d.values, 0.05)) + "\n" + "Q1 = " + formatx(d3.quantile(d.values, 0.25)) + "\n" + "Median = " + formatx(d3.median(d.values)) + "\n" + "Q3 = " + formatx(d3.quantile(d.values, 0.75)) + "\n" + "95th % = " + formatx(d3.quantile(d.values, 0.95)) + "\n" + "Max = " + d3.max(d.values) + "\n" + "Mean = " + formatx(d3.mean(d.values)) + "\n" + "StDev = " + formatx(d3.deviation(d.values));
		});
	}

	function rangePolygon(chart) {

		var area = d3$1.svg.area().x(function (d) {
			return chart.x(d["TIME"]);
		}).y0(function (d) {
			var lbornlo = d['STNRLO'];
			return lbornlo !== 'NA' ? chart.y(+lbornlo) : 0;
		}).y1(function (d) {
			var lbornrhi = d['STNRHI'];
			return lbornrhi !== 'NA' ? chart.y(+lbornrhi) : 0;
		});

		var dRow = chart.filtered_data[0];

		var myRows = chart.x_dom.slice().map(function (m) {
			return {
				STNRLO: dRow[chart.config.normal_col_low],
				STNRHI: dRow[chart.config.normal_col_high],
				TIME: m
			};
		});
		//remove what is there now
		chart.svg.select('.norms').remove();
		//add new
		chart.svg.append("path").datum(myRows).attr("class", "norms").attr("fill", "blue").attr("fill-opacity", 0.1).attr("d", area);
	}

	function smallMultiples(id, chart) {
		//clear current multiples
		chart.wrap.select('.multiples').select('.wc-small-multiples').remove();
		//Establish settings for small multiples based off of the main chart
		//NOTE: will likely need polyfill for Object.assign
		var mult_settings = Object.assign({}, chart.config, Object.getPrototypeOf(chart.config));
		mult_settings.aspect = 5.4;
		mult_settings.margin = { bottom: 20 };
		var multiples = webcharts.createChart(chart.wrap.select('.multiples').node(), mult_settings, null);

		//insert a header
		multiples.wrap.insert('strong', '.legend').text('All Measures for ' + id);

		//get normal values and adjust domain
		multiples.on("layout", function () {
			var _this3 = this;

			//header formatting
			this.wrap.selectAll(".wc-chart-title").style("display", "block");

			//set width of container
			this.wrap.style("width", this.config.width * 1.1).style("display", "block");

			//remove padding/margins
			this.wrap.selectAll(".wc-chart").style("padding-bottom", "2px");

			//border between multiple
			this.wrap.selectAll(".wc-chart-title").style("border-top", "1px solid #eee");
			//set y scale based on values & normal range
			var filtered_data = this.raw_data.filter(function (f) {
				return f[_this3.filters[0].col] === _this3.filters[0].val;
			});
			var normlovals = filtered_data.map(function (m) {
				return +m[chart.config.normal_col_low];
			}).filter(function (f) {
				return +f || +f === 0;
			});

			var normhivals = filtered_data.map(function (m) {
				return +m[chart.config.normal_col_high];
			}).filter(function (f) {
				return +f || +f === 0;
			});

			var normlo = Math.min.apply(null, normlovals);
			var normhi = Math.max.apply(null, normhivals);

			var yvals = filtered_data.map(function (m) {
				return +m[chart.config.y.column];
			}).filter(function (f) {
				return +f || +f === 0;
			});

			var ylo = d3$1.min(yvals);
			var yhi = d3$1.max(yvals);
			var ymin = d3$1.min([ylo, normlo]);
			var ymax = d3$1.max([yhi, normhi]);

			this.config.y_dom = [ymin, ymax];
		});

		multiples.on('draw', function () {
			//borrow same domain for x
			this.x_dom = chart.x.domain();
		});

		multiples.on("resize", function () {
			//draw normal range
			rangePolygon(this);

			// axis tweaks
			var units = this.current_data[0].values.raw[0][chart.config.unit_col];
			this.svg.select(".y.axis").select(".axis-title").text(units);
			this.svg.select(".x.axis").select(".axis-title").remove();

			//delete the legend
			this.legend.remove();
		});

		var ptData = chart.raw_data.filter(function (f) {
			return f[chart.config.id_col] === id;
		});

		webcharts.multiply(multiples, ptData, chart.config.measure_col);
	}

	function adjustTicks(axis, dx, dy, rotation, anchor) {
		if (!axis) return;
		this.svg.selectAll("." + axis + ".axis .tick text").attr({
			"transform": "rotate(" + rotation + ")",
			"dx": dx,
			"dy": dy
		}).style("text-anchor", anchor || 'start');
	}

	function onResize() {
		var config = this.config;
		var chart = this;
		function highlight(id) {
			var myLine = chart.svg.selectAll(".line").filter(function (d) {
				return d.values[0].values.raw[0][config.id_col] === id;
			});

			var myPoints = chart.svg.selectAll(".point").filter(function (d) {
				return d.values.raw[0][config.id_col] === id;
			});

			myLine.select("path").attr("stroke-width", 4);
			myPoints.select("circle").attr("r", 4);
		}

		function clearHighlight() {
			chart.svg.selectAll(".line:not(.selected)").select("path").attr("stroke-width", .5);
			chart.svg.selectAll(".point:not(.selected)").select("circle").attr("r", 2);
		}

		//Set up event listeners on lines and points
		var mainChart = this;
		this.svg.selectAll(".line").on("mouseover", function (d) {
			var id = d.values[0].values.raw[0][config.id_col];
			highlight(id);
		}).on("mouseout", clearHighlight).on("click", function (d) {
			var id = d.values[0].values.raw[0][config.id_col];
			chart.svg.selectAll(".line").classed('selected', false);
			chart.svg.selectAll(".point").classed('selected', false);
			d3.select(this).classed('selected', true);
			chart.svg.selectAll(".point").filter(function (d) {
				return d.values.raw[0][config.id_col] === id;
			}).classed('selected', true);

			smallMultiples(id, mainChart);
			highlight(id);
		});

		this.svg.selectAll(".point").on("mouseover", function (d) {
			var id = d.values.raw[0][config.id_col];
			highlight(id);
		}).on("mouseout", clearHighlight).on("click", function (d) {
			var id = d.values.raw[0][config.id_col];

			chart.svg.selectAll(".line").classed('selected', false);
			chart.svg.selectAll(".point").classed('selected', false);
			chart.svg.selectAll(".point").filter(function (d) {
				return d.values.raw[0][config.id_col] === id;
			}).classed('selected', true);
			chart.svg.selectAll(".line").filter(function (d) {
				return d.values[0].values.raw[0][config.id_col] === id;
			}).classed('selected', true);

			smallMultiples(id, mainChart);
			highlight(id);
		});

		//draw reference boxplot
		this.svg.select("g.boxplot").remove();
		var myValues = this.current_data.map(function (d) {
			return d.values.y;
		});

		addBoxplot(this.svg, myValues, this.plot_height, 1, this.y_dom, 10, "#bbb", "white");
		this.svg.select("g.boxplot").attr("transform", "translate(" + (this.plot_width + this.config.margin.right / 2) + ",0)");

		this.svg.select('.overlay').on('click', function () {
			//clear current multiples
			chart.wrap.select('.multiples').select('.wc-small-multiples').remove();
			chart.svg.selectAll(".line").classed('selected', false);
			chart.svg.selectAll(".point").classed('selected', false);
			clearHighlight();
		});

		// rotate ticks
		if (config.x.tickAttr) {
			adjustTicks.call(this, 'x', 0, 0, config.x.tickAttr.rotate, config.x.tickAttr.anchor);
		}
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

	function yourFunctionNameHere(element, settings$$) {

		//merge user's settings with defaults
		var mergedSettings = Object.assign({}, settings, settings$$);

		//keep settings in sync with the data mappings
		mergedSettings = syncSettings(mergedSettings);

		//keep control inputs in sync and create controls object (if needed)
		var syncedControlInputs = syncControlInputs(controlInputs, mergedSettings);
		var controls = webcharts.createControls(element, { location: 'top', inputs: syncedControlInputs });

		//create chart
		var chart = webcharts.createChart(element, mergedSettings, controls);
		chart.on('init', onInit);
		chart.on('layout', onLayout);
		chart.on('datatransform', onDataTransform);
		chart.on('draw', onDraw);
		chart.on('resize', onResize);

		return chart;
	}

	return yourFunctionNameHere;
})(webCharts, d3);

