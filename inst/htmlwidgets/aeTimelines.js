HTMLWidgets.widget({

  name: 'aeTimelines',

  type: 'output',

  factory: function(el, width, height) {

   return {

      renderValue: function(x) {

        var settings = {
                legend: {
                   location:"top",
                    order: ['MILD', 'MODERATE', 'SEVERE', 'NA']
                },
                colors: ['green', 'orange', 'red', '#444'],
                stdy_col: 'AESTDY', //Overwrites default value
                endy_col: 'AEENDY', //Overwrites default value
                date_format:"%Y-%m-%d" //Overwrites default value
            };
       
       x.data = HTMLWidgets.dataframeToD3(x.data);
       
       aeTimelines(el, settings).init(x.data);


      },

      resize: function(width, height) {

        // TODO: code to re-render the widget with a new size

      }

    };
  }
});