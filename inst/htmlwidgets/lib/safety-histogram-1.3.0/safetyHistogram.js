var safetyHistogram = function (webcharts, d3$1) {
    'use strict';

    const config = {
        //Default template settings
        value_col: 'STRESN',
        measure_col: 'TEST',
        unit_col: 'STRESU',
        normal_col_low: 'STNRLO',
        normal_col_high: 'STNRHI',
        id_col: 'USUBJID',
        filters: [],
        detail_cols: null,
        start_value: null,
        rotateX: true,
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
        'aspect': 1.66,
        'max_width': '800'
    };

    //Replicate settings in multiple places in the settings object
    function syncSettings(settings) {
        settings.x.label = settings.start_value;
        settings.x.column = settings.value_col;
        settings.marks[0].per[0] = settings.value_col;

        //Set [ settings.detail_cols ] to columns specified in default template settings.
        if (settings.detail_cols === null) {
            settings.detail_cols = [settings.id_col];
            settings.filters.forEach(d => settings.detail_cols.push(d.value_col));
            settings.detail_cols.push(settings.measure_col, settings.value_col, settings.unit_col, settings.normal_col_low, settings.normal_col_high);
        }

        return settings;
    }

    //Map values from settings to control inputs
    function syncControlInputs(settings) {
        var measureFilter = { type: 'subsetter',
            value_col: settings.measure_col,
            label: 'Measure',
            start: null };

        if (settings.filters && settings.filters.length > 0) {
            var otherFilters = settings.filters.map(d => {
                return {
                    type: 'subsetter',
                    value_col: d.value_col,
                    label: d.label && /^\s*$/.test(d.label) === false ? d.label : d.value_col };
            });
            return [measureFilter].concat(otherFilters);
        } else return [measureFilter];
    }

    function onInit() {
        const config = this.config;
        const allMeasures = d3$1.set(this.raw_data.map(m => m[config.measure_col])).values();

        //Remove filters whose [ value_col ] does not appear in the data.
        var columns = d3.keys(this.raw_data[0]);
        this.controls.config.inputs = this.controls.config.inputs.filter(function (d) {
            return columns.indexOf(d.value_col) > -1;
        });
        this.table.config.cols = this.table.config.cols.filter(function (d) {
            return columns.indexOf(d) > -1;
        });

        //"All" variable for non-grouped comparisons
        this.raw_data.forEach(e => e[config.measure_col] = e[config.measure_col].trim());

        //Drop missing values
        this.raw_data = this.raw_data.filter(f => {
            return config.missingValues.indexOf(f[config.value_col]) === -1;
        });

        //Warning for non-numeric endpoints
        var catMeasures = allMeasures.filter(f => {
            var measureVals = this.raw_data.filter(d => d[config.measure_col] === f);

            return webcharts.dataOps.getValType(measureVals, config.value_col) !== "continuous";
        });
        if (catMeasures.length) {
            console.warn(catMeasures.length + " non-numeric endpoints have been removed: " + catMeasures.join(", "));
        }

        //Delete non-numeric endpoints
        var numMeasures = allMeasures.filter(f => {
            var measureVals = this.raw_data.filter(d => d[config.measure_col] === f);

            return webcharts.dataOps.getValType(measureVals, config.value_col) === "continuous";
        });

        this.raw_data = this.raw_data.filter(f => numMeasures.indexOf(f[config.measure_col]) > -1);

        //Choose the start value for the Test filter
        this.controls.config.inputs[0].start = this.config.start_value || numMeasures[0];
    };

    function onLayout() {
        //Add population count.
        d3.select('.wc-controls').append('div').attr('id', 'populationCount').style('font-style', 'italic');

        //Add footnote.
        this.wrap.insert('p', '.wc-chart').attr('class', 'annote').text('Click a bar for details.');

        //Add control to hide or display normal range(s).
        var normalRange = d3.select('.wc-controls').append('div').attr('id', 'NRcheckbox').style('margin', '.5em').append('input').attr('type', 'checkbox');
        var NRcheckbox = document.getElementById('NRcheckbox');
        NRcheckbox.innerHTML = NRcheckbox.innerHTML + 'Normal range';
        d3.select('#NRcheckbox input').on('change', function () {
            d3.selectAll('.normalRange').attr('visibility', d3.select(this).property('checked') ? 'visible' : 'hidden');
        });
    }

    function onPreprocess() {
        var chart = this;
        //Capture currently selected filters.
        var filterSettings = [];
        var filters = d3.selectAll('.wc-controls .changer').each(function (d) {
            filterSettings.push({ value_col: d.value_col,
                value: d3.select(this).selectAll('option').filter(function (d1) {
                    return d3.select(this).property('selected');
                }).property('value') });
        });
        //Filter data based on currently selected filters.
        var filtered_data = this.raw_data.filter(d => {
            var match = true;
            filterSettings.forEach(d1 => {
                if (match === true) match = d[d1.value_col] === d1.value || d1.value === 'All';
            });
            return match;
        });
        //Set x domain based on currently filtered data.
        this.config.x.domain = d3.extent(filtered_data, d => +d[chart.config.value_col]);
    }

    function onDataTransform() {
        const measure = this.filtered_data[0] ? this.filtered_data[0][this.config.measure_col] : this.raw_data[0][this.config.measure_col];
        const units = this.filtered_data[0] ? this.filtered_data[0][this.config.unit_col] : this.raw_data[0][this.config.unit_col];

        //Customize the x-axis label
        this.config.x.label = measure + " level (" + units + ")";

        //Reset linked table
        this.table.draw([]);
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
    function updateSubjectCount(chart, id_col, selector, id_unit) {
        //count the number of unique ids in the data set
        var totalObs = d3.set(chart.raw_data.map(function (d) {
            return d[id_col];
        })).values().length;

        //count the number of unique ids in the current chart and calculate the percentage
        var currentObs = d3.set(chart.filtered_data.map(function (d) {
            return d[id_col];
        })).values().length;
        var percentage = d3.format('0.1%')(currentObs / totalObs);

        //clear the annotation
        var annotation = d3.select(selector);
        d3.select(selector).selectAll("*").remove();

        //update the annotation
        var units = id_unit ? " " + id_unit : " participant(s)";
        annotation.text('\n' + currentObs + " of " + totalObs + units + " shown (" + percentage + ")");
    }

    function onDraw() {
        updateSubjectCount(this, this.config.id_col, '#populationCount');
    }

    function onResize() {
        const chart = this;
        const config = this.config;
        const measure = this.filtered_data[0] ? this.filtered_data[0][this.config.measure_col] : this.raw_data[0][this.config.measure_col];
        const units = this.filtered_data[0] ? this.filtered_data[0][this.config.unit_col] : this.raw_data[0][this.config.unit_col];

        var listing = this.table;

        //Display data listing on bin click.
        var cleanF = d3$1.format('.3f');
        var bins = this.svg.selectAll('.bar');
        var footnote = this.wrap.select('.annote');

        bins.style('cursor', 'pointer').on('click', function (d) {
            footnote.classed('tableTitle', true).text(`Table displays ${ d.values.raw.length } records with ${ measure } values from ${ cleanF(d.rangeLow) } to ${ cleanF(d.rangeHigh) } ${ units }. Click outside a bar to remove details.`);
            listing.draw(d.values.raw);
            d3.select('.listing table').style({ 'border-collapse': 'separate',
                'background': '#fff',
                'border-radius': '5px',
                'margin': '50px auto' });
            d3.select('.wc-chart thead').style('border-radius', '5px');
            d3.selectAll('.wc-chart thead th').style({ 'font-size': '16px',
                'font-weight': '400',
                'color': '#111',
                'text-align': 'left',
                'padding': '10px',
                'background': '#bdbdbd',
                'border-top': '1px solid #858d99',
                'border-bottom': '1px solid #858d99' });
            d3.selectAll('.wc-chart tbody tr td').style({ 'font-weight': '400',
                'color': '#5f6062',
                'font-size': '13px',
                'padding': '20px 20px 20px 20px',
                'border-bottom': '1px solid #e0e0e0' });
            d3.selectAll('tbody tr:nth-child(2n)').style('background', '#f0f3f5');
            bins.attr('fill-opacity', 0.5);
            d3$1.select(this).attr('fill-opacity', 1);
        }).on('mouseover', function (d) {
            if (footnote.classed('tableTitle') === false) {
                footnote.text(`${ d.values.raw.length } records with ${ measure } values from ${ cleanF(d.rangeLow) } to ${ cleanF(d.rangeHigh) } ${ units }.`);
            }
        }).on('mouseout', function (d) {
            if (footnote.classed('tableTitle') === false) {
                footnote.text('Click a bar for details.');
            }
        });

        //Visualize normal ranges.
        if (this.raw_data[0][chart.config.normal_col_low] && this.raw_data[0][chart.config.normal_col_high]) {
            //Capture distinct normal ranges in filtered data.
            var normalRanges = d3.nest().key(d => `${ d[chart.config.normal_col_low] },${ d[chart.config.normal_col_high] }`) // set key to comma-delimited normal range
            .rollup(d => d.length).entries(this.filtered_data);
            var currentRange = d3.extent(this.filtered_data, d => +d[chart.config.value_col]);
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
            //Determine whether normal range checkbox is checked.
            var displayNormalRange = d3.select('#NRcheckbox input').property('checked');
            //Add divs to chart for each normal range.
            var canvas = d3.select('.bar-supergroup');
            canvas.selectAll('.normalRange').remove();
            canvas.selectAll('.normalRange rect').data(normalRanges).enter().insert('rect', ':first-child').attr({ 'class': 'normalRange',
                'x': d => chart.x(Math.max(+d.key.split(',')[0], currentRange[0])) // set x to range low
                , 'y': 0,
                'width': d => Math.min(chart.plot_width - chart.x(Math.max(+d.key.split(',')[0], currentRange[0])), // chart width - range low

                chart.x(+d.key.split(',')[1]) - chart.x(Math.max(+d.key.split(',')[0], currentRange[0]))) // range high - range low

                , 'height': this.plot_height,
                'visibility': displayNormalRange ? 'visible' : 'hidden' }).style({ 'stroke': 'black',
                'fill': 'black',
                'stroke-opacity': d => d.values / chart.filtered_data.length * .75 // opacity as a function of fraction of records with the given normal range
                , 'fill-opacity': d => d.values / chart.filtered_data.length * .5 }) // opacity as a function of fraction of records with the given normal range
            .append('title').text(d => 'Normal range: ' + d.key.split(',')[0] + "-" + d.key.split(',')[1] + " " + units + ' (' + d3.format('%')(d.values / chart.filtered_data.length) + ' of records)');
        }

        d3.selectAll('.overlay, .normalRange').on('click', function () {
            listing.draw([]);
            bins.attr('fill-opacity', 0.75);

            if (footnote.classed('tableTitle')) {
                footnote.classed('tableTitle', false).text('Click a bar for details.');
            }
        });
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

    function safetyHistogram(element, settings) {
        //Merge user's settings with default settings.
        let mergedSettings = Object.assign({}, config, settings);

        //Keep settings in sync with the data mappings.
        mergedSettings = syncSettings(mergedSettings);

        //Keep control inputs in sync and create controls object.
        let syncedControlInputs = syncControlInputs(mergedSettings);
        let controls = webcharts.createControls(element, { location: 'top', inputs: syncedControlInputs });

        //Define chart
        let chart = webcharts.createChart(element, mergedSettings, controls);
        chart.on('init', onInit);
        chart.on('layout', onLayout);
        chart.on('preprocess', onPreprocess);
        chart.on('datatransform', onDataTransform);
        chart.on('draw', onDraw);
        chart.on('resize', onResize);

        let table = webcharts.createTable(element, mergedSettings.detail_cols && mergedSettings.detail_cols.length > 0 ? { cols: mergedSettings.detail_cols } : null).init([]);
        chart.table = table;

        return chart;
    }

    return safetyHistogram;
}(webCharts, d3);
