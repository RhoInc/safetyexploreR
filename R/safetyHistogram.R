#' Create a Safety Histogram widget
#'
#' This function creates a Safety Histogram using R htmlwidgets.  
#'
#' @param data A data frame containing the labs data. 
#' @param id   Participant ID variable name. Default is \code{"USUBJID"}.
#' @param measure  Name of measure variable name. Default is \code{"TEST"}.
#' @param value   Value of measure variable name. Default is \code{"STRESN"}.
#' @param unit   Unit of measure variable name. Default is \code{"STRESU"}.
#' @param normal_low   Optional: Variable name for column containing lower limit of normal values. Default is \code{"STNRLO"}.
#' @param normal_high  Optional: Variable name for column containing upper limit of normal values. Default is \code{"STNRHI"}.
#' @param filters_var Optional vector of variable names to use for filters (in addition to default filter on \code{measure}).  
#' @param filters_label Associated labels to use for filters. If left as \code{NULL}, variable names will be used as labels. 
#' @param details_var Optional vector of variable names to include in details listing, in addition to variables specified in \code{id}, \code{value}, \code{normal_low}, and \code{normal_high}.
#' @param details_label Associated labels/headers to use for details listing.  If left as \code{NULL}, variable names will be used as labels. 
#' @param start_value Value of variable defined in \code{measure} to be rendered in the histogram when the widget loads. 
#' @param missingValues Vector of values defining a missing \code{value}. Default is \code{c('','NA','N/A')}.
#' @param width Width in pixels 
#' @param height Height in pixels  
#' @param elementId The element ID for the widget.
#'
#' @examples
#' \dontrun{
#' # Run Safety Histogram with defaults
#' safetyHistogram(data=ADBDS)
#' }
#' 
#' @seealso aeExplorer, aeTimelines, safetyOutlierExplorer, safetyResultsOverTime, safetyShiftPlot
#' @source Safety Histogram: \url{https://github.com/RhoInc/safety-histogram}.
#'
#' @import htmlwidgets
#'
#' @export
safetyHistogram <- function(data, 
                            id = "USUBJID",
                            measure = "TEST",
                            value = "STRESN",
                            unit = "STRESU",
                            normal_low = 'STNRLO',
                            normal_high = 'STNRHI',
                            filters_var = NULL, 
                            filters_label = NULL,
                            details_var = NULL,
                            details_label = NULL, 
                            start_value = NULL,
                            missingValues = c('','NA','N/A'),
                            width = NULL, height = NULL, elementId = NULL) {

  
  # create list format for json - filters
  if (!is.null(filters_label)){
    filters <- data.frame(value_col = filters_var, label = filters_label)
  } else{
    filters <- data.frame(value_col = filters_var, label = filters_var)    
  }

  # create list format for json - details
  if (!is.null(details_label)){
    details <- data.frame(value_col = details_var, label = details_label)    
    } else{
    details <- data.frame(value_col = details_var, label = details_var)    
    }
  
  
  # forward options using x
  x = list(
    data = data,
    settings = jsonlite::toJSON(
      list(
        id_col = id, 
        measure_col = measure,
        value_col = value,
        unit_col = unit,
        normal_col_low = normal_low,
        normal_col_high = normal_high,
        filters = I(filters),
        details = I(details),
        start_value = I(filters),
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
