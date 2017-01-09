HTMLWidgets.widget({

  name: 'aeExplorer',

  type: 'output',

  factory: function(el, width, height) {

 // return = widget instance object
    return {

      // renderValue delivers data & settings to the DOM element
      // x = data & settings
      renderValue: function(x) {

        //Specify settings for variables, groups, filters and display preferences
        var settings = {variables:
                    {'id': 'USUBJID'
                    ,'major': 'AESOC'
                    ,'minor': 'AEDECOD'
                    ,'group': 'ARM'
                    ,'details':
                        ['USUBJID'
                        ,'AGE'
                        ,'RACE'
                        ,'AESTDTC'
                        ,'AESTDY'
                        ,'AEENDTC'
                        ,'AEENDY'
                        ,'AETERM'
                        ,'AEDECOD'
                        ,'AESOC'
                        ,'AESER'
                        ,'AESEV'
                        ,'AEREL']
                    ,'details': []}
                ,groups:
                    []
                ,filters:
                    [   {'value_col': 'AESER'
                        ,'label': 'Serious?'}
                    ,   {'value_col': 'AESEV'
                        ,'label': 'Severity'}
                    ,   {'value_col': 'AEREL'
                        ,'label': 'Relationship'}]
                ,defaults:
                    {'diffCol': 'Show'
                    ,'totalCol': 'Show'
                    ,'prefTerms': 'Hide'
                    ,'maxPrevalence': 0}
                };

          x.data = HTMLWidgets.dataframeToD3(x.data);

          aeTable(el, settings).init(x.data);
      },

      resize: function(width, height) {

        // TODO: code to re-render the widget with a new size

      }

    };
  }
});