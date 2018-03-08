(function(global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined'
        ? (module.exports = factory(require('webcharts'), require('d3')))
        : typeof define === 'function' && define.amd
          ? define(['webcharts', 'd3'], factory)
          : (global.safetyOutlierExplorer = factory(global.webCharts, global.d3));
})(this, function(webcharts, d3) {
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

    if (!Array.prototype.find) {
        Object.defineProperty(Array.prototype, 'find', {
            value: function value(predicate) {
                // 1. Let O be ? ToObject(this value).
                if (this == null) {
                    throw new TypeError('"this" is null or not defined');
                }

                var o = Object(this);

                // 2. Let len be ? ToLength(? Get(O, "length")).
                var len = o.length >>> 0;

                // 3. If IsCallable(predicate) is false, throw a TypeError exception.
                if (typeof predicate !== 'function') {
                    throw new TypeError('predicate must be a function');
                }

                // 4. If thisArg was supplied, let T be thisArg; else let T be undefined.
                var thisArg = arguments[1];

                // 5. Let k be 0.
                var k = 0;

                // 6. Repeat, while k < len
                while (k < len) {
                    // a. Let Pk be ! ToString(k).
                    // b. Let kValue be ? Get(O, Pk).
                    // c. Let testResult be ToBoolean(? Call(predicate, T, � kValue, k, O �)).
                    // d. If testResult is true, return kValue.
                    var kValue = o[k];
                    if (predicate.call(thisArg, kValue, k, o)) {
                        return kValue;
                    }
                    // e. Increase k by 1.
                    k++;
                }

                // 7. Return undefined.
                return undefined;
            }
        });
    }

    var rendererSpecificSettings = {
        id_col: 'USUBJID',
        time_cols: [
            {
                type: 'ordinal',
                value_col: 'VISIT',
                label: 'Visit',
                order_col: 'VISITNUM',
                order: null,
                rotate_tick_labels: true,
                vertical_space: 100
            },
            {
                type: 'linear',
                value_col: 'DY',
                label: 'Study Day',
                rotate_tick_labels: false,
                vertical_space: 0
            }
        ],
        measure_col: 'TEST',
        unit_col: 'STRESU',
        value_col: 'STRESN',
        normal_col_low: 'STNRLO',
        normal_col_high: 'STNRHI',
        start_value: null,
        filters: null,
        custom_marks: null,
        details: [
            { value_col: 'AGE', label: 'Age' },
            { value_col: 'SEX', label: 'Sex' },
            { value_col: 'RACE', label: 'Race' }
        ],
        multiples_sizing: {
            width: 300,
            height: 100
        },
        visits_without_data: false,
        unscheduled_visits: false,
        unscheduled_visit_pattern: '/unscheduled|early termination/i',
        unscheduled_visit_values: null // takes precedence over unscheduled_visit_pattern
    };

    var webchartsSettings = {
        x: {
            column: null, //set in syncSettings()
            type: null, //set in syncSettings()
            behavior: 'raw'
        },
        y: {
            column: null, //set in syncSettings()
            stat: 'mean',
            type: 'linear',
            label: 'Value',
            behavior: 'raw',
            format: '0.2f'
        },
        marks: [
            {
                per: null, //set in syncSettings()
                type: 'line',
                attributes: {
                    'stroke-width': 0.5,
                    'stroke-opacity': 0.5,
                    stroke: '#999',
                    'clip-path': 'url(#1)'
                },
                tooltip: null //set in syncSettings()
            },
            {
                per: null, //set in syncSettings()
                type: 'circle',
                radius: 2,
                attributes: {
                    'stroke-width': 0.5,
                    'stroke-opacity': 0.5,
                    'fill-opacity': 1,
                    'clip-path': 'url(#1)'
                },
                tooltip: null //set in syncSettings()
            }
        ],
        resizable: true,
        margin: { right: 20 }, //create space for box plot
        aspect: 3
    };

    var defaultSettings = Object.assign({}, rendererSpecificSettings, webchartsSettings);

    // Replicate settings in multiple places in the settings object
    function syncSettings(settings) {
        var time_col = settings.time_cols[0];

        settings.x.column = time_col.value_col;
        settings.x.type = time_col.type;
        settings.x.label = time_col.label;
        settings.x.order = time_col.order;

        settings.y.column = settings.value_col;

        settings.marks[0].per = [settings.id_col, settings.measure_col];
        settings.marks[0].tooltip = '[' + settings.id_col + ']';

        settings.marks[1].per = [
            settings.id_col,
            settings.measure_col,
            time_col.value_col,
            settings.value_col
        ];
        settings.marks[1].tooltip =
            '[' +
            settings.id_col +
            ']:  [' +
            settings.value_col +
            '] [' +
            settings.unit_col +
            '] at ' +
            settings.x.column +
            ' = [' +
            settings.x.column +
            ']';

        //Add custom marks to settings.marks.
        if (settings.custom_marks)
            settings.custom_marks.forEach(function(mark) {
                return settings.marks.push(mark);
            });

        //Define margins for box plot and rotated x-axis tick labels.
        if (settings.margin) settings.margin.bottom = time_col.vertical_space;
        else
            settings.margin = {
                right: 20,
                bottom: time_col.vertical_space
            };

        settings.rotate_x_tick_labels = time_col.rotate_tick_labels;

        //Convert unscheduled_visit_pattern from string to regular expression.
        if (
            typeof settings.unscheduled_visit_pattern === 'string' &&
            settings.unscheduled_visit_pattern !== ''
        ) {
            var flags = settings.unscheduled_visit_pattern.replace(/.*?\/([gimy]*)$/, '$1'),
                pattern = settings.unscheduled_visit_pattern.replace(
                    new RegExp('^/(.*?)/' + flags + '$'),
                    '$1'
                );
            settings.unscheduled_visit_regex = new RegExp(pattern, flags);
        }

        return settings;
    }

    // Default Control objects
    var controlInputs = [
        { label: 'Measure', type: 'subsetter', start: null },
        { type: 'dropdown', label: 'X-axis', option: 'x.column', require: true },
        { type: 'number', label: 'Lower Limit', option: 'y.domain[0]', require: true },
        { type: 'number', label: 'Upper Limit', option: 'y.domain[1]', require: true },
        {
            type: 'checkbox',
            inline: true,
            option: 'visits_without_data',
            label: 'Visits without data'
        },
        {
            type: 'checkbox',
            inline: true,
            option: 'unscheduled_visits',
            label: 'Unscheduled visits'
        }
    ];

    // Map values from settings to control inputs
    function syncControlInputs(controlInputs, settings) {
        var labTestControl = controlInputs.find(function(d) {
            return d.label === 'Measure';
        });
        labTestControl.value_col = settings.measure_col;

        var xAxisControl = controlInputs.find(function(d) {
            return d.label === 'X-axis';
        });
        xAxisControl.values = settings.time_cols.map(function(d) {
            return d.value_col;
        });

        if (settings.filters) {
            settings.filters.forEach(function(d, i) {
                var thisFilter = {
                    type: 'subsetter',
                    value_col: d.value_col ? d.value_col : d,
                    label: d.label ? d.label : d.value_col ? d.value_col : d
                };
                //add the filter to the control inputs (as long as it isn't already there)
                var current_value_cols = controlInputs
                    .filter(function(f) {
                        return f.type == 'subsetter';
                    })
                    .map(function(m) {
                        return m.value_col;
                    });
                if (current_value_cols.indexOf(thisFilter.value_col) == -1)
                    controlInputs.splice(4 + i, 0, thisFilter);
            });
        }

        //Remove unscheduled visit control if unscheduled visit pattern is unscpecified.
        if (!settings.unscheduled_visit_regex)
            controlInputs.splice(
                controlInputs
                    .map(function(controlInput) {
                        return controlInput.label;
                    })
                    .indexOf('Unscheduled visits'),
                1
            );

        return controlInputs;
    }

    function countParticipants() {
        var _this = this;

        this.populationCount = d3
            .set(
                this.raw_data.map(function(d) {
                    return d[_this.config.id_col];
                })
            )
            .values().length;
    }

    function cleanData() {
        var _this = this;

        //Remove missing and non-numeric data.
        var preclean = this.raw_data,
            clean = this.raw_data.filter(function(d) {
                return /^-?[0-9.]+$/.test(d[_this.config.value_col]);
            }),
            nPreclean = preclean.length,
            nClean = clean.length,
            nRemoved = nPreclean - nClean;

        //Warn user of removed records.
        if (nRemoved > 0)
            console.warn(
                nRemoved +
                    ' missing or non-numeric result' +
                    (nRemoved > 1 ? 's have' : ' has') +
                    ' been removed.'
            );
        this.initial_data = clean;
        this.raw_data = clean;

        //Attach array of continuous measures to chart object.
        this.measures = d3
            .set(
                this.raw_data.map(function(d) {
                    return d[_this.config.measure_col];
                })
            )
            .values()
            .sort();
    }

    function addVariables() {
        var _this = this;

        var ordinalTimeSettings = this.config.time_cols.find(function(time_col) {
            return time_col.type === 'ordinal';
        });

        this.raw_data.forEach(function(d) {
            //Identify unscheduled visits.
            d.unscheduled = false;
            if (ordinalTimeSettings) {
                if (_this.config.unscheduled_visit_values)
                    d.unscheduled =
                        _this.config.unscheduled_visit_values.indexOf(
                            d[ordinalTimeSettings.value_col]
                        ) > -1;
                else if (_this.config.unscheduled_visit_regex)
                    d.unscheduled = _this.config.unscheduled_visit_regex.test(
                        d[ordinalTimeSettings.value_col]
                    );
            }
        });
    }

    function defineVisitOrder() {
        var _this = this;

        //ordinal
        this.config.time_cols
            .filter(function(time_col) {
                return time_col.type === 'ordinal';
            })
            .forEach(function(time_settings) {
                var visits = void 0,
                    visitOrder = void 0;

                //Given an ordering variable sort a unique set of visits by the ordering variable.
                if (
                    time_settings.order_col &&
                    _this.raw_data[0].hasOwnProperty(time_settings.order_col)
                ) {
                    //Define a unique set of visits with visit order concatenated.
                    visits = d3
                        .set(
                            _this.raw_data.map(function(d) {
                                return (
                                    d[time_settings.order_col] + '|' + d[time_settings.value_col]
                                );
                            })
                        )
                        .values();

                    //Sort visits.
                    visitOrder = visits
                        .sort(function(a, b) {
                            var aOrder = a.split('|')[0],
                                bOrder = b.split('|')[0],
                                diff = +aOrder - +bOrder;
                            return diff ? diff : d3.ascending(a, b);
                        })
                        .map(function(visit) {
                            return visit.split('|')[1];
                        });
                } else {
                    //Otherwise sort a unique set of visits alphanumerically.
                    //Define a unique set of visits.
                    visits = d3
                        .set(
                            _this.raw_data.map(function(d) {
                                return d[time_settings.value_col];
                            })
                        )
                        .values();

                    //Sort visits;
                    visitOrder = visits.sort();
                }

                //Set x-axis domain.
                if (time_settings.order) {
                    //If a visit order is specified, use it and concatenate any unspecified visits at the end.
                    time_settings.order = time_settings.order.concat(
                        visitOrder.filter(function(visit) {
                            return time_settings.order.indexOf(visit) < 0;
                        })
                    );
                } else
                    //Otherwise use data-driven visit order.
                    time_settings.order = visitOrder;

                //Define domain.
                time_settings.domain = time_settings.order;
            });
    }

    function checkFilters() {
        var _this = this;

        this.controls.config.inputs = this.controls.config.inputs.filter(function(input) {
            if (input.type != 'subsetter') {
                return true;
            } else if (!_this.raw_data[0].hasOwnProperty(input.value_col)) {
                console.warn(
                    'The [ ' +
                        input.label +
                        ' ] filter has been removed because the variable does not exist.'
                );
            } else {
                var levels = d3
                    .set(
                        _this.raw_data.map(function(d) {
                            return d[input.value_col];
                        })
                    )
                    .values();

                if (levels.length === 1)
                    console.warn(
                        'The [ ' +
                            input.label +
                            ' ] filter has been removed because the variable has only one level.'
                    );

                return levels.length > 1;
            }
        });
    }

    function setInitialMeasure() {
        this.controls.config.inputs.find(function(input) {
            return input.label === 'Measure';
        }).start =
            this.config.start_value || this.measures[0];
    }

    function onInit() {
        // 1. Count total participants prior to data cleaning.
        countParticipants.call(this);

        // 2. Drop missing values and remove measures with any non-numeric results.
        cleanData.call(this);

        // 3a Define additional variables.
        addVariables.call(this);

        // 3b Define ordered x-axis domain with visit order variable.
        defineVisitOrder.call(this);

        // 3c Remove filters for nonexistent or single-level variables.
        checkFilters.call(this);

        // 3d Choose the start value for the Test filter
        setInitialMeasure.call(this);
    }

    function identifyControls() {
        this.controls.wrap.selectAll('.control-group').attr('id', function(d) {
            return d.label.toLowerCase().replace(' ', '-');
        });
    }

    function labelXaxisOptions() {
        var _this = this;

        this.controls.wrap
            .selectAll('.control-group')
            .filter(function(d) {
                return d.option === 'x.column';
            })
            .selectAll('option')
            .property('label', function(d) {
                return _this.config.time_cols.find(function(time_col) {
                    return time_col.value_col === d;
                }).label;
            });
    }

    function addYdomainResetButton() {
        var context = this,
            resetContainer = this.controls.wrap
                .insert('div', '#lower-limit')
                .classed('control-group y-axis', true)
                .datum({
                    type: 'button',
                    option: 'y.domain',
                    label: 'Y-axis:'
                }),
            resetLabel = resetContainer
                .append('span')
                .attr('class', 'control-label')
                .style('text-align', 'right')
                .text('Y-axis:'),
            resetButton = resetContainer
                .append('button')
                .text('Reset Limits')
                .on('click', function() {
                    var measure_data = context.raw_data.filter(function(d) {
                        return d[context.config.measure_col] === context.currentMeasure;
                    });
                    context.config.y.domain = d3.extent(measure_data, function(d) {
                        return +d[context.config.value_col];
                    }); //reset axis to full range

                    context.controls.wrap
                        .selectAll('.control-group')
                        .filter(function(f) {
                            return f.option === 'y.domain[0]';
                        })
                        .select('input')
                        .property('value', context.config.y.domain[0]);

                    context.controls.wrap
                        .selectAll('.control-group')
                        .filter(function(f) {
                            return f.option === 'y.domain[1]';
                        })
                        .select('input')
                        .property('value', context.config.y.domain[1]);

                    context.draw();
                });
    }

    function classYdomainControls() {
        this.controls.wrap
            .selectAll('.control-group')
            .filter(function(d) {
                return ['Lower Limit', 'Upper Limit'].indexOf(d.label) > -1;
            })
            .classed('y-axis', true);
    }

    function addParticipantCountContainer() {
        this.controls.wrap
            .append('div')
            .attr('id', 'participant-count')
            .style('font-style', 'italic');
    }

    function addSmallMultiplesContainer() {
        this.wrap.append('div').attr('class', 'multiples');
    }

    function onLayout() {
        // Distinguish controls to insert y-axis reset button in the correct position.
        identifyControls.call(this);

        //Label x-axis options.
        labelXaxisOptions.call(this);

        //Add a button to reset the y-domain
        addYdomainResetButton.call(this);

        //Add .y-axis class to y-domain controls.
        classYdomainControls.call(this);

        //Add participant count container.
        addParticipantCountContainer.call(this);

        //Add container for small multiples.
        addSmallMultiplesContainer.call(this);
    }

    function getCurrentMeasure() {
        var _this = this;

        this.previousMeasure = this.currentMeasure;
        this.currentMeasure = this.controls.wrap
            .selectAll('.control-group')
            .filter(function(d) {
                return d.value_col && d.value_col === _this.config.measure_col;
            })
            .select('option:checked')
            .text();
    }

    function defineMeasureData() {
        var _this = this;

        this.measure_data = this.initial_data.filter(function(d) {
            return d[_this.config.measure_col] === _this.currentMeasure;
        });
        this.raw_data = this.measure_data.filter(function(d) {
            return _this.config.unscheduled_visits || !d.unscheduled;
        });
    }

    function removeVisitsWithoutData() {
        var _this = this;

        if (!this.config.visits_without_data)
            this.config.x.domain = this.config.x.domain.filter(function(visit) {
                return (
                    d3
                        .set(
                            _this.raw_data.map(function(d) {
                                return d[_this.config.time_settings.value_col];
                            })
                        )
                        .values()
                        .indexOf(visit) > -1
                );
            });
    }

    function removeUnscheduledVisits() {
        var _this = this;

        if (!this.config.unscheduled_visits) {
            if (this.config.unscheduled_visit_values)
                this.config.x.domain = this.config.x.domain.filter(function(visit) {
                    return _this.config.unscheduled_visit_values.indexOf(visit) < 0;
                });
            else if (this.config.unscheduled_visit_regex)
                this.config.x.domain = this.config.x.domain.filter(function(visit) {
                    return !_this.config.unscheduled_visit_regex.test(visit);
                });
        }
    }

    function setXdomain() {
        var _this = this;

        this.config.time_settings = this.config.time_cols.find(function(time_col) {
            return time_col.value_col === _this.config.x.column;
        });
        Object.assign(this.config.x, this.config.time_settings);
        if (this.config.x.type === 'linear') delete this.config.x.domain;

        //Remove unscheduled visits from x-domain if x-type is ordinal.
        if (this.config.x.type === 'ordinal') {
            removeVisitsWithoutData.call(this);
            removeUnscheduledVisits.call(this);
        }
    }

    function setYdomain() {
        var _this = this;

        //Define y-domain.
        if (this.currentMeasure !== this.previousMeasure)
            this.config.y.domain = d3.extent(
                this.measure_data.map(function(d) {
                    return +d[_this.config.y.column];
                })
            );
        else if (this.config.y.domain[0] > this.config.y.domain[1])
            // new measure
            this.config.y.domain.reverse();
        else if (this.config.y.domain[0] === this.config.y.domain[1])
            // invalid domain
            this.config.y.domain = this.config.y.domain.map(function(d, i) {
                return i === 0 ? d - d * 0.01 : d + d * 0.01;
            }); // domain with zero range
    }

    function updateYaxisLimitControls() {
        //Update y-axis limit controls.
        this.controls.wrap
            .selectAll('.control-group')
            .filter(function(f) {
                return f.option === 'y.domain[0]';
            })
            .select('input')
            .property('value', this.config.y.domain[0]);
        this.controls.wrap
            .selectAll('.control-group')
            .filter(function(f) {
                return f.option === 'y.domain[1]';
            })
            .select('input')
            .property('value', this.config.y.domain[1]);
    }

    function setYaxisLabel() {
        this.config.y.label =
            this.currentMeasure +
            (this.config.unit_col && this.measure_data[0][this.config.unit_col]
                ? ' (' + this.measure_data[0][this.config.unit_col] + ')'
                : '');
    }

    function updateYaxisResetButton() {
        //Update tooltip of y-axis domain reset button.
        if (this.currentMeasure !== this.previousMeasure)
            this.controls.wrap
                .selectAll('.y-axis')
                .property(
                    'title',
                    'Initial Limits: [' +
                        this.config.y.domain[0] +
                        ' - ' +
                        this.config.y.domain[1] +
                        ']'
                );
    }

    function onPreprocess() {
        // 1. Capture currently selected measure.
        getCurrentMeasure.call(this);

        // 2. Filter data on currently selected measure.
        defineMeasureData.call(this);

        // 3a Set x-domain given current visit settings.
        setXdomain.call(this);

        // 3b Set y-domain given currently selected measure.
        setYdomain.call(this);

        // 3c Set y-axis label to current measure.
        setYaxisLabel.call(this);

        // 4a Update y-axis reset button when measure changes.
        updateYaxisResetButton.call(this);

        // 4b Update y-axis limit controls to match y-axis domain.
        updateYaxisLimitControls.call(this);
    }

    function onDatatransform() {}

    // Takes a webcharts object creates a text annotation giving the
    // number and percentage of observations shown in the current view
    //
    // inputs:
    // - chart - a webcharts chart object
    // - selector - css selector for the annotation
    // - id_unit - a text string to label the units in the annotation (default = "participants")
    function updateParticipantCount(chart, selector, id_unit) {
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

    function clearSmallMultiples() {
        this.wrap
            .select('.multiples')
            .select('.wc-small-multiples')
            .remove();
    }

    function onDraw() {
        //Annotate participant count.
        updateParticipantCount(this, '#participant-count');

        //Clear current multiples.
        clearSmallMultiples.call(this);
    }

    function addBoxPlot(
        svg$$1,
        results,
        height,
        width,
        domain,
        boxPlotWidth,
        boxColor,
        boxInsideColor,
        fmt,
        horizontal
    ) {
        //set default orientation to "horizontal"
        var horizontal = horizontal == undefined ? true : horizontal;

        //make the results numeric and sort
        var results = results
            .map(function(d) {
                return +d;
            })
            .sort(d3.ascending);

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

        var boxplot = svg$$1
            .append('g')
            .attr('class', 'boxplot')
            .datum({ values: results, probs: probs });

        //set bar width variable
        var box_x = horizontal ? x(0.5 - boxPlotWidth / 2) : x(probs[1]);
        var box_width = horizontal
            ? x(0.5 + boxPlotWidth / 2) - x(0.5 - boxPlotWidth / 2)
            : x(probs[3]) - x(probs[1]);
        var box_y = horizontal ? y(probs[3]) : y(0.5 + boxPlotWidth / 2);
        var box_height = horizontal
            ? -y(probs[3]) + y(probs[1])
            : y(0.5 - boxPlotWidth / 2) - y(0.5 + boxPlotWidth / 2);

        boxplot
            .append('rect')
            .attr('class', 'boxplot fill')
            .attr('x', box_x)
            .attr('width', box_width)
            .attr('y', box_y)
            .attr('height', box_height)
            .style('fill', boxColor);

        //draw dividing lines at median, 95% and 5%
        var iS = [0, 2, 4];
        var iSclass = ['', 'median', ''];
        var iSColor = [boxColor, boxInsideColor, boxColor];
        for (var i = 0; i < iS.length; i++) {
            boxplot
                .append('line')
                .attr('class', 'boxplot ' + iSclass[i])
                .attr('x1', horizontal ? x(0.5 - boxPlotWidth / 2) : x(probs[iS[i]]))
                .attr('x2', horizontal ? x(0.5 + boxPlotWidth / 2) : x(probs[iS[i]]))
                .attr('y1', horizontal ? y(probs[iS[i]]) : y(0.5 - boxPlotWidth / 2))
                .attr('y2', horizontal ? y(probs[iS[i]]) : y(0.5 + boxPlotWidth / 2))
                .style('fill', iSColor[i])
                .style('stroke', iSColor[i]);
        }

        //draw lines from 5% to 25% and from 75% to 95%
        var iS = [[0, 1], [3, 4]];
        for (var i = 0; i < iS.length; i++) {
            boxplot
                .append('line')
                .attr('class', 'boxplot')
                .attr('x1', horizontal ? x(0.5) : x(probs[iS[i][0]]))
                .attr('x2', horizontal ? x(0.5) : x(probs[iS[i][1]]))
                .attr('y1', horizontal ? y(probs[iS[i][0]]) : y(0.5))
                .attr('y2', horizontal ? y(probs[iS[i][1]]) : y(0.5))
                .style('stroke', boxColor);
        }

        boxplot
            .append('circle')
            .attr('class', 'boxplot mean')
            .attr('cx', horizontal ? x(0.5) : x(d3.mean(results)))
            .attr('cy', horizontal ? y(d3.mean(results)) : y(0.5))
            .attr('r', horizontal ? x(boxPlotWidth / 3) : y(1 - boxPlotWidth / 3))
            .style('fill', boxInsideColor)
            .style('stroke', boxColor);

        boxplot
            .append('circle')
            .attr('class', 'boxplot mean')
            .attr('cx', horizontal ? x(0.5) : x(d3.mean(results)))
            .attr('cy', horizontal ? y(d3.mean(results)) : y(0.5))
            .attr('r', horizontal ? x(boxPlotWidth / 6) : y(1 - boxPlotWidth / 6))
            .style('fill', boxColor)
            .style('stroke', 'None');

        var formatx = fmt ? d3.format(fmt) : d3.format('.2f');

        boxplot
            .selectAll('.boxplot')
            .append('title')
            .text(function(d) {
                return (
                    'N = ' +
                    d.values.length +
                    '\n' +
                    'Min = ' +
                    d3.min(d.values) +
                    '\n' +
                    '5th % = ' +
                    formatx(d3.quantile(d.values, 0.05)) +
                    '\n' +
                    'Q1 = ' +
                    formatx(d3.quantile(d.values, 0.25)) +
                    '\n' +
                    'Median = ' +
                    formatx(d3.median(d.values)) +
                    '\n' +
                    'Q3 = ' +
                    formatx(d3.quantile(d.values, 0.75)) +
                    '\n' +
                    '95th % = ' +
                    formatx(d3.quantile(d.values, 0.95)) +
                    '\n' +
                    'Max = ' +
                    d3.max(d.values) +
                    '\n' +
                    'Mean = ' +
                    formatx(d3.mean(d.values)) +
                    '\n' +
                    'StDev = ' +
                    formatx(d3.deviation(d.values))
                );
            });
    }

    var _typeof =
        typeof Symbol === 'function' && typeof Symbol.iterator === 'symbol'
            ? function(obj) {
                  return typeof obj;
              }
            : function(obj) {
                  return obj &&
                      typeof Symbol === 'function' &&
                      obj.constructor === Symbol &&
                      obj !== Symbol.prototype
                      ? 'symbol'
                      : typeof obj;
              };

    var asyncGenerator = (function() {
        function AwaitValue(value) {
            this.value = value;
        }

        function AsyncGenerator(gen) {
            var front, back;

            function send(key, arg) {
                return new Promise(function(resolve, reject) {
                    var request = {
                        key: key,
                        arg: arg,
                        resolve: resolve,
                        reject: reject,
                        next: null
                    };

                    if (back) {
                        back = back.next = request;
                    } else {
                        front = back = request;
                        resume(key, arg);
                    }
                });
            }

            function resume(key, arg) {
                try {
                    var result = gen[key](arg);
                    var value = result.value;

                    if (value instanceof AwaitValue) {
                        Promise.resolve(value.value).then(
                            function(arg) {
                                resume('next', arg);
                            },
                            function(arg) {
                                resume('throw', arg);
                            }
                        );
                    } else {
                        settle(result.done ? 'return' : 'normal', result.value);
                    }
                } catch (err) {
                    settle('throw', err);
                }
            }

            function settle(type, value) {
                switch (type) {
                    case 'return':
                        front.resolve({
                            value: value,
                            done: true
                        });
                        break;

                    case 'throw':
                        front.reject(value);
                        break;

                    default:
                        front.resolve({
                            value: value,
                            done: false
                        });
                        break;
                }

                front = front.next;

                if (front) {
                    resume(front.key, front.arg);
                } else {
                    back = null;
                }
            }

            this._invoke = send;

            if (typeof gen.return !== 'function') {
                this.return = undefined;
            }
        }

        if (typeof Symbol === 'function' && Symbol.asyncIterator) {
            AsyncGenerator.prototype[Symbol.asyncIterator] = function() {
                return this;
            };
        }

        AsyncGenerator.prototype.next = function(arg) {
            return this._invoke('next', arg);
        };

        AsyncGenerator.prototype.throw = function(arg) {
            return this._invoke('throw', arg);
        };

        AsyncGenerator.prototype.return = function(arg) {
            return this._invoke('return', arg);
        };

        return {
            wrap: function(fn) {
                return function() {
                    return new AsyncGenerator(fn.apply(this, arguments));
                };
            },
            await: function(value) {
                return new AwaitValue(value);
            }
        };
    })();

    /*------------------------------------------------------------------------------------------------\
  Clone a variable (http://stackoverflow.com/a/728694).
\------------------------------------------------------------------------------------------------*/

    function clone(obj) {
        var copy;

        //Handle the 3 simple types, and null or undefined
        if (null == obj || 'object' != (typeof obj === 'undefined' ? 'undefined' : _typeof(obj)))
            return obj;

        //Handle Date
        if (obj instanceof Date) {
            copy = new Date();
            copy.setTime(obj.getTime());
            return copy;
        }

        //Handle Array
        if (obj instanceof Array) {
            copy = [];
            for (var i = 0, len = obj.length; i < len; i++) {
                copy[i] = clone(obj[i]);
            }
            return copy;
        }

        //Handle Object
        if (obj instanceof Object) {
            copy = {};
            for (var attr in obj) {
                if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
            }
            return copy;
        }

        throw new Error("Unable to copy obj! Its type isn't supported.");
    }

    function rangePolygon(chart) {
        var area = d3.svg
            .area()
            .x(function(d) {
                return (
                    chart.x(d['TIME']) +
                    (chart.config.x.type === 'ordinal' ? chart.x.rangeBand() / 2 : 0)
                );
            })
            .y0(function(d) {
                var lbornlo = d['STNRLO'];
                return lbornlo !== 'NA' ? chart.y(+lbornlo) : 0;
            })
            .y1(function(d) {
                var lbornrhi = d['STNRHI'];
                return lbornrhi !== 'NA' ? chart.y(+lbornrhi) : 0;
            });

        var dRow = chart.filtered_data[0];

        var myRows = chart.x_dom.slice().map(function(m) {
            return {
                STNRLO: dRow[chart.config.normal_col_low],
                STNRHI: dRow[chart.config.normal_col_high],
                TIME: m
            };
        });
        //remove what is there now
        chart.svg.select('.norms').remove();
        //add new
        chart.svg
            .append('path')
            .datum(myRows)
            .attr('class', 'norms')
            .attr('fill', 'blue')
            .attr('fill-opacity', 0.1)
            .attr('d', area);
    }

    function adjustTicks(axis, dx, dy, rotation, anchor) {
        if (!axis) return;
        this.svg
            .selectAll('.' + axis + '.axis .tick text')
            .attr({
                transform: 'rotate(' + rotation + ')',
                dx: dx,
                dy: dy
            })
            .style('text-anchor', anchor || 'start');
    }

    function smallMultiples(id, chart) {
        //Clear current multiples.
        chart.wrap
            .select('.multiples')
            .select('.wc-small-multiples')
            .remove();

        //Define small multiples settings.
        var multiples_settings = Object.assign(
            {},
            clone(chart.config),
            clone(Object.getPrototypeOf(chart.config))
        );
        multiples_settings.x.domain = null;
        multiples_settings.y.domain = null;
        multiples_settings.resizable = false;
        multiples_settings.scale_text = false;

        if (multiples_settings.multiples_sizing.width)
            multiples_settings.width = multiples_settings.multiples_sizing.width;
        if (multiples_settings.multiples_sizing.height)
            multiples_settings.height =
                multiples_settings.multiples_sizing.height +
                (multiples_settings.margin.bottom ? multiples_settings.margin.bottom : 0);

        multiples_settings.margin = { bottom: multiples_settings.margin.bottom || 20 };

        var multiples = webcharts.createChart(
            chart.wrap.select('.multiples').node(),
            multiples_settings,
            null
        );

        //Insert header.
        multiples.wrap
            .insert('strong', '.legend')
            .text('All Measures for ' + id[chart.config.id_col]);
        var detail_table = multiples.wrap
            .insert('table', '.legend')
            .append('tbody')
            .classed('detail-listing', true);
        detail_table
            .append('thead')
            .selectAll('th')
            .data(['', ''])
            .enter()
            .append('th');
        detail_table.append('tbody');

        //Insert a line for each item in [ settings.detail_cols ].
        if (chart.config.details && chart.config.details.length) {
            chart.config.details.forEach(function(detail) {
                var value_col = detail.value_col ? detail.value_col : detail;

                var label = detail.label
                    ? detail.label
                    : detail.value_col ? detail.value_col : detail;

                if (id[value_col] !== undefined)
                    detail_table
                        .select('tbody')
                        .append('tr')
                        .selectAll('td')
                        .data([label, id[value_col]])
                        .enter()
                        .append('td')
                        .style('text-align', function(d, i) {
                            return i === 0 ? 'right' : 'left';
                        })
                        .text(function(d, i) {
                            return i === 0 ? d + ':' : d;
                        });
            });
        }

        //Add styling to small multiples.
        multiples.on('layout', function() {
            var _this = this;

            //Define multiple styling.
            this.wrap.style('display', 'block');
            this.wrap
                .selectAll('.wc-chart-title')
                .style('display', 'block')
                .style('border-top', '1px solid #eee');
            this.wrap.selectAll('.wc-chart').style('padding-bottom', '2px');

            //Set y-label to measure unit.
            this.config.y.label = this.raw_data.find(function(d) {
                return d[_this.config.measure_col] === _this.wrap.select('.wc-chart-title').text();
            })[this.config.unit_col];
        });

        multiples.on('preprocess', function() {
            var _this2 = this;

            //Define y-domain as minimum of lower limit of normal and minimum result and maximum of
            //upper limit of normal and maximum result.
            var filtered_data = this.raw_data.filter(function(f) {
                return f[_this2.filters[0].col] === _this2.filters[0].val;
            });

            //Calculate range of normal range.
            var normlo = Math.min.apply(
                null,
                filtered_data
                    .map(function(m) {
                        return +m[chart.config.normal_col_low];
                    })
                    .filter(function(f) {
                        return +f || +f === 0;
                    })
            );
            var normhi = Math.max.apply(
                null,
                filtered_data
                    .map(function(m) {
                        return +m[chart.config.normal_col_high];
                    })
                    .filter(function(f) {
                        return +f || +f === 0;
                    })
            );

            //Calculate range of data.
            var ylo = d3.min(
                filtered_data
                    .map(function(m) {
                        return +m[chart.config.y.column];
                    })
                    .filter(function(f) {
                        return +f || +f === 0;
                    })
            );
            var yhi = d3.max(
                filtered_data
                    .map(function(m) {
                        return +m[chart.config.y.column];
                    })
                    .filter(function(f) {
                        return +f || +f === 0;
                    })
            );

            //Set y-domain.
            this.config.y_dom = [Math.min(normlo, ylo), Math.max(normhi, yhi)];
        });

        multiples.on('resize', function() {
            //Resize text manually.
            this.wrap.select('.wc-chart-title').style('font-size', '12px');
            this.svg.selectAll('.axis .tick text').style('font-size', '10px');

            //Draw normal range.
            if (this.filtered_data.length) rangePolygon(this);

            //Axis tweaks
            //this.svg.select('.y.axis').select('.axis-title').text(this.filtered_data[0][chart.config.unit_col]);
            this.svg
                .select('.x.axis')
                .select('.axis-title')
                .remove();

            //Delete legend.
            this.legend.remove();

            //Rotate ticks.
            if (chart.config.rotate_x_tick_labels) {
                adjustTicks.call(this, 'x', -10, 10, -45, 'end');
            }
        });

        var ptData = chart.initial_data.filter(function(f) {
            return f[chart.config.id_col] === id[chart.config.id_col];
        });

        webcharts.multiply(multiples, ptData, chart.config.measure_col);
    }

    function onResize() {
        var chart = this;
        var config = this.config;

        //Highlight lines and point corresponding to an ID.
        function highlight(id) {
            var myLine = chart.svg.selectAll('.line').filter(function(d) {
                return d.values[0].values.raw[0][config.id_col] === id[config.id_col];
            });
            myLine.select('path').attr('stroke-width', 4);

            var myPoints = chart.svg.selectAll('.point').filter(function(d) {
                return d.values.raw[0][config.id_col] === id[config.id_col];
            });
            myPoints.select('circle').attr('r', 4);
        }

        //Remove highlighting.
        function clearHighlight() {
            chart.svg
                .selectAll('.line:not(.selected)')
                .select('path')
                .attr('stroke-width', 0.5);
            chart.svg
                .selectAll('.point:not(.selected)')
                .select('circle')
                .attr('r', 2);
        }

        //Set up event listeners on lines and points
        this.svg
            .selectAll('.line')
            .on('mouseover', function(d) {
                var id = chart.raw_data.find(function(di) {
                    return di[config.id_col] === d.values[0].values.raw[0][config.id_col];
                });
                highlight(id);
            })
            .on('mouseout', clearHighlight)
            .on('click', function(d) {
                var id = chart.raw_data.find(function(di) {
                    return di[config.id_col] === d.values[0].values.raw[0][config.id_col];
                });

                //Un-select all lines and points.
                chart.svg.selectAll('.line').classed('selected', false);
                chart.svg.selectAll('.point').classed('selected', false);

                //Select line and all points corresponding to selected ID.
                d3.select(this).classed('selected', true);
                chart.svg
                    .selectAll('.point')
                    .filter(function(d) {
                        return d.values.raw[0][config.id_col] === id[config.id_col];
                    })
                    .classed('selected', true);

                //Generate small multiples and highlight marks.
                smallMultiples(id, chart);
                highlight(id);
            });

        this.svg
            .selectAll('.point')
            .on('mouseover', function(d) {
                var id = chart.raw_data.find(function(di) {
                    return di[config.id_col] === d.values.raw[0][config.id_col];
                });
                highlight(id);
            })
            .on('mouseout', clearHighlight)
            .on('click', function(d) {
                var id = chart.raw_data.find(function(di) {
                    return di[config.id_col] === d.values.raw[0][config.id_col];
                });

                //Un-select all lines and points.
                chart.svg.selectAll('.line').classed('selected', false);
                chart.svg.selectAll('.point').classed('selected', false);

                //Select line and all points corresponding to selected ID.
                chart.svg
                    .selectAll('.line')
                    .filter(function(d) {
                        return d.values[0].values.raw[0][config.id_col] === id[config.id_col];
                    })
                    .classed('selected', true);
                chart.svg
                    .selectAll('.point')
                    .filter(function(d) {
                        return d.values.raw[0][config.id_col] === id[config.id_col];
                    })
                    .classed('selected', true);

                //Generate small multiples and highlight marks.
                smallMultiples(id, chart);
                highlight(id);
            });

        //draw reference boxplot
        this.svg.select('g.boxplot').remove();
        var myValues = this.current_data.map(function(d) {
            return d.values.y;
        });

        addBoxPlot(this.svg, myValues, this.plot_height, 1, this.y_dom, 10, '#bbb', 'white');
        this.svg
            .select('g.boxplot')
            .attr(
                'transform',
                'translate(' + (this.plot_width + this.config.margin.right / 2) + ',0)'
            );

        this.svg.select('.overlay').on('click', function() {
            //clear current multiples
            chart.wrap
                .select('.multiples')
                .select('.wc-small-multiples')
                .remove();
            chart.svg.selectAll('.line').classed('selected', false);
            chart.svg.selectAll('.point').classed('selected', false);
            clearHighlight();
        });

        // rotate ticks
        if (config.rotate_x_tick_labels) {
            adjustTicks.call(this, 'x', -10, 10, -45, 'end');
        }
    }

    function safetyOutlierExplorer(element, settings) {
        //Merge user settings with default settings.
        var mergedSettings = Object.assign({}, defaultSettings, settings);

        //Sync options within settings object, e.g. data mappings.
        mergedSettings = syncSettings(mergedSettings);

        //Sync control inputs with with settings object.
        var syncedControlInputs = syncControlInputs(controlInputs, mergedSettings);
        var controls = webcharts.createControls(element, {
            location: 'top',
            inputs: syncedControlInputs
        });

        //Create chart.
        var chart = webcharts.createChart(element, mergedSettings, controls);
        chart.on('init', onInit);
        chart.on('layout', onLayout);
        chart.on('preprocess', onPreprocess);
        chart.on('datatransform', onDatatransform);
        chart.on('draw', onDraw);
        chart.on('resize', onResize);

        return chart;
    }

    return safetyOutlierExplorer;
});
