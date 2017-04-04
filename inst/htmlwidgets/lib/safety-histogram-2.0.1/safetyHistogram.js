var safetyHistogram = function (webcharts, d3$1) {
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
        //Default template settings
        value_col: 'STRESN',
        measure_col: 'TEST',
        unit_col: 'STRESU',
        normal_range: true,
        normal_col_low: 'STNRLO',
        normal_col_high: 'STNRHI',
        id_col: 'USUBJID',
        filters: null,
        details: null,
        start_value: null,
        missingValues: ['', 'NA', 'N/A'],

        //Standard webcharts settings
        x: {
            'column': null, // set in syncSettings()
            'label': null, // set in syncSettings()
            'type': 'linear',
            'bin': 25,
            'behavior': 'flex',
            'format': '.1f'
        },
        y: {
            'label': '# of Observations',
            'type': 'linear',
            'behavior': 'flex',
            'column': '',
            'domain': [0, null]
        },
        marks: [{
            'per': [], // set in syncSettings()
            'type': 'bar',
            'summarizeY': 'count',
            'summarizeX': 'mean',
            'attributes': { 'fill-opacity': 0.75 }
        }],
        aspect: 3,
        displayNormalRange: false
    };

    //Replicate settings in multiple places in the settings object
    function syncSettings(settings) {
        settings.x.label = settings.start_value;
        settings.x.column = settings.value_col;
        settings.marks[0].per[0] = settings.value_col;

        if (!settings.normal_range) {
            settings.normal_col_low = null;
            settings.normal_col_high = null;
        }

        //Define default details.
        var defaultDetails = [{ value_col: settings.id_col, label: 'Subject Identifier' }];
        if (settings.filters) settings.filters.forEach(function (filter) {
            return defaultDetails.push({ value_col: filter.value_col ? filter.value_col : filter,
                label: filter.label ? filter.label : filter.value_col ? filter.value_col : filter });
        });
        defaultDetails.push({ value_col: settings.value_col, label: 'Result' });
        if (settings.normal_col_low) defaultDetails.push({ value_col: settings.normal_col_low, label: 'Lower Limit of Normal' });
        if (settings.normal_col_high) defaultDetails.push({ value_col: settings.normal_col_high, label: 'Upper Limit of Normal' });

        //If [settings.details] is not specified:
        if (!settings.details) settings.details = defaultDetails;
        //If [settings.details] is specified:
        else {
                //Allow user to specify an array of columns or an array of objects with a column property
                //and optionally a column label.
                settings.details.forEach(function (detail) {
                    if (defaultDetails.map(function (d) {
                        return d.value_col;
                    }).indexOf(detail.value_col ? detail.value_col : detail) === -1) defaultDetails.push({ value_col: detail.value_col ? detail.value_col : detail,
                        label: detail.label ? detail.label : detail.value_col ? detail.value_col : detail });
                });
                settings.details = defaultDetails;
            }

        return settings;
    }

    //Map values from settings to control inputs
    function syncControlInputs(settings) {
        var defaultControls = [{ type: 'subsetter',
            label: 'Measure',
            value_col: settings.measure_col,
            start: settings.start_value }, { type: 'checkbox',
            label: 'Normal Range',
            option: 'displayNormalRange' }];

        if (settings.filters && settings.filters.length > 0) {
            var otherFilters = settings.filters.map(function (filter) {
                filter = { type: 'subsetter',
                    value_col: filter.value_col ? filter.value_col : filter,
                    label: filter.label ? filter.label : filter.value_col ? filter.value_col : filter };
                return filter;
            });
            return defaultControls.concat(otherFilters);
        } else return defaultControls;
    }

    function getValType(data, variable) {
        var values = d3.set(data.map(function (d) {
            return d[variable];
        })).values();
        var numericValues = values.filter(function (value) {
            return +value || +value === 0;
        });

        if (values.length === numericValues.length) return 'continuous';else return 'categorical';
    }

    function onInit() {
        var _this = this;

        var context = this;
        var config = this.config;

        //Remove filters whose [ value_col ] does not appear in the data.
        var columns = d3.keys(this.raw_data[0]);
        this.controls.config.inputs = this.controls.config.inputs.filter(function (d) {
            return columns.indexOf(d.value_col) > -1 || !!d.option;
        });
        this.listing.config.cols = this.listing.config.cols.filter(function (d) {
            return columns.indexOf(d) > -1;
        });

        //Remove whitespace from measure column values.
        this.raw_data.forEach(function (e) {
            return e[config.measure_col] = e[config.measure_col].trim();
        });

        //Drop missing values.
        this.populationCount = d3$1.set(this.raw_data.map(function (d) {
            return d[config.id_col];
        })).values().length;
        this.raw_data = this.raw_data.filter(function (f) {
            return config.missingValues.indexOf(f[config.value_col]) === -1;
        });

        //Remove measures with any non-numeric results.
        var allMeasures = d3$1.set(this.raw_data.map(function (m) {
            return m[config.measure_col];
        })).values();
        var catMeasures = allMeasures.filter(function (measure) {
            var measureData = _this.raw_data.filter(function (d) {
                return d[config.measure_col] === measure;
            });
            var measureType = getValType(measureData, config.value_col);

            return measureType === 'categorical';
        });
        var conMeasures = allMeasures.filter(function (measure) {
            return catMeasures.indexOf(measure) === -1;
        });
        if (catMeasures.length) console.warn(catMeasures.length + ' non-numeric endpoints have been removed: ' + catMeasures.join(', '));
        this.raw_data = this.raw_data.filter(function (d) {
            return catMeasures.indexOf(d[config.measure_col]) === -1;
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

        //Define initial measure.
        this.controls.config.inputs[0].start = this.config.start_value || conMeasures[0];
    };

    function onLayout() {
        var chart = this;

        //Add population count container.
        this.controls.wrap.append('div').attr('id', 'populationCount').style('font-style', 'italic');

        //Add footnote.
        this.wrap.insert('p', '.wc-chart').attr('class', 'annote').text('Click a bar for details.');
    }

    function onPreprocess() {
        var _this = this;

        var chart = this;

        //Filter raw data on currently selected measure.
        var measure = this.filters.filter(function (filter) {
            return filter.col === _this.config.measure_col;
        })[0].val;
        this.measure_data = this.raw_data.filter(function (d) {
            return d[_this.config.measure_col] === measure;
        });

        //Set x-domain based on currently selected measure.
        this.config.x.domain = d3.extent(this.measure_data, function (d) {
            return +d[chart.config.value_col];
        });

        //Determine whether currently selected measure contains normal range data.
        if (this.config.normal_range) {
            var hasNormalRange = this.measure_data.filter(function (d) {
                return (+d[chart.config.normal_col_low] || !!d[chart.config.normal_col_low]) && (+d[chart.config.normal_col_high] || !!d[chart.config.normal_col_high]);
            }).length > 0;
            var normalRangeInput = this.controls.wrap.selectAll('.control-group').filter(function (d) {
                return d.label === 'Normal Range';
            }).select('input');

            if (!hasNormalRange) normalRangeInput.attr('title', 'This measure does not contain normal range data.').style('cursor', 'not-allowed').property('checked', false).property('disabled', true);else normalRangeInput.attr('title', '').style('cursor', 'pointer').property('checked', this.config.displayNormalRange).property('disabled', false);
        }
    }

    function onDataTransform() {
        var context = this;

        //Customize the x-axis label
        if (this.filtered_data.length) this.config.x.label = '' + this.filtered_data[0][this.config.measure_col] + (this.config.unit_col ? ' (' + this.filtered_data[0][this.config.unit_col] + ')' : '');

        //Reset linked table
        this.listing.draw([]);
        this.wrap.select('.annote').classed('tableTitle', false).text('Click a bar for details.');
        this.svg.selectAll('.bar').attr('opacity', 1);
    }

    // Takes a webcharts object creates a text annotation giving the 
    // number and percentage of observations shown in the current view 
    // inputs:
    // chart - a webcharts chart object
    // id_col - a column name in the raw data set (chart.raw_data) representing the observation of interest
    // id_unit - a text string to label the units in the annotation (default = "participants")
    // selector - css selector for the annotation
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
        var context = this;

        //Annotate population count.
        updateSubjectCount(this, '#populationCount');

        //Update x-domain when all values are equal.
        if (this.config.x.type === 'linear' && this.x_dom[0] === this.x_dom[1]) this.x_dom = [this.x_dom[0] - 1, this.x_dom[1] + 1];
    }

    function drawNormalRanges(chart) {
        //Clear normal ranges.
        var canvas = chart.wrap.select('.bar-supergroup');
        canvas.selectAll('.normalRange').remove();

        //Capture distinct normal ranges in filtered data.
        var normalRanges = d3.nest().key(function (d) {
            return d[chart.config.normal_col_low] + ',' + d[chart.config.normal_col_high];
        }) // set key to comma-delimited normal range
        .rollup(function (d) {
            return d.length;
        }).entries(chart.filtered_data);
        var currentRange = d3.extent(chart.filtered_data, function (d) {
            return +d[chart.config.value_col];
        });
        //Sort normal ranges so larger normal ranges plot beneath smaller normal ranges.
        normalRanges.sort(function (a, b) {
            var a_lo = a.key.split(',')[0];
            var a_hi = a.key.split(',')[1];
            var b_lo = b.key.split(',')[0];
            var b_hi = b.key.split(',')[1];
            return a_lo <= b_lo && a_hi >= b_hi ? 2 : // lesser minimum and greater maximum
            a_lo >= b_lo && a_hi <= b_hi ? -2 : // greater minimum and lesser maximum 
            a_lo <= b_lo && a_hi <= b_hi ? 1 : // lesser minimum and lesser maximum
            a_lo >= b_lo && a_hi >= b_hi ? -1 : // greater minimum and greater maximum 
            1;
        });
        //Add divs to chart for each normal range.
        canvas.selectAll('.normalRange rect').data(normalRanges).enter().insert('rect', ':first-child').attr({ 'class': 'normalRange',
            'x': function x(d) {
                return chart.x(Math.max(+d.key.split(',')[0], currentRange[0]));
            } // set x to range low
            , 'y': 0,
            'width': function width(d) {
                return Math.min(chart.plot_width - chart.x(Math.max(+d.key.split(',')[0], currentRange[0])), // chart width - range low

                chart.x(+d.key.split(',')[1]) - chart.x(Math.max(+d.key.split(',')[0], currentRange[0])));
            } // range high - range low

            , 'height': chart.plot_height }).style({ 'stroke': 'black',
            'fill': 'black',
            'stroke-opacity': function strokeOpacity(d) {
                return d.values / chart.filtered_data.length * .75;
            } // opacity as a function of fraction of records with the given normal range
            , 'fill-opacity': function fillOpacity(d) {
                return d.values / chart.filtered_data.length * .5;
            } }) // opacity as a function of fraction of records with the given normal range
        .append('title').text(function (d) {
            return 'Normal range: ' + d.key.split(',')[0] + '-' + d.key.split(',')[1] + (chart.config.unit_col ? '' + chart.filtered_data[0][chart.config.unit_col] : '') + (' (' + d3.format('%')(d.values / chart.filtered_data.length) + ' of records)');
        });
    }

    function onResize() {
        var chart = this;
        var config = this.config;

        //Define listing columns and headers.
        var listing = this.listing;
        listing.config.cols = config.details.map(function (detail) {
            return detail.value_col;
        });
        listing.config.headers = config.details.map(function (detail) {
            return detail.label;
        });

        //Display data listing on bin click.
        var cleanF = d3$1.format('.3f');
        var bins = this.svg.selectAll('.bar');
        var footnote = this.wrap.select('.annote');

        bins.style('cursor', 'pointer').on('click', function (d) {
            //Update footnote.
            footnote.classed('tableTitle', true).text('Table displays ' + d.values.raw.length + ' records with ' + (chart.filtered_data[0][config.measure_col] + ' values from ') + (cleanF(d.rangeLow) + ' to ' + cleanF(d.rangeHigh)) + (config.unit_col ? ' ' + chart.filtered_data[0][config.unit_col] : '') + '. Click outside a bar to remove details.');

            //Draw listing.
            listing.draw(d.values.raw);

            //Reduce bin opacity and highlight selected bin.
            bins.attr('fill-opacity', 0.5);
            d3$1.select(this).attr('fill-opacity', 1);
        }).on('mouseover', function (d) {
            //Update footnote.
            if (footnote.classed('tableTitle') === false) footnote.text(d.values.raw.length + ' records with ' + (chart.filtered_data[0][config.measure_col] + ' values from ') + (cleanF(d.rangeLow) + ' to ' + cleanF(d.rangeHigh)) + (config.unit_col ? ' ' + chart.filtered_data[0][config.unit_col] : ''));
        }).on('mouseout', function (d) {
            //Update footnote.
            if (footnote.classed('tableTitle') === false) footnote.text('Click a bar for details.');
        });

        //Visualize normal ranges.
        var normalRangeControl = this.controls.wrap.selectAll('.control-group').filter(function (d) {
            return d.label === 'Normal Range';
        });
        if (config.normal_range) {
            if (chart.config.displayNormalRange) drawNormalRanges(chart);else chart.wrap.selectAll('.normalRange').remove();

            normalRangeControl.on('change', function () {
                chart.config.displayNormalRange = d3.select(this).select('input').property('checked');

                if (chart.config.displayNormalRange) drawNormalRanges(chart);else chart.wrap.selectAll('.normalRange').remove();
            });
        } else normalRangeControl.style('display', 'none');

        //Clear listing when clicking outside bins.
        this.wrap.selectAll('.overlay, .normalRange').on('click', function () {
            listing.draw([]);
            bins.attr('fill-opacity', 0.75);

            if (footnote.classed('tableTitle')) footnote.classed('tableTitle', false).text('Click a bar for details.');
        });
    }

    function safetyHistogram(element, settings) {
        //Merge user's settings with default settings.
        var mergedSettings = Object.assign({}, defaultSettings, settings);

        //Keep settings in sync with the data mappings.
        mergedSettings = syncSettings(mergedSettings);

        //Keep control inputs in sync and create controls object.
        var syncedControlInputs = syncControlInputs(mergedSettings);
        var controls = webcharts.createControls(element, { location: 'top', inputs: syncedControlInputs });

        //Define chart
        var chart = webcharts.createChart(element, mergedSettings, controls);
        chart.on('init', onInit);
        chart.on('layout', onLayout);
        chart.on('preprocess', onPreprocess);
        chart.on('datatransform', onDataTransform);
        chart.on('draw', onDraw);
        chart.on('resize', onResize);

        var tableSettings = mergedSettings.details && mergedSettings.details.length > 0 ? { cols: mergedSettings.details.map(function (d) {
                return d.value_col;
            }) } : null;
        var listing = webcharts.createTable(element, tableSettings).init([]);
        chart.listing = listing;

        return chart;
    }

    return safetyHistogram;
}(webCharts, d3);

