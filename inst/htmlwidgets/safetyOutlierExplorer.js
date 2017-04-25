HTMLWidgets.widget({

  name: 'safetyOutlierExplorer',

  type: 'output',

  factory: function(el, width, height) {

    // TODO: define shared variables for this instance

    return {

      renderValue: function(x) {

        el.innerHTML = "";
        
        x.data = HTMLWidgets.dataframeToD3(x.data);

        safetyOutlierExplorer(el, x.settings).init(x.data);

      },

      resize: function(width, height) {

        // TODO: code to re-render the widget with a new size

      }

    };
  }
});