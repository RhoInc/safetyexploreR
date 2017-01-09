#' Create an AE Timelines widget
#'
#' This function creates an AE Timeline using R htmlwidgets.  
#'
#' @param data A data.frame containing the Adverse Events data.  
#' 
#' Required columns include 
#' `USUBJID` (unique subject ID), `AESEQ` (unique sequence ID for each AE), `AEBODSYS` (higher-level term), 
#' `AETERM` (lower-level term), `ASTDY` (Study day of adverse event start (integer)),
#' `AENDY` (Study day of adverse event end (integer)), `AESEV` (adeverse event severity), 
#' and `AEREL` (adverse event relatedness to treatment).
#' 
#' @param width Width in pixels 
#' @param height Height in pixels  
#' @param elementId The element ID for the widget.
#'
#' @seealso aeExplorer, safetyHistogram, safetyOutlierExplorer, safetyResultsOverTime, safetyShiftPlot
#' @source AE Timelines: \url{https://github.com/RhoInc/ae-timelines}.
#' 
#' @import htmlwidgets
#'
#' @export
aeTimelines <- function(data, width = NULL, height = NULL, elementId = NULL) {

  # forward options using x
  x = list(
    data=data
  )

  # create widget
  htmlwidgets::createWidget(
    name = 'aeTimelines',
    x,
    width = width,
    height = height,
    package = 'safetyexploreR',
    elementId = elementId
  )
}

#' Shiny bindings for aeTimelines
#'
#' Output and render functions for using aeTimelines within Shiny
#' applications and interactive Rmd documents.
#'
#' @param outputId output variable to read from
#' @param width,height Must be a valid CSS unit (like \code{'100\%'},
#'   \code{'400px'}, \code{'auto'}) or a number, which will be coerced to a
#'   string and have \code{'px'} appended.
#' @param expr An expression that generates a aeTimelines
#' @param env The environment in which to evaluate \code{expr}.
#' @param quoted Is \code{expr} a quoted expression (with \code{quote()})? This
#'   is useful if you want to save an expression in a variable.
#'
#' @name aeTimelines-shiny
#'
#' @export
aeTimelinesOutput <- function(outputId, width = '100%', height = '400px'){
  htmlwidgets::shinyWidgetOutput(outputId, 'aeTimelines', width, height, package = 'safetyexploreR')
}

#' @rdname aeTimelines-shiny
#' @export
renderAeTimelines <- function(expr, env = parent.frame(), quoted = FALSE) {
  if (!quoted) { expr <- substitute(expr) } # force quoted
  htmlwidgets::shinyRenderWidget(expr, aeTimelinesOutput, env, quoted = TRUE)
}
