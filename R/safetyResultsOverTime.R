#' Create a Safety Results Over Time widget
#'
#' This function creates a Safety Results Over Time widget using R htmlwidgets.  
#'
#' @param data A data.frame containing the labs data. 
#' 
#' Required columns include `USUBJID` (unique subject ID), 
#' `VISITN` (timing of collection), `TEST` (name of measure), `STRESN` (value of measure), 
#' `STRESU` (unit of measure), and `SEX`/`RACE` (subpopulation(s) of interest).
#' 
#' Optional columns include `STRNLO` (lower limit of normal values) and `STRNHI` (upper limit of normal values).
#' 
#' @param width Width in pixels 
#' @param height Height in pixels  
#' @param elementId The element ID for the widget.
#'
#' @seealso aeExplorer, aeTimelines, safetyHistogram, safetyOutlierExplorer, safetyShiftPlot
#' @source Safety Results Over Time: \url{https://github.com/RhoInc/safety-results-over-time}.
#'
#' @import htmlwidgets
#'
#' @export
safetyResultsOverTime <- function(data, width = NULL, height = NULL, elementId = NULL) {

  # forward options using x
  x = list(
    data = data
  )

  # create widget
  htmlwidgets::createWidget(
    name = 'safetyResultsOverTime',
    x,
    width = width,
    height = height,
    package = 'safetyexploreR',
    elementId = elementId
  )
}

#' Shiny bindings for safetyResultsOverTime
#'
#' Output and render functions for using safetyResultsOverTime within Shiny
#' applications and interactive Rmd documents.
#'
#' @param outputId output variable to read from
#' @param width,height Must be a valid CSS unit (like \code{'100\%'},
#'   \code{'400px'}, \code{'auto'}) or a number, which will be coerced to a
#'   string and have \code{'px'} appended.
#' @param expr An expression that generates a safetyResultsOverTime
#' @param env The environment in which to evaluate \code{expr}.
#' @param quoted Is \code{expr} a quoted expression (with \code{quote()})? This
#'   is useful if you want to save an expression in a variable.
#'
#' @name safetyResultsOverTime-shiny
#'
#' @export
safetyResultsOverTimeOutput <- function(outputId, width = '100%', height = '400px'){
  htmlwidgets::shinyWidgetOutput(outputId, 'safetyResultsOverTime', width, height, package = 'safetyexploreR')
}

#' @rdname safetyResultsOverTime-shiny
#' @export
renderSafetyResultsOverTime <- function(expr, env = parent.frame(), quoted = FALSE) {
  if (!quoted) { expr <- substitute(expr) } # force quoted
  htmlwidgets::shinyRenderWidget(expr, safetyResultsOverTimeOutput, env, quoted = TRUE)
}
