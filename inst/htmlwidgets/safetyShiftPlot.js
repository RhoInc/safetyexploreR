HTMLWidgets.widget({

  name: 'safetyShiftPlot',

  type: 'output',

  factory: function(el, width, height) {

    // TODO: define shared variables for this instance

    return {

      renderValue: function(x) {

        x.data = HTMLWidgets.dataframeToD3(x.data);

        safetyShiftPlot(el, x.settings).init(x.data);

      },

      resize: function(width, height) {

        // TODO: code to re-render the widget with a new size

      }

    };
  }
});