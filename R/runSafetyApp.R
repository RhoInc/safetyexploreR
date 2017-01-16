#' Safety Explorer Shiny App
#'
#' @export
runSafetyApp <- function() {
  appDir <- system.file("shiny-examples", "safetyApp", package = "safetyexploreR")
  if (appDir == "") {
    stop("Could not find example directory. Try re-installing `mypackage`.", call. = FALSE)
  }
  
  shiny::runApp(appDir, display.mode = "normal")
}