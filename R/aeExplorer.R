#' Create an AE Explorer widget
#'
#' This function creates an AE Explorer using R htmlwidgets.  
#'
#' @param data A data.frame containing the Adverse Events data.  Required columns include 
#' `USUBJID` (unique subject ID), `AEBODSYS` (higher-level term), `AEDECOD` (lower-level term), 
#' and `ARM` (treatment group),
#' 
#' @param width Width in pixels 
#' @param height Height in pixels  
#' @param elementId The element ID for the widget.
#'
#' @seealso aeTimelines, safetyHistogram, safetyOutlierExplorer, safetyResultsOverTime, safetyShiftPlot
#' @source AE Explorer: \url{https://github.com/RhoInc/aeexplorer}.
#' 
#' @import htmlwidgets
#'
#' @export
aeExplorer <- function(data, width = NULL, height = NULL, elementId = NULL) {

  # forward options using x
  x = list(
    data=data
  )

  # create widget
  htmlwidgets::createWidget(
    name = 'aeExplorer',
    x,
    width = width,
    height = height,
    package = 'safetyexploreR',
    elementId = elementId
  )
}



#' Shiny bindings for aeExplorer
#'
#' Output and render functions for using aeExplorer within Shiny
#' applications and interactive Rmd documents.
#'
#' @param outputId output variable to read from
#' @param width,height Must be a valid CSS unit (like \code{'100\%'},
#'   \code{'400px'}, \code{'auto'}) or a number, which will be coerced to a
#'   string and have \code{'px'} appended.
#' @param expr An expression that generates a aeExplorer
#' @param env The environment in which to evaluate \code{expr}.
#' @param quoted Is \code{expr} a quoted expression (with \code{quote()})? This
#'   is useful if you want to save an expression in a variable.
#'
#' @name aeExplorer-shiny
#'
#' @export
aeExplorerOutput <- function(outputId, width = '100%', height = '400px'){
  htmlwidgets::shinyWidgetOutput(outputId, 'aeExplorer', width, height, package = 'safetyexploreR')
}

#' @rdname aeExplorer-shiny
#' @export
renderAeExplorer <- function(expr, env = parent.frame(), quoted = FALSE) {
  if (!quoted) { expr <- substitute(expr) } # force quoted
  htmlwidgets::shinyRenderWidget(expr, aeExplorerOutput, env, quoted = TRUE)
}
