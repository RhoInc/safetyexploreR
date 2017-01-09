"use strict";

var safetyResultsOverTime = (function (webcharts, d3$1) {
	'use strict';

	var settings = {
		//Addition settings for this template
		id_col: "USUBJID",
		time_col: "VISITN",
		measure_col: "TEST",
		value_col: "STRESN",
		unit_col: "STRESU",
		normal_col_low: "STNRLO",
		normal_col_high: "STNRHI",
		group_cols: ["SEX", "RACE"],
		start_value: null,
		rotateX: true,
		missingValues: ["NA", ""],
		boxplots: true,
		violins: false,

		//Standard webcharts settings
		x: {
			column: null, //set in syncSettings()
			type: "ordinal",
			label: null,
			sort: "alphabetical-ascending",
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
			type: "line",
			per: ["ALL"],
			attributes: {
				'stroke-width': 2,
				'stroke-opacity': 1,
				"display": "none"
			}
		}],
		legend: {
			label: ''
		},
		color_by: 'ALL',
		resizable: false,
		height: 500,
		range_band: 20,
		margin: { bottom: 50 },
		gridlines: 'xy'
	};

	// Replicate settings in multiple places in the settings object
	function syncSettings(settings) {
		settings.x.column = settings.time_col;
		settings.y.column = settings.value_col;
		return settings;
	}

	// Default Control objects
	var controlInputs = [{
		label: "Measure",
		value_col: null, //set in syncControlInputs()
		type: "subsetter",
		start: null
	}, {
		label: "Group",
		options: ["marks.0.per.0", "color_by"],
		type: "dropdown",
		require: true,
		values: ["ALL"], //additional options added in syncControlInputs()
		start: "ALL"
	}, {
		label: "Hide visits with no data:",
		option: "x.behavior",
		type: "radio",
		require: true,
		values: ['flex', 'raw'],
		relabels: ['Yes', "No"]
	}, { type: "checkbox", option: "violins", label: "Violin Plots", inline: true }, { type: "checkbox", option: "boxplots", label: "Box Plots", inline: true }];

	// Map values from settings to control inputs
	function syncControlInputs(controlInputs, settings) {
		var measureControl = controlInputs.filter(function (d) {
			return d.label == "Measure";
		})[0];
		measureControl.value_col = settings.measure_col;

		var groupControl = controlInputs.filter(function (d) {
			return d.label == "Group";
		})[0];
		//groupControl.values = d3.merge([groupControl.values,settings.group_cols])
		if (settings.group_cols) {
			settings.group_cols.forEach(function (d) {
				if (groupControl.values.indexOf(d) == -1) {
					groupControl.values.push(d);
				}
			});
		}
		return controlInputs;
	}

	function onInit() {
		var _this = this;

		var config = this.config;
		var allMeasures = d3$1.set(this.raw_data.map(function (m) {
			return m[config.measure_col];
		})).values();

		// "All" variable for non-grouped comparisons
		this.raw_data.forEach(function (e) {
			return e.ALL = "All";
		});

		//Drop missing values
		this.raw_data = this.raw_data.filter(function (f) {
			return config.missingValues.indexOf(f[config.value_col]) === -1;
		});

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

		//Choose the start value for the Test filter
		this.controls.config.inputs[0].start = this.config.startValue || numMeasures[0];
	};

	function onLayout() {}

	function onDataTransform() {}

	function onDraw() {
		var _this2 = this;

		this.marks[0].data.forEach(function (e) {
			e.values.sort(function (a, b) {
				return a.key === 'NA' ? 1 : b.key === 'NA' ? -1 : d3$1.ascending(a.key, b.key);
			});
		});

		var sortVar = this.config.x.column;

		// Make nested data set for boxplots
		this.nested_data = d3$1.nest().key(function (d) {
			return d[_this2.config.x.column];
		}).key(function (d) {
			return d[_this2.config.marks[0].per[0]];
		}).rollup(function (d) {
			return d.map(function (m) {
				return +m[_this2.config.y.column];
			});
		}).entries(this.filtered_data);

		// y-domain for box plots
		var y_05s = [];
		var y_95s = [];
		this.nested_data.forEach(function (e) {
			e.values.forEach(function (v, i) {
				var results = v.values.sort(d3$1.ascending);
				y_05s.push(d3$1.quantile(results, 0.05));
				y_95s.push(d3$1.quantile(results, 0.95));
			});
		});
		this.y_dom[0] = Math.min.apply(null, y_05s);
		this.y_dom[1] = Math.max.apply(null, y_95s);

		if (this.config.violins) {
			this.y_dom = d3$1.extent(this.filtered_data.map(function (m) {
				return +m[_this2.config.y.column];
			}));
		}
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

	function addViolin(svg, results, height, width, domain, imposeMax, violinColor) {
		var interpolation = "basis";

		var data = d3.layout.histogram().bins(10).frequency(0)(results);

		var y = d3.scale.linear().range([width / 2, 0]).domain([0, Math.max(imposeMax, d3.max(data, function (d) {
			return d.y;
		}))]).clamp(true);

		var x = d3.scale.linear().range([height, 0]).domain(domain);
		//.nice() ;

		var area = d3.svg.area().interpolate(interpolation).x(function (d) {
			if (interpolation == "step-before") return x(d.x + d.dx / 2);
			return x(d.x);
		}).y0(width / 2).y1(function (d) {
			return y(d.y);
		});

		var line = d3.svg.line().interpolate(interpolation).x(function (d) {
			if (interpolation == "step-before") return x(d.x + d.dx / 2);
			return x(d.x);
		}).y(function (d) {
			return y(d.y);
		});

		var gPlus = svg.append("g");
		var gMinus = svg.append("g");

		gPlus.append("path").datum(data).attr("class", "area").attr("d", area).attr("fill", violinColor);

		gPlus.append("path").datum(data).attr("class", "violin").attr("d", line).attr("stroke", violinColor).attr("fill", "none");

		gMinus.append("path").datum(data).attr("class", "area").attr("d", area).attr("fill", violinColor);

		gMinus.append("path").datum(data).attr("class", "violin").attr("d", line).attr("stroke", violinColor).attr("fill", "none");

		gPlus.attr("transform", "rotate(90,0,0)  translate(0,-" + width + ")"); //translate(0,-200)");
		gMinus.attr("transform", "rotate(90,0,0) scale(1,-1)");
	};

	function adjustTicks(axis, dx, dy, rotation, anchor) {
		if (!axis) return;
		this.svg.selectAll("." + axis + ".axis .tick text").attr({
			"transform": "rotate(" + rotation + ")",
			"dx": dx,
			"dy": dy
		}).style("text-anchor", anchor || 'start');
	}

	function onResize() {
		var _this3 = this;

		var config = this.config;
		var units = this.filtered_data[0][config.unit_col];
		var measure = this.filtered_data[0][config.measure_col];

		this.svg.select(".y.axis").select(".axis-title").text(measure + " level (" + units + ")");

		//draw reference boxplot
		this.svg.selectAll(".boxplot-wrap").remove();

		this.nested_data.forEach(function (e) {
			e.values.forEach(function (v, i) {
				var index = _this3.colorScale.domain().indexOf(v.key);
				var sign = index % 2 === 0 ? -1 : 1;
				var multiplier = index === 1 ? 1 : Math.floor(index / 2);
				var offset = sign * multiplier * _this3.colorScale.domain().length * 4;
				var results = v.values.sort(d3$1.ascending).map(function (d) {
					return +d;
				});
				if (_this3.x_dom.indexOf(e.key) > -1) {
					var g = _this3.svg.append("g").attr("class", "boxplot-wrap overlay-item").attr("transform", "translate(" + (_this3.x(e.key) + offset) + ",0)").datum({ values: results });

					var boxPlotWidth = _this3.colorScale.domain().length === 1 ? 1 : _this3.colorScale.domain().length === 2 ? 0.33 : 0.25;

					if (config.boxplots) {
						addBoxplot(g, //svg
						results, //results
						_this3.plot_height, //height
						_this3.x.rangeBand(), //width
						_this3.y.domain(), //domain
						boxPlotWidth, //boxPlotWidth
						_this3.colorScale(v.key), //boxColor
						"#eee" //boxInsideColor
						);
					}

					if (config.violins) {
						addViolin(g, results, _this3.plot_height, _this3.x.rangeBand(), _this3.y.domain(), 1 / _this3.colorScale.domain().length / 3, "#ccc7d6");
					}
				}
			});
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

