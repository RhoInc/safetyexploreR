HTMLWidgets.widget({

  name: 'safetyOutlierExplorer',

  type: 'output',

  factory: function(el, width, height) {


    // TODO: define shared variables for this instance

    return {

      renderValue: function(x) {

        //el.innerHTML = "";
        
        var chart = safetyOutlierExplorer(el, x.settings);
        
        x.data = HTMLWidgets.dataframeToD3(x.data);

        chart.init(x.data);
        
//        chart.wrap.on("participantsSelected",function(chart){
//          console.log("Participant Selected!! You clicked participant: "+chart.participantsSelected);
//          Shiny.setInputValue("selectedParticipant", d3.event.detail); //Note: d3.event.detail and chart.participantSelected are interchangable here
//        });
        el.chart = chart;

      },

      resize: function(width, height) {

        // TODO: code to re-render the widget with a new size

      },
      

    };
  }
});