HTMLWidgets.widget({

  name: 'safetyHistogram',

  type: 'output',

  factory: function(el, width, height) {


    return {

      renderValue: function(x) {

       var settings = {
        time_col: "VISITN",
        measure_col: "TEST",
        value_col: "STRESN",
        unit_col: "STRESU"
       };
       
       x.data = HTMLWidgets.dataframeToD3(x.data);
       
       safetyHistogram(el, settings).init(x.data);

      },

      resize: function(width, height) {

        // TODO: code to re-render the widget with a new size

      }

    };
  }
});