
downloadReportUI <- function(id){
  
  ns <- NS(id)
  
  downloadButton(ns("report"), "Generate report")
}

downloadReport <- function(input, output, session, text, data1, data2){
  output$report <- downloadHandler(
    filename = "safety_report.html",
    content = function(file) {
      # Copy the report file to a temporary directory before processing it, in case we don't
      # have write permissions to the current working dir (which can happen when deployed).
      tempReport <- file.path(tempdir(), "report.Rmd")
      file.copy("template/safety_report.Rmd", tempReport, overwrite = TRUE)
      
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


