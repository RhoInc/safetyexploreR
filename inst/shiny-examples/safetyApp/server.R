library(safetyexploreR)

server = function(input, output, session){
  
  text <- eventReactive(input$goButton, {
    validate(
      need(input$study != "", "Please enter your study's name")
    )
    input$study
  })
  output$study <- renderText({
    text()
  })
  
  data1 <- callModule(loadData, "datafile1", na.strings='')
  data2 <- callModule(loadData, "datafile2", na.strings='')
  
 # callModule(AEwidget, 'widgets', data=data(), height='50px', width='100px')
  
  output$ae1 <- renderAeExplorer({
    aeExplorer(data = data1(), height='50px', width='100px')
  })
 output$ae2 <- renderAeTimelines({
    aeTimelines(data = data1(), height='50px', width='100px')
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
 
  # callModule(report, "reportDL")
 
 output$report <- downloadHandler(
   filename = "ae_report.html",
   content = function(file) {
     # Copy the report file to a temporary directory before processing it, in case we don't
     # have write permissions to the current working dir (which can happen when deployed).
     tempReport <- file.path(tempdir(), "report.Rmd")
     file.copy("template/ae_report.Rmd", tempReport, overwrite = TRUE)

     params <- list(study = text(),
                    data1 = data1(),
                    data2 = data2())
     
     rmarkdown::render(tempReport,
                       output_file = file,
                       params = params,  ## pass in params
                       envir = new.env(parent = globalenv())  ## eval in child of global env
                       )
}
 )
}