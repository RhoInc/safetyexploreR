library(safetyexploreR)

server = function(input, output, session){
  
  
  
  datafile1 <- reactive({
    
    if(is.null(input$datafile1)){
      return(NULL)
    }else{
      input$datafile1
    }
  })
  datafile2 <- reactive({
    
    if(is.null(input$datafile2)){
      return(NULL)
    }else{
      input$datafile2
    }
  })  
  
  data1 <- reactive({		
    
    validate(
      need(! is.null(datafile1()) | input$example,'')
    )
    
    
    if(input$example){
      return(ADAE)
    }
    else {
      if (length(grep(".csv", datafile1(), ignore.case = TRUE)) > 0){
        return(
          data.frame(
            read.csv(datafile1()$datapath, na.strings="")
          ))
      }else if(length(grep(".sas7bdat", datafile1(), ignore.case = TRUE)) > 0){
        return(
          data.frame(
            haven::read_sas(datafile1()$datapath) 
          ))
      }
    }  
  })
  data2 <- reactive({		
    
    validate(
      need(! is.null(datafile2()) | input$example,'')
    )
    
    
    if(input$example){
      return(ADBDS)
    }
    else {
      if (length(grep(".csv", datafile2(), ignore.case = TRUE)) > 0){
        return(
          data.frame(
            read.csv(datafile2()$datapath, na.strings="")
          ))
      }else if(length(grep(".sas7bdat", datafile2(), ignore.case = TRUE)) > 0){
        return(
          data.frame(
            haven::read_sas(datafile2()$datapath) 
          ))
      }
    }  
  }) 
  
  observe({
    input$example
    session$sendCustomMessage(type = "resetFileInputHandler", "datafile1")  
    session$sendCustomMessage(type = "resetFileInputHandler", "datafile2")  
  })
  observeEvent({!is.null(input$datafile1)
    !is.null(input$datafile2)}, { 
      shinyjs::reset("example")
    }) 
  
  
  # produce safety widgets from data files
  callModule(safetyWidgets, 'widgets', data1=data1, data2=data2, height='50px', width='100px')
  
  
  
  observeEvent(input$report==TRUE,
               { 
                 output$reportDL <- downloadHandler(
                   filename = "safety_report.html",
                   content = function(file) {
                     # Copy the report file to a temporary directory before processing it, in case we don't
                     # have write permissions to the current working dir (which can happen when deployed).
                     tempReport <- file.path(tempdir(), "report.Rmd")
                     file.copy("template/safety_report.Rmd", tempReport, overwrite = TRUE)
                     
                     params <- list(study = input$study,
                                    text1=input$text1,
                                    text2=input$text2,
                                    text3=input$text3,
                                    text4=input$text4,
                                    text5=input$text5,
                                    text6=input$text6,
                                    data1 = data1(),
                                    data2 = data2())
                     
                     rmarkdown::render(tempReport,
                                       output_file = file,
                                       params = params,  ## pass in params
                                       envir = new.env(parent = globalenv())  ## eval in child of global env
                     )
                   }
                 )
               })
  
  
  
  # Need to exclude the buttons from themselves being bookmarked
  setBookmarkExclude(c("bookmark1", "bookmark2"))
  
  
  
  # Trigger bookmarking with either button
  observeEvent(input$bookmark, {
    session$doBookmark()
  })
  
}