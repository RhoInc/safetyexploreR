#' Create a Safety Shift Plot widget
#'
#' This function creates a Safety Shift Plot using R htmlwidgets.  
#'
#' @param data A data.frame containing the labs data. 
#' 
#' Required columns include `USUBJID` (unique subject ID), 
#' `VISITN` (timing of collection), `TEST` (name of measure), and `STRESN` (value of measure).
#' 
#' @param width Width in pixels 
#' @param height Height in pixels  
#' @param elementId The element ID for the widget.
#'
#' @seealso aeExplorer, aeTimelines, safetyHistogram, safetyOutlierExplorer, safetyResultsOverTime
#' @source Safety Shift Plot: \url{https://github.com/RhoInc/safety-shift-plot}. 
#'
#' @import htmlwidgets
#'
#' @export
safetyShiftPlot <- function(data, width = NULL, height = NULL, elementId = NULL) {

  # forward options using x
  x = list(
    data = data
  )

  # create widget
  htmlwidgets::createWidget(
    name = 'safetyShiftPlot',
    x,
    width = width,
    height = height,
    package = 'safetyexploreR',
    elementId = elementId
  )
}

#' Shiny bindings for safetyShiftPlot
#'
#' Output and render functions for using safetyShiftPlot within Shiny
#' applications and interactive Rmd documents.
#'
#' @param outputId output variable to read from
#' @param width,height Must be a valid CSS unit (like \code{'100\%'},
#'   \code{'400px'}, \code{'auto'}) or a number, which will be coerced to a
#'   string and have \code{'px'} appended.
#' @param expr An expression that generates a safetyShiftPlot
#' @param env The environment in which to evaluate \code{expr}.
#' @param quoted Is \code{expr} a quoted expression (with \code{quote()})? This
#'   is useful if you want to save an expression in a variable.
#'
#' @name safetyShiftPlot-shiny
#'
#' @export
safetyShiftPlotOutput <- function(outputId, width = '100%', height = '400px'){
  htmlwidgets::shinyWidgetOutput(outputId, 'safetyShiftPlot', width, height, package = 'safetyexploreR')
}

#' @rdname safetyShiftPlot-shiny
#' @export
renderSafetyShiftPlot <- function(expr, env = parent.frame(), quoted = FALSE) {
  if (!quoted) { expr <- substitute(expr) } # force quoted
  htmlwidgets::shinyRenderWidget(expr, safetyShiftPlotOutput, env, quoted = TRUE)
}
