(function(global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined'
        ? (module.exports = factory(require('webcharts'), require('d3')))
        : typeof define === 'function' && define.amd
          ? define(['webcharts', 'd3'], factory)
          : (global.aeTimelines = factory(global.webCharts, global.d3));
})(this, function(webcharts, d3) {
    'use strict';

    /*------------------------------------------------------------------------------------------------\
  Add assign method to Object if nonexistent.
\------------------------------------------------------------------------------------------------*/

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

    var defaultSettings =
        //Template-specific settings
        {
            id_col: 'USUBJID',
            seq_col: 'AESEQ',
            stdy_col: 'ASTDY',
            endy_col: 'AENDY',
            term_col: 'AETERM',

            color: {
                value_col: 'AESEV',
                label: 'Severity/Intensity',
                values: ['MILD', 'MODERATE', 'SEVERE'],
                colors: [
                    '#66bd63', // green
                    '#fdae61', // sherbet
                    '#d73027', // red
                    '#377eb8',
                    '#984ea3',
                    '#ff7f00',
                    '#a65628',
                    '#f781bf',
                    '#999999'
                ]
            },

            highlight: {
                value_col: 'AESER',
                label: 'Serious Event',
                value: 'Y',
                detail_col: null,
                attributes: {
                    stroke: 'black',
                    'stroke-width': '2',
                    fill: 'none'
                }
            },

            filters: null,
            details: null,
            custom_marks: null,

            //Standard chart settings
            x: {
                column: 'wc_value',
                type: 'linear',
                label: null
            },
            y: {
                column: null, // set in syncSettings()
                type: 'ordinal',
                label: '',
                sort: 'earliest',
                behavior: 'flex'
            },
            marks: [
                {
                    type: 'line',
                    per: null, // set in syncSettings()
                    tooltip: null, // set in syncSettings()
                    attributes: {
                        'stroke-width': 5,
                        'stroke-opacity': 0.5
                    }
                },
                {
                    type: 'circle',
                    per: null, // set in syncSettings()
                    tooltip: null, // set in syncSettings()
                    attributes: {
                        'fill-opacity': 0.5,
                        'stroke-opacity': 0.5
                    }
                }
            ],
            legend: { location: 'top' },
            gridlines: 'y',
            range_band: 15,
            margin: { top: 50 }, // for second x-axis
            resizable: true
        };

    function syncSettings(preSettings) {
        var nextSettings = clone(preSettings);

        nextSettings.y.column = nextSettings.id_col;

        //Lines (AE duration)
        nextSettings.marks[0].per = [nextSettings.id_col, nextSettings.seq_col];
        nextSettings.marks[0].tooltip =
            'Reported Term: [' +
            nextSettings.term_col +
            ']' +
            ('\nStart Day: [' + nextSettings.stdy_col + ']') +
            ('\nStop Day: [' + nextSettings.endy_col + ']');

        //Circles (AE start day)
        nextSettings.marks[1].per = [nextSettings.id_col, nextSettings.seq_col, 'wc_value'];
        nextSettings.marks[1].tooltip =
            'Reported Term: [' +
            nextSettings.term_col +
            ']' +
            ('\nStart Day: [' + nextSettings.stdy_col + ']') +
            ('\nStop Day: [' + nextSettings.endy_col + ']');
        nextSettings.marks[1].values = { wc_category: [nextSettings.stdy_col] };

        //Define highlight marks.
        if (nextSettings.highlight) {
            //Lines (highlighted event duration)
            var highlightLine = {
                type: 'line',
                per: [nextSettings.id_col, nextSettings.seq_col],
                tooltip:
                    'Reported Term: [' +
                    nextSettings.term_col +
                    ']' +
                    ('\nStart Day: [' + nextSettings.stdy_col + ']') +
                    ('\nStop Day: [' + nextSettings.endy_col + ']') +
                    ('\n' +
                        nextSettings.highlight.label +
                        ': [' +
                        (nextSettings.highlight.detail_col
                            ? nextSettings.highlight.detail_col
                            : nextSettings.highlight.value_col) +
                        ']'),
                values: {},
                attributes: nextSettings.highlight.attributes || {}
            };
            highlightLine.values[nextSettings.highlight.value_col] = nextSettings.highlight.value;
            highlightLine.attributes.class = 'highlight';
            nextSettings.marks.push(highlightLine);

            //Circles (highlighted event start day)
            var highlightCircle = {
                type: 'circle',
                per: [nextSettings.id_col, nextSettings.seq_col, 'wc_value'],
                tooltip:
                    'Reported Term: [' +
                    nextSettings.term_col +
                    ']' +
                    ('\nStart Day: [' + nextSettings.stdy_col + ']') +
                    ('\nStop Day: [' + nextSettings.endy_col + ']') +
                    ('\n' +
                        nextSettings.highlight.label +
                        ': [' +
                        (nextSettings.highlight.detail_col
                            ? nextSettings.highlight.detail_col
                            : nextSettings.highlight.value_col) +
                        ']'),
                values: { wc_category: nextSettings.stdy_col },
                attributes: nextSettings.highlight.attributes || {}
            };
            highlightCircle.values[nextSettings.highlight.value_col] = nextSettings.highlight.value;
            highlightCircle.attributes.class = 'highlight';
            nextSettings.marks.push(highlightCircle);
        }

        //Define mark coloring and legend.
        nextSettings.color_by = nextSettings.color.value_col;
        nextSettings.colors = nextSettings.color.colors;
        nextSettings.legend = nextSettings.legend || { location: 'top' };
        nextSettings.legend.label = nextSettings.color.label;
        nextSettings.legend.order = nextSettings.color.values;

        //Default filters
        if (!nextSettings.filters || nextSettings.filters.length === 0) {
            nextSettings.filters = [
                { value_col: nextSettings.color.value_col, label: nextSettings.color.label },
                { value_col: nextSettings.id_col, label: 'Subject Identifier' }
            ];
            if (nextSettings.highlight)
                nextSettings.filters.unshift({
                    value_col: nextSettings.highlight.value_col,
                    label: nextSettings.highlight.label
                });
        }

        //Default detail listing columns
        var defaultDetails = [
            { value_col: nextSettings.seq_col, label: 'Sequence Number' },
            { value_col: nextSettings.stdy_col, label: 'Start Day' },
            { value_col: nextSettings.endy_col, label: 'Stop Day' },
            { value_col: nextSettings.term_col, label: 'Reported Term' }
        ];

        //Add settings.color.value_col to default details.
        defaultDetails.push({
            value_col: nextSettings.color.value_col,
            label: nextSettings.color.label
        });

        //Add settings.highlight.value_col and settings.highlight.detail_col to default details.
        if (nextSettings.highlight) {
            defaultDetails.push({
                value_col: nextSettings.highlight.value_col,
                label: nextSettings.highlight.label
            });

            if (nextSettings.highlight.detail_col)
                defaultDetails.push({
                    value_col: nextSettings.highlight.detail_col,
                    label: nextSettings.highlight.label + ' Details'
                });
        }

        //Add settings.filters columns to default details.
        nextSettings.filters.forEach(function(filter) {
            if (filter !== nextSettings.id_col && filter.value_col !== nextSettings.id_col)
                defaultDetails.push({
                    value_col: filter.value_col,
                    label: filter.label
                });
        });

        //Redefine settings.details with defaults.
        if (!nextSettings.details) nextSettings.details = defaultDetails;
        else {
            //Allow user to specify an array of columns or an array of objects with a column property
            //and optionally a column label.
            nextSettings.details = nextSettings.details.map(function(d) {
                return {
                    value_col: d.value_col ? d.value_col : d,
                    label: d.label ? d.label : d.value_col ? d.value_col : d
                };
            });

            //Add default details to settings.details.
            defaultDetails.reverse().forEach(function(defaultDetail) {
                return nextSettings.details.unshift(defaultDetail);
            });
        }

        //Add custom marks to marks array.
        if (nextSettings.custom_marks)
            nextSettings.custom_marks.forEach(function(custom_mark) {
                custom_mark.attributes = custom_mark.attributes || {};
                custom_mark.attributes.class = 'custom';
                nextSettings.marks.push(custom_mark);
            });

        return nextSettings;
    }

    var controlInputs = [
        {
            type: 'dropdown',
            option: 'y.sort',
            label: 'Sort Subject IDs',
            values: ['earliest', 'alphabetical-descending'],
            require: true
        }
    ];

    function syncControlInputs(preControlInputs, preSettings) {
        preSettings.filters.forEach(function(d, i) {
            var thisFilter = {
                type: 'subsetter',
                value_col: d.value_col ? d.value_col : d,
                label: d.label ? d.label : d.value_col ? d.value_col : d
            };
            //add the filter to the control inputs (as long as it isn't already there)
            var current_value_cols = preControlInputs
                .filter(function(f) {
                    return f.type == 'subsetter';
                })
                .map(function(m) {
                    return m.value_col;
                });
            if (current_value_cols.indexOf(thisFilter.value_col) == -1)
                preControlInputs.unshift(thisFilter);
        });

        return preControlInputs;
    }

    function syncSecondSettings(preSettings) {
        var nextSettings = clone(preSettings);

        nextSettings.y.column = nextSettings.seq_col;
        nextSettings.y.sort = 'alphabetical-descending';

        nextSettings.marks[0].per = [nextSettings.seq_col];
        nextSettings.marks[1].per = [nextSettings.seq_col, 'wc_value'];

        if (nextSettings.highlight) {
            nextSettings.marks[2].per = [nextSettings.seq_col];
            nextSettings.marks[3].per = [nextSettings.seq_col, 'wc_value'];
        }

        nextSettings.range_band = preSettings.range_band * 2;
        nextSettings.margin = null;
        nextSettings.transitions = false;

        return nextSettings;
    }

    /*------------------------------------------------------------------------------------------------\
  Expand a data array to one item per original item per specified column.
\------------------------------------------------------------------------------------------------*/

    function lengthenRaw(data, columns) {
        var my_data = [];

        data.forEach(function(d) {
            columns.forEach(function(column) {
                var obj = Object.assign({}, d);
                obj.wc_category = column;
                obj.wc_value = d[column];
                my_data.push(obj);
            });
        });

        return my_data;
    }

    function onInit() {
        var _this = this;

        //Count total number of IDs for population count.
        this.populationCount = d3
            .set(
                this.raw_data.map(function(d) {
                    return d[_this.config.id_col];
                })
            )
            .values().length;

        //Remove non-AE records.
        this.superRaw = this.raw_data.filter(function(d) {
            return /[^\s]/.test(d[_this.config.term_col]);
        });

        //Set empty settings.color_by values to 'N/A'.
        this.superRaw.forEach(function(d) {
            return (d[_this.config.color_by] = /[^\s]/.test(d[_this.config.color_by])
                ? d[_this.config.color_by]
                : 'N/A');
        });

        //Append unspecified settings.color_by values to settings.legend.order and define a shade of
        //gray for each.
        var color_by_values = d3
            .set(
                this.superRaw.map(function(d) {
                    return d[_this.config.color_by];
                })
            )
            .values();
        color_by_values.forEach(function(color_by_value, i) {
            if (_this.config.legend.order.indexOf(color_by_value) === -1) {
                _this.config.legend.order.push(color_by_value);
                _this.chart2.config.legend.order.push(color_by_value);
            }
        });

        //Derived data manipulation
        this.raw_data = lengthenRaw(this.superRaw, [this.config.stdy_col, this.config.endy_col]);
        this.raw_data.forEach(function(d) {
            d.wc_value = d.wc_value ? +d.wc_value : NaN;
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
    }

    function onLayout() {
        var _this = this;

        //Add div for participant counts.
        this.wrap
            .select('.legend')
            .append('span')
            .classed('annote', true)
            .style('float', 'right');

        //Create div for back button and participant ID title.
        this.chart2.wrap
            .insert('div', ':first-child')
            .attr('id', 'backButton')
            .insert('button', '.legend')
            .html('&#8592; Back')
            .style('cursor', 'pointer')
            .on('click', function() {
                _this.chart2.wrap.select('.id-title').remove();
                _this.chart2.wrap.style('display', 'none');
                _this.table.wrap.style('display', 'none');
                _this.controls.wrap.style('display', 'block');
                _this.wrap.style('display', 'block');
                _this.draw();
            });

        //Add top x-axis.
        var x2 = this.svg.append('g').attr('class', 'x2 axis linear');
        x2
            .append('text')
            .attr({
                class: 'axis-title top',
                dy: '2em',
                'text-anchor': 'middle'
            })
            .text(this.config.x_label);
    }

    function onDataTransform() {}

    /*------------------------------------------------------------------------------------------------\
  Annotate number of participants based on current filters, number of participants in all, and
  the corresponding percentage.

  Inputs:

    chart - a webcharts chart object
    id_unit - a text string to label the units in the annotation (default = 'participants')
    selector - css selector for the annotation
\------------------------------------------------------------------------------------------------*/

    function updateSubjectCount(chart, selector, id_unit) {
        //count the number of unique ids in the current chart and calculate the percentage
        var filtered_data = chart.raw_data.filter(function(d) {
            var filtered = d[chart.config.seq_col] === '';
            chart.filters.forEach(function(di) {
                if (filtered === false && di.val !== 'All')
                    filtered =
                        Object.prototype.toString.call(di.val) === '[object Array]'
                            ? di.val.indexOf(d[di.col]) === -1
                            : di.val !== d[di.col];
            });
            return !filtered;
        });
        var currentObs = d3
            .set(
                filtered_data.map(function(d) {
                    return d[chart.config.id_col];
                })
            )
            .values().length;

        var percentage = d3.format('0.1%')(currentObs / chart.populationCount);

        //clear the annotation
        var annotation = d3.select(selector);
        annotation.selectAll('*').remove();

        //update the annotation
        var units = id_unit ? ' ' + id_unit : ' participant(s)';
        annotation.text(
            currentObs + ' of ' + chart.populationCount + units + ' shown (' + percentage + ')'
        );
    }

    function onDraw() {
        var _this = this;

        //Annotate number of selected participants out of total participants.
        updateSubjectCount(this, '.annote', 'subject ID(s)');

        //Sort y-axis based on `Sort IDs` control selection.
        var yAxisSort = this.controls.wrap
            .selectAll('.control-group')
            .filter(function(d) {
                return d.option && d.option === 'y.sort';
            })
            .select('option:checked')
            .text();

        if (yAxisSort === 'earliest') {
            //Redefine filtered data as it defaults to the final mark drawn, which might be filtered in
            //addition to the current filter selections.
            var filtered_data = this.raw_data.filter(function(d) {
                var filtered = d[_this.config.seq_col] === '';
                _this.filters.forEach(function(di) {
                    if (filtered === false && di.val !== 'All')
                        filtered =
                            Object.prototype.toString.call(di.val) === '[object Array]'
                                ? di.val.indexOf(d[di.col]) === -1
                                : di.val !== d[di.col];
                });
                return !filtered;
            });

            //Capture all subject IDs with adverse events with a start day.
            var withStartDay = d3
                .nest()
                .key(function(d) {
                    return d[_this.config.id_col];
                })
                .rollup(function(d) {
                    return d3.min(d, function(di) {
                        return +di[_this.config.stdy_col];
                    });
                })
                .entries(
                    filtered_data.filter(function(d) {
                        return (
                            !isNaN(parseFloat(d[_this.config.stdy_col])) &&
                            isFinite(d[_this.config.stdy_col])
                        );
                    })
                )
                .sort(function(a, b) {
                    return a.values > b.values
                        ? -2
                        : a.values < b.values ? 2 : a.key > b.key ? -1 : 1;
                })
                .map(function(d) {
                    return d.key;
                });

            //Capture all subject IDs with adverse events without a start day.
            var withoutStartDay = d3
                .set(
                    filtered_data
                        .filter(function(d) {
                            return (
                                +d[_this.config.seq_col] > 0 &&
                                (isNaN(parseFloat(d[_this.config.stdy_col])) ||
                                    !isFinite(d[_this.config.stdy_col])) &&
                                withStartDay.indexOf(d[_this.config.id_col]) === -1
                            );
                        })
                        .map(function(d) {
                            return d[_this.config.id_col];
                        })
                )
                .values();
            this.y_dom = withStartDay.concat(withoutStartDay);
        } else this.y_dom = this.y_dom.sort(d3.descending);
    }

    /*------------------------------------------------------------------------------------------------\
  Sync colors of legend marks and chart marks.
\------------------------------------------------------------------------------------------------*/

    function syncColors(chart) {
        //Recolor legend.
        var legendItems = chart.wrap.selectAll('.legend-item:not(.highlight)');
        legendItems.each(function(d, i) {
            d3
                .select(this)
                .select('.legend-mark')
                .style('stroke', chart.config.colors[chart.config.legend.order.indexOf(d.label)])
                .style('stroke-width', '25%');
        });

        //Recolor circles.
        var circles = chart.svg.selectAll(
            'circle.wc-data-mark:not(.highlight), circle.wc-data-mark:not(.custom)'
        );
        circles.each(function(d, i) {
            var color_by_value = d.values.raw[0][chart.config.color_by];
            d3
                .select(this)
                .style(
                    'stroke',
                    chart.config.colors[chart.config.legend.order.indexOf(color_by_value)]
                );
            d3
                .select(this)
                .style(
                    'fill',
                    chart.config.colors[chart.config.legend.order.indexOf(color_by_value)]
                );
        });

        //Recolor lines.
        var lines = chart.svg.selectAll(
            'path.wc-data-mark:not(.highlight), path.wc-data-mark:not(.custom)'
        );
        lines.each(function(d, i) {
            var color_by_value = d.values[0].values.raw[0][chart.config.color_by];
            d3
                .select(this)
                .style(
                    'stroke',
                    chart.config.colors[chart.config.legend.order.indexOf(color_by_value)]
                );
        });
    }

    /*------------------------------------------------------------------------------------------------\
  Add highlighted adverse event legend item.
\------------------------------------------------------------------------------------------------*/

    function addHighlightLegendItem(chart) {
        chart.wrap.select('.legend li.highlight').remove();
        var highlightLegendItem = chart.wrap
            .select('.legend')
            .append('li')
            .attr('class', 'highlight')
            .style({
                'list-style-type': 'none',
                'margin-right': '1em',
                display: 'inline-block'
            });
        var highlightLegendColorBlock = highlightLegendItem
            .append('svg')
            .attr({
                width: '1.75em',
                height: '1.5em'
            })
            .style({
                position: 'relative',
                top: '0.35em'
            });
        highlightLegendColorBlock
            .append('circle')
            .attr({
                cx: 10,
                cy: 10,
                r: 4
            })
            .style(chart.config.highlight.attributes);
        highlightLegendColorBlock
            .append('line')
            .attr({
                x1: 2 * 3.14 * 4 - 10,
                y1: 10,
                x2: 2 * 3.14 * 4 - 5,
                y2: 10
            })
            .style(chart.config.highlight.attributes)
            .style('shape-rendering', 'crispEdges');
        highlightLegendItem
            .append('text')
            .style('margin-left', '.35em')
            .text(chart.config.highlight.label);
    }

    function onResize() {
        var _this = this;

        var context = this;

        //Sync legend and mark colors.
        syncColors(this);

        //Add highlight adverse event legend item.
        if (this.config.highlight) addHighlightLegendItem(this);

        //Draw second x-axis at top of chart.
        var x2Axis = d3.svg
            .axis()
            .scale(this.x)
            .orient('top')
            .tickFormat(this.xAxis.tickFormat())
            .innerTickSize(this.xAxis.innerTickSize())
            .outerTickSize(this.xAxis.outerTickSize())
            .ticks(this.xAxis.ticks()[0]);
        var g_x2_axis = this.svg.select('g.x2.axis').attr('class', 'x2 axis linear');
        g_x2_axis.call(x2Axis);
        g_x2_axis
            .select('text.axis-title.top')
            .attr(
                'transform',
                'translate(' + this.raw_width / 2 + ',-' + this.config.margin.top + ')'
            );
        g_x2_axis.select('.domain').attr({
            fill: 'none',
            stroke: '#ccc',
            'shape-rendering': 'crispEdges'
        });
        g_x2_axis.selectAll('.tick line').attr('stroke', '#eee');

        //Draw second chart when y-axis tick label is clicked.
        this.svg
            .select('.y.axis')
            .selectAll('.tick')
            .style('cursor', 'pointer')
            .on('click', function(d) {
                var csv2 = _this.raw_data.filter(function(di) {
                    return di[_this.config.id_col] === d;
                });
                _this.chart2.wrap.style('display', 'block');
                _this.chart2.draw(csv2);
                _this.chart2.wrap
                    .select('#backButton')
                    .append('strong')
                    .attr('class', 'id-title')
                    .style('margin-left', '1%')
                    .text('Participant: ' + d);

                //Sort listing by sequence.
                var seq_col = context.config.seq_col;
                var tableData = _this.superRaw
                    .filter(function(di) {
                        return di[_this.config.id_col] === d;
                    })
                    .sort(function(a, b) {
                        return +a[seq_col] < b[seq_col] ? -1 : 1;
                    });

                //Define listing columns.
                _this.table.config.cols = d3
                    .set(
                        _this.config.details.map(function(detail) {
                            return detail.value_col;
                        })
                    )
                    .values();
                _this.table.config.headers = d3
                    .set(
                        _this.config.details.map(function(detail) {
                            return detail.label;
                        })
                    )
                    .values();
                _this.table.wrap.style('display', 'block');
                _this.table.draw(tableData);
                _this.table.wrap.selectAll('th,td').style({
                    'text-align': 'left',
                    'padding-right': '10px'
                });

                //Hide timelines.
                _this.wrap.style('display', 'none');
                _this.controls.wrap.style('display', 'none');
            });

        /**-------------------------------------------------------------------------------------------\
      Second chart callbacks.
    \-------------------------------------------------------------------------------------------**/

        this.chart2.on('datatransform', function() {
            //Define color scale.
            this.config.color_dom = context.colorScale.domain();
        });

        this.chart2.on('draw', function() {
            //Sync x-axis domain of second chart with that of the original chart.
            this.x_dom = context.x_dom;
        });

        this.chart2.on('resize', function() {
            //Sync legend and mark colors.
            syncColors(this);

            //Add highlight adverse event legend item.
            if (this.config.highlight) addHighlightLegendItem(this);
        });
    }

    function aeTimelines(element, settings) {
        //Merge default settings with custom settings.
        var mergedSettings = Object.assign({}, defaultSettings, settings);

        //Sync properties within settings object.
        var syncedSettings = syncSettings(mergedSettings);

        //Sync control inputs with settings object.
        var syncedControlInputs = syncControlInputs(controlInputs, syncedSettings);

        //Sync properties within secondary settings object.
        var syncedSecondSettings = syncSecondSettings(syncedSettings);

        //Create controls.
        var controls = webcharts.createControls(element, {
            location: 'top',
            inputs: syncedControlInputs
        });

        //Create chart.
        var chart = webcharts.createChart(element, syncedSettings, controls);
        chart.on('init', onInit);
        chart.on('layout', onLayout);
        chart.on('datatransform', onDataTransform);
        chart.on('draw', onDraw);
        chart.on('resize', onResize);

        //Create participant-level chart.
        var chart2 = webcharts.createChart(element, syncedSecondSettings).init([]);
        chart2.wrap.style('display', 'none');
        chart.chart2 = chart2;

        //Create participant-level listing.
        var table = webcharts.createTable(element, {}).init([]);
        table.wrap.style('display', 'none');
        table.table.style('display', 'table');
        table.table.attr('width', '100%');
        chart.table = table;

        return chart;
    }

    return aeTimelines;
});
