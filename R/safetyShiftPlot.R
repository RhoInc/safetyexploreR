#' Create a Safety Shift Plot widget
#'
#' This function creates a Safety Shift Plot using R htmlwidgets.  
#'
#' @param data A data.frame containing the labs data. 
#' @param id_col   Participant ID variable name. Default is \code{"USUBJID"}.
#' @param time_col Timing of collection variable names. Default is \code{"VISITN"}.
#' @param measure_col  Name of measure variable name. Default is \code{"TEST"}.
#' @param value_col   Value of measure variable name. Default is \code{"STRESN"}.
#' @param start_value Optional: specifies a value of \code{measure} to be displayed when the chart is loaded.  
#' @param filters_col Optional vector of variable names to use for filters  (in addition to default filter on \code{measure}).  
#' @param filters_label Associated labels to use for filters. If left as \code{NULL}, variable names will be used as labels. 
#' @param x_params_visits Optional character vector of visit values with which to define the baseline outcome. Defaults to the first ordered value of \code{time}. 
#' @param x_params_stat Aggregate function with which to summarize baseline values.  Default value is \code{mean}. Options are \code{"mean"}, \code{"min"}, or \code{"max"}.
#' @param y_params_visits Optional character vector of visit values with which to define the comparison outcome. Defaults to all values of \code{time} except the first sorted value. 
#' @param y_params_stat Aggregate function with which to summarize comparison values.  Default value is \code{mean}. Options are \code{"mean"}, \code{"min"}, or \code{"max"}.
#' @param width Width in pixels 
#' @param height Height in pixels  
#' @param elementId The element ID for the widget.
#'
#' @examples
#' \dontrun{
#' # Run Safety Histogram with defaults
#' safetyShiftPlot(data=ADBDS)
#' 
#' # Run Safety Histogram with some customizations
#' safetyShiftPlot(data=ADBDS, 
#'                 x_params_visits=1, x_params_stat='min', 
#'                 y_params_visits=c(5,6,7), y_params_stat='mean')
#' }
#' 
#' @seealso aeExplorer, aeTimelines, safetyHistogram, safetyOutlierExplorer, safetyResultsOverTime
#' @source Safety Shift Plot: \url{https://github.com/RhoInc/safety-shift-plot}. 
#'
#' @import htmlwidgets
#'
#' @export
safetyShiftPlot <- function(data, 
                            id_col = "USUBJID",
                            time_col = "VISITN",
                            measure_col = "TEST",
                            value_col = "STRESN",
                            start_value = NULL,
                            filters_col = NULL, 
                            filters_label = NULL,
                            x_params_visits = NULL,
                            x_params_stat = 'mean',
                            y_params_visits = NULL,
                            y_params_stat = 'mean',
                            width = NULL, height = NULL, elementId = NULL) {

  # create array of objects format for json - filters
  if (!is.null(filters_label)){
    filters <- data.frame(value_col = filters_col, label = filters_label)
  } else{
    filters <- data.frame(value_col = filters_col, label = filters_col)    
  }
  
  # create object format for json - x_param/y_param
  if (!is.null(x_params_visits)){
    x_params <- list(visits = as.character(x_params_visits), stat = x_params_stat)
  } else{
    x_params <- list(visits = x_params_visits, stat = x_params_stat)
  }
  if (!is.null(y_params_visits)){
    y_params <- list(visits = as.character(y_params_visits), stat = y_params_stat)
  } else{
    y_params <- list(visits = y_params_visits, stat = y_params_stat)
  }  
  
  # forward options using x
  x = list(
    data = data,
    settings = jsonlite::toJSON(
      list(
        id_col = id_col, 
        time_col = time_col, 
        measure_col = measure_col,
        value_col = value_col,
        filters = I(filters),
        x_params = x_params,
        y_params = y_params,
        start_value = start_value,
        width = 500
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
