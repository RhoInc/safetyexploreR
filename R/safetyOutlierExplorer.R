#' Create a Safety Outlier Explorer widget
#'
#' This function creates a Safety Outlier Explorer using R htmlwidgets.  
#'
#' @param data A data.frame containing the labs data. 
#' 
#' Required columns include `USUBJID` (unique subject ID), 
#' `VISITN`/`VISIT`/`DY` (timing of collection, all 3 required), `TEST` (name of measure), `STRESN` (value of measure), 
#' and `STRESU` (unit of measure). 
#' 
#' Optional columns include `STRNLO` (lower limit of normal values) and `STRNHI` (upper limit of normal values).
#' 
#' @param width Width in pixels 
#' @param height Height in pixels  
#' @param elementId The element ID for the widget.
#'
#' @seealso aeExplorer, aeTimelines, safetyHistogram, safetyResultsOverTime, safetyShiftPlot
#' @source Safety Outlier Explorer: \url{https://github.com/RhoInc/safety-outlier-explorer}.
#'
#' @import htmlwidgets
#'
#' @export
safetyOutlierExplorer <- function(data, width = NULL, height = NULL, elementId = NULL) {

  # forward options using x
  x = list(
    data = data
  )

  # create widget
  htmlwidgets::createWidget(
    name = 'safetyOutlierExplorer',
    x,
    width = width,
    height = height,
    package = 'safetyexploreR',
    elementId = elementId
  )
}

#' Shiny bindings for safetyOutlierExplorer
#'
#' Output and render functions for using safetyOutlierExplorer within Shiny
#' applications and interactive Rmd documents.
#'
#' @param outputId output variable to read from
#' @param width,height Must be a valid CSS unit (like \code{'100\%'},
#'   \code{'400px'}, \code{'auto'}) or a number, which will be coerced to a
#'   string and have \code{'px'} appended.
#' @param expr An expression that generates a safetyOutlierExplorer
#' @param env The environment in which to evaluate \code{expr}.
#' @param quoted Is \code{expr} a quoted expression (with \code{quote()})? This
#'   is useful if you want to save an expression in a variable.
#'
#' @name safetyOutlierExplorer-shiny
#'
#' @export
safetyOutlierExplorerOutput <- function(outputId, width = '100%', height = '400px'){
  htmlwidgets::shinyWidgetOutput(outputId, 'safetyOutlierExplorer', width, height, package = 'safetyexploreR')
}

#' @rdname safetyOutlierExplorer-shiny
#' @export
renderSafetyOutlierExplorer <- function(expr, env = parent.frame(), quoted = FALSE) {
  if (!quoted) { expr <- substitute(expr) } # force quoted
  htmlwidgets::shinyRenderWidget(expr, safetyOutlierExplorerOutput, env, quoted = TRUE)
}
