library(safetyexploreR)

server = function(input, output, session){
  
  # gather study name
  text <- eventReactive(input$goButton, {
    validate(
      need(input$study != "", "Please enter your study's name")
    )
    input$study
  })
  output$study <- renderText({
    text()
  })

  # gather data files 
  data1 <- callModule(loadData, "datafile1", na.strings='')
  data2 <- callModule(loadData, "datafile2", na.strings='')
  
  # produce AE widgets from data files
  callModule(safetyWidgets, 'widgets', data1=data1, data2=data2, height='50px', width='100px')
  

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
 
 # Need to exclude the buttons from themselves being bookmarked
 setBookmarkExclude(c("bookmark1", "bookmark2"))
 
 # Trigger bookmarking with either button
 observeEvent(input$bookmark, {
   session$doBookmark()
 })
 
}