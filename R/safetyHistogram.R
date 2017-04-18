#' Create a Safety Histogram widget
#'
#' This function creates a Safety Histogram using R htmlwidgets.  
#'
#' @param data A data frame containing the labs data. 
#' @param id_col   Participant ID variable name. Default is \code{"USUBJID"}.
#' @param measure_col  Name of measure variable name. Default is \code{"TEST"}.
#' @param value_col   Value of measure variable name. Default is \code{"STRESN"}.
#' @param unit_col   Unit of measure variable name. Default is \code{"STRESU"}.
#' @param normal_col_low   Optional: Variable name for column containing lower limit of normal values. Default is \code{"STNRLO"}.
#' @param normal_col_high  Optional: Variable name for column containing upper limit of normal values. Default is \code{"STNRHI"}.
#' @param filters_col Optional vector of variable names to use for filters (in addition to default filter on \code{measure_col}).  
#' @param filters_label Associated labels to use for filters. If left as \code{NULL}, variable names will be used as labels. 
#' @param details_col Optional vector of variable names to include in details listing, in addition to variables specified in \code{id}, \code{value}, \code{normal_low}, and \code{normal_high}.
#' @param details_label Associated labels/headers to use for details listing.  If left as \code{NULL}, variable names will be used as labels. 
#' @param start_value Value of variable defined in \code{measure_col} to be rendered in the histogram when the widget loads. 
#' @param missingValues Vector of values defining a missing \code{value_col}. Default is \code{c('','NA','N/A')}.
#' @param width Width in pixels 
#' @param height Height in pixels  
#' @param elementId The element ID for the widget.
#'
#' @examples
#' \dontrun{
#' # Run Safety Histogram with defaults
#' safetyHistogram(data=ADBDS)
#'  
#' # Run Safety Histogram with some customizations 
#' safetyHistogram(data=ADBDS, filters_col = c('ARM','SEX','RACE'))
#' }
#' 
#' @seealso aeExplorer, aeTimelines, safetyOutlierExplorer, safetyResultsOverTime, safetyShiftPlot
#' @source Safety Histogram: \url{https://github.com/RhoInc/safety-histogram}.
#'
#' @import htmlwidgets
#'
#' @export
safetyHistogram <- function(data, 
                            id_col = "USUBJID",
                            measure_col = "TEST",
                            value_col = "STRESN",
                            unit_col = "STRESU",
                            normal_col_low = 'STNRLO',
                            normal_col_high = 'STNRHI',
                            filters_col = NULL, 
                            filters_label = NULL,
                            details_col = NULL,
                            details_label = NULL, 
                            start_value = NULL,
                            missingValues = c('','NA','N/A'),
                            width = NULL, height = NULL, elementId = NULL) {

  
  # create array of objects format for json - filters
  if (!is.null(filters_label)){
    filters <- data.frame(value_col = filters_col, label = filters_label)
  } else{
    filters <- data.frame(value_col = filters_col, label = filters_col)    
  }

  # create array of objects format for json - details
  if (!is.null(details_label)){
    details <- data.frame(value_col = details_col, label = details_label)    
    } else{
    details <- data.frame(value_col = details_col, label = details_col)    
    }
  
  
  # forward options using x
  x = list(
    data = data,
    settings = jsonlite::toJSON(
      list(
        id_col = id_col, 
        measure_col = measure_col,
        value_col = value_col,
        unit_col = unit_col,
        normal_col_low = normal_col_low,
        normal_col_high = normal_col_high,
        filters = I(filters),
        details = I(details),
        start_value = start_value,
        missingValues = missingValues
      ),
      null="null", auto_unbox=T
    )
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
