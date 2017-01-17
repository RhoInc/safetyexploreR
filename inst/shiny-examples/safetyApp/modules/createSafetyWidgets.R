safetyWidgetsUI <- function(id){
  ns <- NS(id)
  
  tabsetPanel( 
    tabPanel("AE Explorer", aeExplorerOutput(outputId = ns('ae1'))),
    tabPanel("AE Timelines", aeTimelinesOutput(outputId = ns('ae2'))),
    tabPanel("Safety Histogram", safetyHistogramOutput(outputId = ns('ae3'))),
    tabPanel("Safety Outlier Explorer", safetyOutlierExplorerOutput(outputId = ns('ae4'))),
    tabPanel("Safety Results Over Time", safetyResultsOverTimeOutput(outputId = ns('ae5'))),
    tabPanel("Safety Shift Plot", safetyShiftPlotOutput(outputId = ns('ae6')))
  )
}

safetyWidgets <- function(input, output, session, data1, data2, height=NULL, width=NULL){
  
  output$ae1 <- renderAeExplorer({
    aeExplorer(data = data1(), height=height, width=width)
  })
  output$ae2 <- renderAeTimelines({
    aeTimelines(data = data1(), height=height, width=width)
  })
  output$ae3 <- renderSafetyHistogram({ 
    safetyHistogram(data=data2())
  })
  output$ae4 <- renderSafetyOutlierExplorer({
    safetyOutlierExplorer(data=data2())
  })
  output$ae5 <- renderSafetyResultsOverTime({
    safetyResultsOverTime(data=data2())
  })
  output$ae6 <- renderSafetyShiftPlot({
    safetyShiftPlot(data=data2())
  })
  
}