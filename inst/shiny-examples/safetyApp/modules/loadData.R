loadDataUI <- function(id, label, accept=c('.csv','.sas7bdat')){
  
  ns <- NS(id)
  
  shiny::fileInput(ns("file"), label = label, accept = accept)
}
            
loadData <- function(input, output, session, na.strings=NULL) {
  userFile <- reactive({
    validate(
      need(input$file != "", "Please select a data set")
    )
    input$file
  })
  
  df <- reactive({
    if(length(grep(".csv", userFile(), ignore.case = TRUE)) > 0){
      read.csv(userFile()$datapath, na.strings=na.strings) %>% data.frame
    }else if(length(grep(".sas7bdat", userFile(), ignore.case = TRUE)) > 0){
      haven::read_sas(userFile()$datapath) %>% data.frame
    }
  })
  return(df)
}