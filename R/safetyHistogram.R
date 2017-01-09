#' Create a Safety Histogram widget
#'
#' This function creates a Safety Histogram using R htmlwidgets.  
#'
#' @param data A data.frame containing the labs data. 
#' 
#' Required columns include `USUBJID` (unique subject ID), 
#' `VISITN` (timing of collection), `TEST` (name of measure), `STRESN` (value of measure), 
#' `STRESU` (unit of measure), `SEX` (participant sex), and `RACE` (participant race). 
#' 
#' Optional columns include `STRNLO` (lower limit of normal values) and `STRNHI` (upper limit of normal values). 
#' 
#' @param width Width in pixels 
#' @param height Height in pixels  
#' @param elementId The element ID for the widget.
#'
#' @seealso aeExplorer, aeTimelines, safetyOutlierExplorer, safetyResultsOverTime, safetyShiftPlot
#' @source Safety Histogram: \url{https://github.com/RhoInc/safety-histogram}.
#'
#' @import htmlwidgets
#'
#' @export
safetyHistogram <- function(data, width = NULL, height = NULL, elementId = NULL) {

  # forward options using x
  x = list(
    data = data
  )

  # create widget
  htmlwidgets::createWidget(
    name = 'safetyHistogram',
    x,
    width = width,
    height = height,
    package = 'safetyexploreR',
    elementId = elementId
  )
}

#' Shiny bindings for safetyHistogram
#'
#' Output and render functions for using safetyHistogram within Shiny
#' applications and interactive Rmd documents.
#'
#' @param outputId output variable to read from
#' @param width,height Must be a valid CSS unit (like \code{'100\%'},
#'   \code{'400px'}, \code{'auto'}) or a number, which will be coerced to a
#'   string and have \code{'px'} appended.
#' @param expr An expression that generates a safetyHistogram
#' @param env The environment in which to evaluate \code{expr}.
#' @param quoted Is \code{expr} a quoted expression (with \code{quote()})? This
#'   is useful if you want to save an expression in a variable.
#'
#' @name safetyHistogram-shiny
#'
#' @export
safetyHistogramOutput <- function(outputId, width = '100%', height = '400px'){
  htmlwidgets::shinyWidgetOutput(outputId, 'safetyHistogram', width, height, package = 'safetyexploreR')
}

#' @rdname safetyHistogram-shiny
#' @export
renderSafetyHistogram <- function(expr, env = parent.frame(), quoted = FALSE) {
  if (!quoted) { expr <- substitute(expr) } # force quoted
  htmlwidgets::shinyRenderWidget(expr, safetyHistogramOutput, env, quoted = TRUE)
}
