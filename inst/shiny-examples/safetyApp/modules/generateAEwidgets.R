AEwidgetUI <- function(id){
  ns <- NS(id)
  
  tabsetPanel( 
    tabPanel("AE Explorer", aeExplorerOutput(outputId = ns('ae1'))),
    tabPanel("AE Timelines", aeTimelinesOutput(outputId = ns('ae2')))
  )
}

AEwidget <- function(input, output, session, data, height=NULL, width=NULL){
  
  output$ae1 <- renderAeExplorer({
    aeExplorer(data = data(), height=height, width=width)
  })
  output$ae2 <- renderAeTimelines({
    aeTimelines(data = data(), height=height, width=width)
  })
  
}