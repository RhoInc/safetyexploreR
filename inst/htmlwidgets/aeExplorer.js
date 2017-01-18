HTMLWidgets.widget({

  name: 'aeExplorer',

  type: 'output',

  factory: function(el, width, height) {

 // return = widget instance object
    return {

      // renderValue delivers data & settings to the DOM element
      // x = data & settings
      renderValue: function(x) {
        
        var settings = x.settings;

        x.data = HTMLWidgets.dataframeToD3(x.data);

        aeTable(el, settings).init(x.data);
      },

      resize: function(width, height) {

        // TODO: code to re-render the widget with a new size

      }

    };
  }
});