var safetyResultsOverTime = function (webcharts, d3$1) {
    'use strict';

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

    var defaultSettings = {
        //Custom settings for this template
        id_col: 'USUBJID',
        time_settings: {
            value_col: 'VISITN',
            label: 'Visit Number',
            order: null, // x-axis domain order (array)
            rotate_tick_labels: false,
            vertical_space: 0 },
        measure_col: 'TEST',
        value_col: 'STRESN',
        unit_col: 'STRESU',
        normal_col_low: 'STNRLO',
        normal_col_high: 'STNRHI',
        start_value: null,
        groups: [{ value_col: 'NONE', label: 'None' }],
        filters: null,
        boxplots: true,
        violins: false,
        missingValues: ['', 'NA', 'N/A'],

        //Standard webcharts settings
        x: {
            column: null, // set in syncSettings()
            type: 'ordinal',
            label: null,
            behavior: 'flex',
            sort: 'alphabetical-ascending',
            tickAttr: null
        },
        y: {
            column: null, // set in syncSettings()
            type: 'linear',
            label: null,
            behavior: 'flex',
            stat: 'mean',
            format: '0.2f'
        },
        marks: [{
            type: 'line',
            per: null, // set in syncSettings()
            attributes: {
                'stroke-width': 2,
                'stroke-opacity': 1,
                'display': 'none'
            }
        }],
        legend: {
            mark: 'square'
        },
        color_by: null, // set in syncSettings()
        resizable: true,
        gridlines: 'y',
        aspect: 3
    };

    // Replicate settings in multiple places in the settings object
    function syncSettings(settings) {
        settings.x.column = settings.time_settings.value_col;
        settings.x.label = settings.time_settings.label;
        settings.x.order = settings.time_settings.order;
        settings.y.column = settings.value_col;
        if (settings.groups) settings.color_by = settings.groups[0].value_col ? settings.groups[0].value_col : settings.groups[0];else settings.color_by = 'NONE';
        settings.marks[0].per = [settings.color_by];
        settings.margin = settings.margin || { bottom: settings.time_settings.vertical_space };

        return settings;
    }

    // Default Control objects
    var controlInputs = [{
        type: 'subsetter',
        label: 'Measure',
        description: 'filter',
        value_col: null, // set in syncControlInputs()
        start: null // set in syncControlInputs()
    }, {
        type: 'dropdown',
        label: 'Group',
        description: 'stratification',
        options: ['marks.0.per.0', 'color_by'],
        start: null, // set in syncControlInputs()
        values: null, // set in syncControlInputs()
        require: true
    }, {
        type: 'radio',
        label: 'Hide visits with no data:',
        option: 'x.behavior',
        values: ['flex', 'raw'],
        relabels: ['Yes', 'No'],
        require: true
    }, { type: 'checkbox', option: 'boxplots', label: 'Box plots', inline: true }, { type: 'checkbox', option: 'violins', label: 'Violin plots', inline: true }];

    // Map values from settings to control inputs
    function syncControlInputs(controlInputs, settings) {
        //Sync measure control.
        var measureControl = controlInputs.filter(function (controlInput) {
            return controlInput.label === 'Measure';
        })[0];
        measureControl.value_col = settings.measure_col;
        measureControl.start = settings.start_value;

        //Sync group control.
        var groupControl = controlInputs.filter(function (controlInput) {
            return controlInput.label === 'Group';
        })[0];
        groupControl.start = settings.color_by;
        if (settings.groups) groupControl.values = settings.groups.map(function (group) {
            return group.value_col ? group.value_col : group;
        });

        //Add custom filters to control inputs.
        if (settings.filters) settings.filters.reverse().forEach(function (filter) {
            return controlInputs.splice(1, 0, { type: 'subsetter',
                value_col: filter.value_col ? filter.value_col : filter,
                label: filter.label ? filter.label : filter.value_col ? filter.value_col : filter,
                description: 'filter' });
        });

        return controlInputs;
    }

    function onInit() {
        var _this = this;

        var config = this.config;
        var allMeasures = d3$1.set(this.raw_data.map(function (m) {
            return m[config.measure_col];
        })).values();

        //'All'variable for non-grouped comparisons
        this.raw_data.forEach(function (d) {
            d.NONE = 'All Subjects';
        });

        //Drop missing values
        this.populationCount = d3$1.set(this.raw_data.map(function (d) {
            return d[config.id_col];
        })).values().length;
        this.raw_data = this.raw_data.filter(function (f) {
            return config.missingValues.indexOf(f[config.value_col]) === -1;
        });

        //warning for non-numeric endpoints
        var catMeasures = allMeasures.filter(function (f) {
            var measureVals = _this.raw_data.filter(function (d) {
                return d[config.measure_col] === f;
            });

            return webcharts.dataOps.getValType(measureVals, config.value_col) !== 'continuous';
        });
        if (catMeasures.length) {
            console.warn(catMeasures.length + ' non-numeric endpoints have been removed: ' + catMeasures.join(', '));
        }

        //delete non-numeric endpoints
        var numMeasures = allMeasures.filter(function (f) {
            var measureVals = _this.raw_data.filter(function (d) {
                return d[config.measure_col] === f;
            });

            return webcharts.dataOps.getValType(measureVals, config.value_col) === 'continuous';
        });

        this.raw_data = this.raw_data.filter(function (f) {
            return numMeasures.indexOf(f[config.measure_col]) > -1;
        });

        // Remove filters for variables with 0 or 1 levels
        var chart = this;

        this.controls.config.inputs = this.controls.config.inputs.filter(function (d) {
            if (d.type != "subsetter") {
                return true;
            } else {
                var levels = d3.set(chart.raw_data.map(function (f) {
                    return f[d.value_col];
                })).values();
                if (levels.length < 2) {
                    console.warn(d.value_col + " filter not shown since the variable has less than 2 levels");
                }
                return levels.length >= 2;
            }
        });

        //Choose the start value for the Test filter
        this.controls.config.inputs.filter(function (input) {
            return input.label === 'Measure';
        })[0].start = this.config.start_value || numMeasures[0];
    };

    function onLayout() {
        //Add population count container.
        this.controls.wrap.append('div').attr('id', 'populationCount').style('font-style', 'italic');
    }

    function onPreprocess() {
        var _this = this;

        //Capture currently selected measure.
        var measure = this.controls.wrap.selectAll('.control-group').filter(function (d) {
            return d.value_col && d.value_col === _this.config.measure_col;
        }).select('option:checked').text();

        //Filter data and nest data by visit and group.
        this.measure_data = this.raw_data.filter(function (d) {
            return d[_this.config.measure_col] === measure;
        });
        var nested_data = d3.nest().key(function (d) {
            return d[_this.config.x.column];
        }).key(function (d) {
            return d[_this.config.color_by];
        }).rollup(function (d) {
            return d.map(function (m) {
                return +m[_this.config.y.column];
            });
        }).entries(this.measure_data);

        //Define y-axis range based on currently selected measure.
        if (!this.config.violins) {
            var y_05s = [];
            var y_95s = [];
            nested_data.forEach(function (visit) {
                visit.values.forEach(function (group) {
                    var results = group.values.sort(d3.ascending);
                    y_05s.push(d3.quantile(results, 0.05));
                    y_95s.push(d3.quantile(results, 0.95));
                });
            });
            this.config.y.domain = [Math.min.apply(null, y_05s), Math.max.apply(null, y_95s)];
        } else this.config.y.domain = d3.extent(this.measure_data.map(function (d) {
            return +d[_this.config.y.column];
        }));
    }

    function onDataTransform() {
        //Redefine y-axis label.
        this.config.y.label = this.measure_data[0][this.config.measure_col] + ' (' + this.measure_data[0][this.config.unit_col] + ')';
        //Redefine legend label.
        var group_value_cols = this.config.groups.map(function (group) {
            return group.value_col ? group.value_col : group;
        });
        var group_labels = this.config.groups.map(function (group) {
            return group.label ? group.label : group.value_col ? group.value_col : group;
        });
        var group = this.config.color_by;

        if (group !== 'NONE') this.config.legend.label = group_labels[group_value_cols.indexOf(group)];else this.config.legend.label = '';
    }

    // Takes a webcharts object creates a text annotation giving the 
    // number and percentage of observations shown in the current view 
    //
    // inputs:
    // - chart - a webcharts chart object
    // - selector - css selector for the annotation
    // - id_unit - a text string to label the units in the annotation (default = "participants")
    function updateSubjectCount(chart, selector, id_unit) {
        //count the number of unique ids in the current chart and calculate the percentage
        var currentObs = d3.set(chart.filtered_data.map(function (d) {
            return d[chart.config.id_col];
        })).values().length;
        var percentage = d3.format('0.1%')(currentObs / chart.populationCount);

        //clear the annotation
        var annotation = d3.select(selector);
        d3.select(selector).selectAll("*").remove();

        //update the annotation
        var units = id_unit ? " " + id_unit : " participant(s)";
        annotation.text('\n' + currentObs + " of " + chart.populationCount + units + " shown (" + percentage + ")");
    }

    function onDraw() {
        var _this = this;

        this.marks[0].data.forEach(function (d) {
            d.values.sort(function (a, b) {
                return a.key === 'NA' ? 1 : b.key === 'NA' ? -1 : d3.ascending(a.key, b.key);
            });
        });

        //Nest filtered data.
        this.nested_data = d3.nest().key(function (d) {
            return d[_this.config.x.column];
        }).key(function (d) {
            return d[_this.config.color_by];
        }).rollup(function (d) {
            return d.map(function (m) {
                return +m[_this.config.y.column];
            });
        }).entries(this.filtered_data);

        //Clear y-axis ticks.
        this.svg.selectAll('.y .tick').remove();

        //Make nested data set for boxplots
        this.nested_data = d3$1.nest().key(function (d) {
            return d[_this.config.x.column];
        }).key(function (d) {
            return d[_this.config.marks[0].per[0]];
        }).rollup(function (d) {
            return d.map(function (m) {
                return +m[_this.config.y.column];
            });
        }).entries(this.filtered_data);

        //Annotate population count.
        updateSubjectCount(this, '#populationCount');
    }

    function addBoxplot(chart, group) {
        var boxInsideColor = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '#eee';
        var precision = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;

        //Make the numericResults numeric and sort.
        var numericResults = group.results.map(function (d) {
            return +d;
        }).sort(d3.ascending);
        var boxPlotWidth = .75 / chart.colorScale.domain().length;
        var boxColor = chart.colorScale(group.key);

        //Define x - and y - scales.
        var x = d3.scale.linear().range([0, chart.x.rangeBand()]);
        var y = chart.config.y.type === 'linear' ? d3.scale.linear().range([chart.plot_height, 0]).domain(chart.y.domain()) : d3.scale.log().range([chart.plot_height, 0]).domain(chart.y.domain());

        //Define quantiles of interest.
        var probs = [0.05, 0.25, 0.5, 0.75, 0.95],
            iS = void 0;
        for (var _i = 0; _i < probs.length; _i++) {
            probs[_i] = d3.quantile(numericResults, probs[_i]);
        }

        //Define box plot container.
        var boxplot = group.svg.append('g').attr('class', 'boxplot').datum({ values: numericResults,
            probs: probs });
        var left = x(0.5 - boxPlotWidth / 2);
        var right = x(0.5 + boxPlotWidth / 2);

        //Draw box.
        boxplot.append('rect').attr({ 'class': 'boxplot fill',
            'x': left,
            'width': right - left,
            'y': y(probs[3]),
            'height': y(probs[1]) - y(probs[3]) }).style('fill', boxColor);

        //Draw horizontal lines at 5th percentile, median, and 95th percentile.
        iS = [0, 2, 4];
        var iSclass = ['', 'median', ''];
        var iSColor = [boxColor, boxInsideColor, boxColor];
        for (var _i2 = 0; _i2 < iS.length; _i2++) {
            boxplot.append('line').attr({ 'class': 'boxplot ' + iSclass[_i2],
                'x1': left,
                'x2': right,
                'y1': y(probs[iS[_i2]]),
                'y2': y(probs[iS[_i2]]) }).style({ 'fill': iSColor[_i2],
                'stroke': iSColor[_i2] });
        }

        //Draw vertical lines from the 5th percentile to the 25th percentile and from the 75th percentile to the 95th percentile.
        iS = [[0, 1], [3, 4]];
        for (var i = 0; i < iS.length; i++) {
            boxplot.append('line').attr({ 'class': 'boxplot',
                'x1': x(0.5),
                'x2': x(0.5),
                'y1': y(probs[iS[i][0]]),
                'y2': y(probs[iS[i][1]]) }).style('stroke', boxColor);
        }

        //Draw outer circle.
        boxplot.append('circle').attr({ 'class': 'boxplot mean',
            'cx': x(0.5),
            'cy': y(d3.mean(numericResults)),
            'r': x(boxPlotWidth / 3) }).style({ 'fill': boxInsideColor,
            'stroke': boxColor });

        //Draw inner circle.
        boxplot.append('circle').attr({ 'class': 'boxplot mean',
            'cx': x(0.5),
            'cy': y(d3.mean(numericResults)),
            'r': x(boxPlotWidth / 6) }).style({ 'fill': boxColor,
            'stroke': 'none' });

        //Annotate statistics.
        var format0 = d3.format('.' + (precision + 0) + 'f');
        var format1 = d3.format('.' + (precision + 1) + 'f');
        var format2 = d3.format('.' + (precision + 2) + 'f');
        boxplot.selectAll('.boxplot').append('title').text(function (d) {
            return 'N = ' + d.values.length + '\nMin = ' + d3.min(d.values) + '\n5th % = ' + format1(d3.quantile(d.values, 0.05)) + '\nQ1 = ' + format1(d3.quantile(d.values, 0.25)) + '\nMedian = ' + format1(d3.median(d.values)) + '\nQ3 = ' + format1(d3.quantile(d.values, 0.75)) + '\n95th % = ' + format1(d3.quantile(d.values, 0.95)) + '\nMax = ' + d3.max(d.values) + '\nMean = ' + format1(d3.mean(d.values)) + '\nStDev = ' + format2(d3.deviation(d.values));
        });
    }

    function addViolin(chart, group) {
        var violinColor = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '#ccc7d6';
        var precision = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;

        //Define histogram data.
        var histogram = d3.layout.histogram().bins(10).frequency(0);
        var data = histogram(group.results);
        data.unshift({ x: d3.min(group.results),
            dx: 0,
            y: data[0].y });
        data.push({ x: d3.max(group.results),
            dx: 0,
            y: data[data.length - 1].y });

        //Define plot properties.
        var width = chart.x.rangeBand();
        var x = chart.config.y.type === 'linear' ? d3.scale.linear().domain(chart.y.domain()).range([chart.plot_height, 0]) : d3.scale.log().domain(chart.y.domain()).range([chart.plot_height, 0]);
        var y = d3.scale.linear().domain([0, Math.max(1 - 1 / group.x.nGroups, d3.max(data, function (d) {
            return d.y;
        }))]).range([width / 2, 0]);

        //Define violin shapes.
        var area = d3.svg.area().interpolate('basis').x(function (d) {
            return x(d.x + d.dx / 2);
        }).y0(width / 2).y1(function (d) {
            return y(d.y);
        });
        var line = d3.svg.line().interpolate('basis').x(function (d) {
            return x(d.x + d.dx / 2);
        }).y(function (d) {
            return y(d.y);
        });

        //Define left half of violin plot.
        var gMinus = group.svg.append('g').attr('transform', 'rotate(90,0,0) scale(1,-1)');
        gMinus.append('path').datum(data).attr({ 'class': 'area',
            'd': area,
            'fill': violinColor,
            'fill-opacity': .75 });
        gMinus.append('path').datum(data).attr({ 'class': 'violin',
            'd': line,
            'stroke': violinColor,
            'fill': 'none' });

        //Define right half of violin plot.
        var gPlus = group.svg.append('g').attr('transform', 'rotate(90,0,0) translate(0,-' + width + ')');
        gPlus.append('path').datum(data).attr({ 'class': 'area',
            'd': area,
            'fill': violinColor,
            'fill-opacity': .75 });
        gPlus.append('path').datum(data).attr({ 'class': 'violin',
            'd': line,
            'stroke': violinColor,
            'fill': 'none' });

        //Annotate statistics.
        var format0 = d3.format('.' + (precision + 0) + 'f');
        var format1 = d3.format('.' + (precision + 1) + 'f');
        var format2 = d3.format('.' + (precision + 2) + 'f');
        group.svg.selectAll('g').append('title').text(function (d) {
            return 'N = ' + group.results.length + '\nMin = ' + d3.min(group.results) + '\n5th % = ' + format1(d3.quantile(group.results, 0.05)) + '\nQ1 = ' + format1(d3.quantile(group.results, 0.25)) + '\nMedian = ' + format1(d3.median(group.results)) + '\nQ3 = ' + format1(d3.quantile(group.results, 0.75)) + '\n95th % = ' + format1(d3.quantile(group.results, 0.95)) + '\nMax = ' + d3.max(group.results) + '\nMean = ' + format1(d3.mean(group.results)) + '\nStDev = ' + format2(d3.deviation(group.results));
        });
    }

    function onResize() {
        var _this = this;

        var config = this.config;

        //Hide Group control if only one grouping is specified.
        var groupControl = this.controls.wrap.selectAll('.control-group').filter(function (controlGroup) {
            return controlGroup.label === 'Group';
        });
        groupControl.style('display', function (d) {
            return d.values.length === 1 ? 'none' : groupControl.style('display');
        });

        //Manually draw y-axis ticks when none exist.
        if (!this.svg.selectAll('.y .tick')[0].length) {
            var probs = [{ probability: .05 }, { probability: .25 }, { probability: .50 }, { probability: .75 }, { probability: .95 }];

            for (var i = 0; i < probs.length; i++) {
                probs[i].quantile = d3.quantile(this.measure_data.map(function (d) {
                    return +d[_this.config.y.column];
                }).sort(), probs[i].probability);
            }

            var ticks = [probs[1].quantile, probs[3].quantile];
            this.yAxis.tickValues(ticks);
            this.svg.select('g.y.axis').transition().call(this.yAxis);
            this.drawGridlines();
        }

        //Rotate x-axis tick labels.
        if (config.time_settings.rotate_tick_labels) this.svg.selectAll('.x.axis .tick text').attr({ 'transform': 'rotate(-45)',
            'dx': -10,
            'dy': 10 }).style('text-anchor', 'end');

        //Draw reference boxplot.
        this.svg.selectAll('.boxplot-wrap').remove();

        this.nested_data.forEach(function (e) {
            //Sort [ config.color_by ] groups.
            e.values = e.values.sort(function (a, b) {
                return _this.colorScale.domain().indexOf(a.key) < _this.colorScale.domain().indexOf(b.key) ? -1 : 1;
            });

            //Define group object.
            var group = {};
            group.x = { key: e.key // x-axis value
                , nGroups: _this.colorScale.domain().length // number of groups at x-axis value
                , width: _this.x.rangeBand() // width of x-axis value
            };
            //Given an odd number of groups, center first box and offset the rest.
            //Given an even number of groups, offset all boxes.
            group.x.start = group.x.nGroups % 2 ? 0 : 1;

            e.values.forEach(function (v, i) {
                group.key = v.key;
                //Calculate direction in which to offset each box plot.
                group.direction = i > 0 ? Math.pow(-1, i % 2) * (group.x.start ? 1 : -1) : group.x.start;
                //Calculate multiplier of offset distance.
                group.multiplier = Math.round((i + group.x.start) / 2);
                //Calculate offset distance as a function of the x-axis range band, number of groups, and whether
                //the number of groups is even or odd.
                group.distance = group.x.width / group.x.nGroups;
                group.distanceOffset = group.x.start * -1 * group.direction * group.x.width / group.x.nGroups / 2;
                //Calculate offset.
                group.offset = group.direction * group.multiplier * group.distance + group.distanceOffset;
                //Capture all results within visit and group.
                group.results = v.values.sort(d3$1.ascending).map(function (d) {
                    return +d;
                });

                if (_this.x_dom.indexOf(group.x.key) > -1) {
                    group.svg = _this.svg.append('g').attr({ 'class': 'boxplot-wrap overlay-item',
                        'transform': 'translate(' + (_this.x(group.x.key) + group.offset) + ',0)' }).datum({ values: group.results });

                    if (config.boxplots) addBoxplot(_this, group);

                    if (config.violins) addViolin(_this, group);
                }
            });
        });
    }

    function safetyResultsOverTime(element, settings) {

        //Merge user settings onto default settings.
        var mergedSettings = Object.assign({}, defaultSettings, settings);

        //Sync properties within merged settings, e.g. data mappings.
        mergedSettings = syncSettings(mergedSettings);

        //Sync merged settings with controls.
        var syncedControlInputs = syncControlInputs(controlInputs, mergedSettings);
        var controls = webcharts.createControls(element, { location: 'top', inputs: syncedControlInputs });

        //Define chart.
        var chart = webcharts.createChart(element, mergedSettings, controls);
        chart.on('init', onInit);
        chart.on('layout', onLayout);
        chart.on('preprocess', onPreprocess);
        chart.on('datatransform', onDataTransform);
        chart.on('draw', onDraw);
        chart.on('resize', onResize);

        return chart;
    }

    return safetyResultsOverTime;
}(webCharts, d3);

