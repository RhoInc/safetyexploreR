#' Adverse Events Table Shiny App
#'
#' @export
runAeTableApp <- function() {
  appDir <- system.file("shiny-examples", "aeTableApp", package = "safetyexploreR")
  if (appDir == "") {
    stop("Could not find example directory. Try re-installing `mypackage`.", call. = FALSE)
  }
  
  shiny::runApp(appDir, display.mode = "normal")
}