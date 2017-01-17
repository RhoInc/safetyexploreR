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
  
  # produce safety widgets from data files
  callModule(safetyWidgets, 'widgets', data1=data1, data2=data2, height='50px', width='100px')
  
  # produce report from input text and data files
  callModule(downloadReport, "reportDL", text=text, data1=data1, data2=data2)

 
 # Need to exclude the buttons from themselves being bookmarked
 setBookmarkExclude(c("bookmark1", "bookmark2"))
 
 # Trigger bookmarking with either button
 observeEvent(input$bookmark, {
   session$doBookmark()
 })
 
}