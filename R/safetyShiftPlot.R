#' Create a Safety Shift Plot widget
#'
#' This function creates a Safety Shift Plot using R htmlwidgets.  
#'
#' @param data A data.frame containing the labs data. 
#' @param id   Participant ID variable name. Default is \code{"USUBJID"}.
#' @param timing Timing of collection variable names. Default is \code{"VISITN"}.
#' @param measure  Name of measure variable name. Default is \code{"TEST"}.
#' @param value   Value of measure variable name. Default is \code{"STRESN"}.
#' @param start_value Optional: specifies a value of \code{measure} to be displayed when the chart is loaded.  
#' @param width Width in pixels 
#' @param height Height in pixels  
#' @param elementId The element ID for the widget.
#'
#' @examples
#' \dontrun{
#' # Run Safety Histogram with defaults
#' safetyShiftPlot(data=LAB)
#' }
#' 
#' @seealso aeExplorer, aeTimelines, safetyHistogram, safetyOutlierExplorer, safetyResultsOverTime
#' @source Safety Shift Plot: \url{https://github.com/RhoInc/safety-shift-plot}. 
#'
#' @import htmlwidgets
#'
#' @export
safetyShiftPlot <- function(data, 
                            id = "USUBJID",
                            timing = "VISITN",
                            measure = "TEST",
                            value = "STRESN",
                            start_value = NULL,
                            width = NULL, height = NULL, elementId = NULL) {

  # forward options using x
  x = list(
    data = data,
    settings = jsonlite::toJSON(
      list(
        id_col = id, 
        time_col = timing, 
        measure_col = measure,
        value_col = value
        #,
        #start_value = I(start_value)
      ),
      null="null", auto_unbox=T
    )
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
