(function(global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined'
        ? (module.exports = factory(require('webcharts'), require('d3')))
        : typeof define === 'function' && define.amd
          ? define(['webcharts', 'd3'], factory)
          : (global.safetyHistogram = factory(global.webCharts, global.d3));
})(this, function(webcharts, d3$1) {
    'use strict';

    if (typeof Object.assign != 'function') {
        (function() {
            Object.assign = function(target) {
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
            column: null, // set in syncSettings()
            label: null, // set in syncSettings()
            type: 'linear',
            bin: 25,
            behavior: 'flex',
            format: '.1f'
        },
        y: {
            label: '# of Observations',
            type: 'linear',
            behavior: 'flex',
            column: '',
            domain: [0, null]
        },
        marks: [
            {
                per: [], // set in syncSettings()
                type: 'bar',
                summarizeY: 'count',
                summarizeX: 'mean',
                attributes: { 'fill-opacity': 0.75 }
            }
        ],
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
        if (settings.filters)
            settings.filters.forEach(function(filter) {
                return defaultDetails.push({
                    value_col: filter.value_col ? filter.value_col : filter,
                    label: filter.label
                        ? filter.label
                        : filter.value_col ? filter.value_col : filter
                });
            });
        defaultDetails.push({ value_col: settings.value_col, label: 'Result' });
        if (settings.normal_col_low)
            defaultDetails.push({
                value_col: settings.normal_col_low,
                label: 'Lower Limit of Normal'
            });
        if (settings.normal_col_high)
            defaultDetails.push({
                value_col: settings.normal_col_high,
                label: 'Upper Limit of Normal'
            });

        //If [settings.details] is not specified:
        if (!settings.details) settings.details = defaultDetails;
        else {
            //If [settings.details] is specified:
            //Allow user to specify an array of columns or an array of objects with a column property
            //and optionally a column label.
            settings.details.forEach(function(detail) {
                if (
                    defaultDetails
                        .map(function(d) {
                            return d.value_col;
                        })
                        .indexOf(detail.value_col ? detail.value_col : detail) === -1
                )
                    defaultDetails.push({
                        value_col: detail.value_col ? detail.value_col : detail,
                        label: detail.label
                            ? detail.label
                            : detail.value_col ? detail.value_col : detail
                    });
            });
            settings.details = defaultDetails;
        }

        return settings;
    }

    //Map values from settings to control inputs
    function syncControlInputs(settings) {
        var defaultControls = [
            {
                type: 'subsetter',
                label: 'Measure',
                value_col: settings.measure_col,
                start: settings.start_value
            },
            {
                type: 'checkbox',
                label: 'Normal Range',
                option: 'displayNormalRange'
            }
        ];

        if (settings.filters && settings.filters.length > 0) {
            var otherFilters = settings.filters.map(function(filter) {
                filter = {
                    type: 'subsetter',
                    value_col: filter.value_col ? filter.value_col : filter,
                    label: filter.label
                        ? filter.label
                        : filter.value_col ? filter.value_col : filter
                };
                return filter;
            });
            return defaultControls.concat(otherFilters);
        } else return defaultControls;
    }

    function onInit() {
        var _this = this;

        var config = this.config;

        this.super_raw_data = this.raw_data;
        //Remove filters whose [ value_col ] does not appear in the data.
        var columns = d3.keys(this.raw_data[0]);
        this.controls.config.inputs = this.controls.config.inputs.filter(function(d) {
            return columns.indexOf(d.value_col) > -1 || !!d.option;
        });

        //Remove whitespace from measure column values.
        this.raw_data.forEach(function(e) {
            return (e[config.measure_col] = e[config.measure_col].trim());
        });

        //Drop missing values.
        this.populationCount = d3$1
            .set(
                this.raw_data.map(function(d) {
                    return d[config.id_col];
                })
            )
            .values().length;
        this.raw_data = this.raw_data.filter(function(f) {
            return config.missingValues.indexOf(f[config.value_col]) === -1;
        });

        //Remove measures with any non-numeric results.
        var allMeasures = d3$1
                .set(
                    this.raw_data.map(function(m) {
                        return m[config.measure_col];
                    })
                )
                .values(),
            catMeasures = allMeasures.filter(function(measure) {
                var allObservations = _this.raw_data
                        .filter(function(d) {
                            return d[config.measure_col] === measure;
                        })
                        .map(function(d) {
                            return d[config.value_col];
                        }),
                    numericObservations = allObservations.filter(function(d) {
                        return /^-?[0-9.]+$/.test(d);
                    });

                return numericObservations.length < allObservations.length;
            }),
            conMeasures = allMeasures.filter(function(measure) {
                return catMeasures.indexOf(measure) === -1;
            });

        if (catMeasures.length)
            console.warn(
                catMeasures.length +
                    ' non-numeric endpoint' +
                    (catMeasures.length > 1 ? 's have' : ' has') +
                    ' been removed: ' +
                    catMeasures.join(', ')
            );

        this.raw_data = this.raw_data.filter(function(d) {
            return catMeasures.indexOf(d[config.measure_col]) === -1;
        });

        // Remove filters for variables with 0 or 1 levels
        var chart = this;

        this.controls.config.inputs = this.controls.config.inputs.filter(function(d) {
            if (d.type != 'subsetter') {
                return true;
            } else {
                var levels = d3
                    .set(
                        chart.raw_data.map(function(f) {
                            return f[d.value_col];
                        })
                    )
                    .values();
                if (levels.length < 2) {
                    console.warn(
                        d.value_col + ' filter not shown since the variable has less than 2 levels'
                    );
                }
                return levels.length >= 2;
            }
        });

        //Define initial measure.
        this.controls.config.inputs[0].start = this.config.start_value || conMeasures[0];
    }

    function updateXDomain(chart) {
        var xMinSelect = chart.controls.wrap
            .selectAll('.control-group')
            .filter(function(f) {
                return f.option === 'x.domain[0]';
            })
            .select('input');

        var xMaxSelect = chart.controls.wrap
            .selectAll('.control-group')
            .filter(function(f) {
                return f.option === 'x.domain[1]';
            })
            .select('input');

        //switch the values if min > max
        var range = [+xMinSelect.node().value, +xMaxSelect.node().value].sort(function(a, b) {
            return a - b;
        });

        // add some padding if min = max
        if (range[0] === range[1]) {
            range = [range[0] - range[0] * 0.05, range[1] + range[1] * 0.05];
            console.warn("Can't specify a 0 range, so some padding was added.");
        }

        //update the select values if needed
        xMinSelect.node().value = range[0];
        xMaxSelect.node().value = range[1];

        //apply custom domain to the chart
        chart.config.x.domain = range;
        chart.x_dom = range;

        //if the current range is the same as the full range, disable the reset reset button
    }

    function onLayout() {
        var chart = this,
            config = this.config;

        function updateLimits() {
            //update the domain and re-draw
            updateXDomain(chart);
            chart.draw();
        }

        /////////////////////////////////
        //Add controls for X-axis Limits
        /////////////////////////////////

        //x-domain reset button
        var resetContainer = this.controls.wrap
                .insert('div', '.control-group:nth-child(3)')
                .classed('control-group x-axis', true)
                .datum({
                    type: 'button',
                    option: 'x.domain',
                    label: 'x-axis:'
                }),
            resetLabel = resetContainer
                .append('span')
                .attr('class', 'control-label')
                .style('text-align', 'right')
                .text('X-axis:'),
            resetButton = resetContainer
                .append('button')
                .text('Reset Limits')
                .on('click', function() {
                    var measure_data = chart.super_raw_data.filter(function(d) {
                        return d[chart.config.measure_col] === chart.currentMeasure;
                    });
                    chart.config.x.domain = d3.extent(measure_data, function(d) {
                        return +d[config.value_col];
                    }); //reset axis to full range

                    chart.controls.wrap
                        .selectAll('.control-group')
                        .filter(function(f) {
                            return f.option === 'x.domain[0]';
                        })
                        .select('input')
                        .property('value', chart.config.x.domain[0]);

                    chart.controls.wrap
                        .selectAll('.control-group')
                        .filter(function(f) {
                            return f.option === 'x.domain[1]';
                        })
                        .select('input')
                        .property('value', chart.config.x.domain[1]);

                    chart.draw();
                });

        //x-domain lower limit
        var lowerLimitContainer = this.controls.wrap
                .insert('div', '.control-group:nth-child(4)')
                .classed('control-group x-axis', true)
                .datum({
                    type: 'number',
                    option: 'x.domain[0]',
                    label: 'Lower Limit'
                }),
            lowerLimitLabel = lowerLimitContainer
                .append('span')
                .attr('class', 'control-label')
                .style('text-align', 'right')
                .text('Lower Limit'),
            lowerLimitControl = lowerLimitContainer.append('input').on('change', updateLimits);

        //x-domain upper limit
        var upperLimitContainer = this.controls.wrap
                .insert('div', '.control-group:nth-child(5)')
                .classed('control-group x-axis', true)
                .datum({
                    type: 'number',
                    option: 'x.domain[1]',
                    label: 'Upper Limit'
                }),
            upperLimitLabel = upperLimitContainer
                .append('span')
                .attr('class', 'control-label')
                .style('text-align', 'right')
                .text('Upper Limit'),
            upperLimitControl = upperLimitContainer.append('input').on('change', updateLimits);

        //Add x-axis class to x-axis limit controls.
        this.controls.wrap
            .selectAll('.control-group')
            .filter(function(d) {
                return ['Lower Limit', 'Upper Limit'].indexOf(d.label) > -1;
            })
            .classed('x-axis', true);

        //Add population count container.
        this.controls.wrap
            .append('div')
            .attr('id', 'populationCount')
            .style('font-style', 'italic');

        //Add footnote.
        this.wrap
            .insert('p', '.wc-chart')
            .attr('class', 'annote')
            .text('Click a bar for details.');
    }

    function onPreprocess() {
        var _this = this;

        var chart = this,
            config = this.config;

        //Filter raw data on currently selected measure.
        var measure = this.filters.filter(function(filter) {
            return filter.col === _this.config.measure_col;
        })[0].val;
        this.measure_data = this.super_raw_data.filter(function(d) {
            return d[_this.config.measure_col] === measure;
        });

        //Set x-domain based on currently selected measure.
        //this.config.x.domain = d3.extent(this.measure_data, d => +d[chart.config.value_col]);

        //Check if the selected measure has changed.
        var prevMeasure = this.currentMeasure;
        this.currentMeasure = this.controls.wrap
            .selectAll('.control-group')
            .filter(function(d) {
                return d.value_col && d.value_col === config.measure_col;
            })
            .select('option:checked')
            .text();
        var changedMeasureFlag = this.currentMeasure !== prevMeasure;

        //Set x-axis domain.
        if (changedMeasureFlag) {
            //reset axis to full range when measure changes
            this.config.x.domain = d3.extent(this.measure_data, function(d) {
                return +d[config.value_col];
            });
            this.controls.wrap
                .selectAll('.x-axis')
                .property(
                    'title',
                    'Initial Limits: [' +
                        this.config.x.domain[0] +
                        ' - ' +
                        this.config.x.domain[1] +
                        ']'
                );

            //Set x-axis domain controls.
            this.controls.wrap
                .selectAll('.control-group')
                .filter(function(f) {
                    return f.option === 'x.domain[0]';
                })
                .select('input')
                .property('value', this.config.x.domain[0]);
            this.controls.wrap
                .selectAll('.control-group')
                .filter(function(f) {
                    return f.option === 'x.domain[1]';
                })
                .select('input')
                .property('value', this.config.x.domain[1]);
        }

        //Determine whether currently selected measure contains normal range data.
        if (this.config.normal_range) {
            var hasNormalRange =
                this.measure_data.filter(function(d) {
                    return (
                        (+d[chart.config.normal_col_low] || !!d[chart.config.normal_col_low]) &&
                        (+d[chart.config.normal_col_high] || !!d[chart.config.normal_col_high])
                    );
                }).length > 0;
            var normalRangeInput = this.controls.wrap
                .selectAll('.control-group')
                .filter(function(d) {
                    return d.label === 'Normal Range';
                })
                .select('input');

            if (!hasNormalRange)
                normalRangeInput
                    .attr('title', 'This measure does not contain normal range data.')
                    .style('cursor', 'not-allowed')
                    .property('checked', false)
                    .property('disabled', true);
            else
                normalRangeInput
                    .attr('title', '')
                    .style('cursor', 'pointer')
                    .property('checked', this.config.displayNormalRange)
                    .property('disabled', false);
        }

        //only draw the chart using data from the currently selected x-axis range
        updateXDomain(chart);
        this.raw_data = this.super_raw_data
            .filter(function(d) {
                return d[chart.config.measure_col] === chart.currentMeasure;
            })
            .filter(function(f) {
                var v = chart.config.value_col;
                return +f[v] >= +chart.x_dom[0] && +f[v] <= +chart.x_dom[1];
            });

        //disable the reset button if the full range is shown
        var raw_range = d3
            .extent(this.measure_data, function(d) {
                return +d[config.value_col];
            })
            .map(function(f) {
                return '' + f;
            });
        var full_range_covered =
            +chart.x_dom[0] == +raw_range[0] && +chart.x_dom[1] == +raw_range[1];
        chart.controls.wrap
            .selectAll('.control-group')
            .filter(function(f) {
                return f.option === 'x.domain';
            })
            .select('button')
            .property('disabled', full_range_covered);
    }

    function onDataTransform() {
        if (this.filtered_data.length)
            this.config.x.label =
                '' +
                this.filtered_data[0][this.config.measure_col] +
                (this.config.unit_col
                    ? ' (' + this.filtered_data[0][this.config.unit_col] + ')'
                    : '');
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
        var currentObs = d3
            .set(
                chart.filtered_data.map(function(d) {
                    return d[chart.config.id_col];
                })
            )
            .values().length;
        var percentage = d3.format('0.1%')(currentObs / chart.populationCount);

        //clear the annotation
        var annotation = d3.select(selector);
        d3
            .select(selector)
            .selectAll('*')
            .remove();

        //update the annotation
        var units = id_unit ? ' ' + id_unit : ' participant(s)';
        annotation.text(
            '\n' +
                currentObs +
                ' of ' +
                chart.populationCount +
                units +
                ' shown (' +
                percentage +
                ')'
        );
    }

    function onDraw() {
        updateSubjectCount(this, '#populationCount');

        //Update x-domain when all values are equal.
        if (this.config.x.type === 'linear' && this.x_dom[0] === this.x_dom[1])
            this.x_dom = [
                this.x_dom[0] - this.x_dom[0] * 0.05,
                this.x_dom[1] + this.x_dom[1] * 0.05
            ];

        //Reset listing.
        this.listing.draw([]);
        this.listing.wrap.selectAll('*').style('display', 'none');
        this.wrap
            .select('.annote')
            .classed('tableTitle', false)
            .text('Click a bar for details.');

        //Reset bar highlighting.
        delete this.highlightedBin;
        this.svg.selectAll('.bar').attr('opacity', 1);
    }

    function drawNormalRanges(chart) {
        //Clear normal ranges.
        var canvas = chart.wrap.select('.bar-supergroup');
        canvas.selectAll('.normalRange').remove();

        //Capture distinct normal ranges in filtered data.
        var normalRanges = d3
            .nest()
            .key(function(d) {
                return d[chart.config.normal_col_low] + ',' + d[chart.config.normal_col_high];
            }) // set key to comma-delimited normal range
            .rollup(function(d) {
                return d.length;
            })
            .entries(chart.filtered_data);
        var currentRange = d3.extent(chart.filtered_data, function(d) {
            return +d[chart.config.value_col];
        });
        //Sort normal ranges so larger normal ranges plot beneath smaller normal ranges.
        normalRanges.sort(function(a, b) {
            var a_lo = a.key.split(',')[0];
            var a_hi = a.key.split(',')[1];
            var b_lo = b.key.split(',')[0];
            var b_hi = b.key.split(',')[1];
            return a_lo <= b_lo && a_hi >= b_hi
                ? 2 // lesser minimum and greater maximum
                : a_lo >= b_lo && a_hi <= b_hi
                  ? -2 // greater minimum and lesser maximum
                  : a_lo <= b_lo && a_hi <= b_hi
                    ? 1 // lesser minimum and lesser maximum
                    : a_lo >= b_lo && a_hi >= b_hi
                      ? -1 // greater minimum and greater maximum
                      : 1;
        });
        //Add divs to chart for each normal range.
        canvas
            .selectAll('.normalRange rect')
            .data(normalRanges)
            .enter()
            .insert('rect', ':first-child')
            .attr({
                class: 'normalRange',
                x: function x(d) {
                    return chart.x(Math.max(+d.key.split(',')[0], currentRange[0]));
                }, // set x to range low
                y: 0,
                width: function width(d) {
                    return Math.min(
                        chart.plot_width - chart.x(Math.max(+d.key.split(',')[0], currentRange[0])), // chart width - range low

                        chart.x(+d.key.split(',')[1]) -
                            chart.x(Math.max(+d.key.split(',')[0], currentRange[0]))
                    );
                }, // range high - range low

                height: chart.plot_height
            })
            .style({
                stroke: 'black',
                fill: 'black',
                'stroke-opacity': function strokeOpacity(d) {
                    return d.values / chart.filtered_data.length * 0.75;
                }, // opacity as a function of fraction of records with the given normal range
                'fill-opacity': function fillOpacity(d) {
                    return d.values / chart.filtered_data.length * 0.5;
                }
            }) // opacity as a function of fraction of records with the given normal range
            .append('title')
            .text(function(d) {
                return (
                    'Normal range: ' +
                    d.key.split(',')[0] +
                    '-' +
                    d.key.split(',')[1] +
                    (chart.config.unit_col
                        ? '' + chart.filtered_data[0][chart.config.unit_col]
                        : '') +
                    (' (' + d3.format('%')(d.values / chart.filtered_data.length) + ' of records)')
                );
            });
    }

    function onResize() {
        var _this = this;

        var chart = this,
            config = this.config;

        //Draw custom bin for single observation subsets.
        this.svg.select('#custom-bin').remove();
        if (this.current_data.length === 1) {
            var datum = this.current_data[0];
            this.svg
                .append('g')
                .classed('bar-group', true)
                .attr('id', 'custom-bin')
                .append('rect')
                .data([datum])
                .classed('wc-data-mark bar', true)
                .attr({
                    y: 0,
                    height: this.plot_height,
                    'shape-rendering': 'crispEdges',
                    stroke: 'rgb(102,194,165)',
                    fill: 'rgb(102,194,165)',
                    'fill-opacity': '0.75',
                    width: this.x(datum.values.x * 1.01) - this.x(datum.values.x * 0.99),
                    x: this.x(datum.values.x * 0.99)
                });
        }

        //Display data listing on bin click.
        var cleanF = d3$1.format('.3f');
        var bins = this.svg.selectAll('.bar');
        var footnote = this.wrap.select('.annote');

        bins
            .style('cursor', 'pointer')
            .on('click', function(d) {
                chart.highlightedBin = d.key;
                //Update footnote.
                footnote
                    .classed('tableTitle', true)
                    .text(
                        'Table displays ' +
                            d.values.raw.length +
                            ' records with ' +
                            (chart.filtered_data[0][config.measure_col] + ' values from ') +
                            (cleanF(d.rangeLow) + ' to ' + cleanF(d.rangeHigh)) +
                            (config.unit_col ? ' ' + chart.filtered_data[0][config.unit_col] : '') +
                            '. Click outside a bar to remove details.'
                    );

                //Draw listing.
                chart.listing.draw(d.values.raw);
                chart.listing.wrap.selectAll('*').style('display', null);

                //Reduce bin opacity and highlight selected bin.
                bins.attr('fill-opacity', 0.5);
                d3$1.select(this).attr('fill-opacity', 1);
            })
            .on('mouseover', function(d) {
                //Update footnote.
                if (footnote.classed('tableTitle') === false)
                    footnote.text(
                        d.values.raw.length +
                            ' records with ' +
                            (chart.filtered_data[0][config.measure_col] + ' values from ') +
                            (cleanF(d.rangeLow) + ' to ' + cleanF(d.rangeHigh)) +
                            (config.unit_col ? ' ' + chart.filtered_data[0][config.unit_col] : '')
                    );
            })
            .on('mouseout', function(d) {
                //Update footnote.
                if (footnote.classed('tableTitle') === false)
                    footnote.text('Click a bar for details.');
            });

        //Visualize normal ranges.
        var normalRangeControl = this.controls.wrap.selectAll('.control-group').filter(function(d) {
            return d.label === 'Normal Range';
        });
        if (config.normal_range) {
            if (chart.config.displayNormalRange) drawNormalRanges(chart);
            else chart.wrap.selectAll('.normalRange').remove();

            normalRangeControl.on('change', function() {
                chart.config.displayNormalRange = d3
                    .select(this)
                    .select('input')
                    .property('checked');

                if (chart.config.displayNormalRange) drawNormalRanges(chart);
                else chart.wrap.selectAll('.normalRange').remove();
            });
        } else normalRangeControl.style('display', 'none');

        //Clear listing when clicking outside bins.
        this.wrap.selectAll('.overlay, .normalRange').on('click', function() {
            delete chart.highlightedBin;
            chart.listing.draw([]);
            chart.listing.wrap.selectAll('*').style('display', 'none');
            bins.attr('fill-opacity', 0.75);

            if (footnote.classed('tableTitle'))
                footnote.classed('tableTitle', false).text('Click a bar for details.');
        });

        //Keep highlighted bin highlighted on resize.
        if (this.highlightedBin)
            bins.attr('fill-opacity', function(d) {
                return d.key !== _this.highlightedBin ? 0.5 : 1;
            });
    }

    function safetyHistogram(element, settings) {
        var mergedSettings = Object.assign({}, defaultSettings, settings),
            syncedSettings = syncSettings(mergedSettings),
            syncedControlInputs = syncControlInputs(syncedSettings),
            controls = webcharts.createControls(element, {
                location: 'top',
                inputs: syncedControlInputs
            }),
            chart = webcharts.createChart(element, syncedSettings, controls),
            listingSettings = {
                cols: syncedSettings.details.map(function(detail) {
                    return detail.value_col;
                }),
                headers: syncedSettings.details.map(function(detail) {
                    return detail.label;
                }),
                searchable: syncedSettings.searchable,
                sortable: syncedSettings.sortable,
                pagination: syncedSettings.pagination,
                exportable: syncedSettings.exportable
            };

        chart.listing = webcharts.createTable(element, listingSettings);
        chart.listing.init([]);
        chart.listing.wrap.selectAll('*').style('display', 'none');

        //Define callbacks.
        chart.on('init', onInit);
        chart.on('layout', onLayout);
        chart.on('preprocess', onPreprocess);
        chart.on('datatransform', onDataTransform);
        chart.on('draw', onDraw);
        chart.on('resize', onResize);

        return chart;
    }

    return safetyHistogram;
});
