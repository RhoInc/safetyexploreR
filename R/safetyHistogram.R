#' Create a Safety Histogram widget
#'
#' This function creates a Safety Histogram using R htmlwidgets.  
#'
#' @param data A data frame containing the labs data. 
#' @param id   Participant ID variable name. Default is \code{"USUBJID"}.
#' @param measure  Name of measure variable name. Default is \code{"TEST"}.
#' @param value   Value of measure variable name. Default is \code{"STRESN"}.
#' @param unit   Unit of measure variable name. Default is \code{"STRESU"}.
#' @param normal_low   Variable name for column containing lower limit of normal values. Default is \code{"STRNLO"}.
#' @param normal_high  Variable name for column containing upper limit of normal values. Default is \code{"STRNHI"}.
#' @param filters  An optional list containing individual lists for each desired filter.  
#' To specify a  filter, two arguments (\code{value_col} and \code{label}) are required.   
#' (e.g. \code{filters = list(list(value_col = "AESER", label = "Serious?"), list(value_col = "SEX", label = "Participant Sex"))})
#' @param width Width in pixels 
#' @param height Height in pixels  
#' @param elementId The element ID for the widget.
#'
#' @examples
#' \dontrun{
#' # Run Safety Histogram with defaults
#' safetyHistogram(data=LAB)
#' 
#' # Run Safety Histogram with some customizations 
#' safetyHistogram(data=LAB, filters = list(list(value_col = "RACE", label = "Participant Race"), 
#'                                          list(value_col = "SEX", label = "Participant Sex")))
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
                            normal_low = 'STRNLO',
                            normal_high = 'STRNHI',
                            filters = NULL, 
                            width = NULL, height = NULL, elementId = NULL) {

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
        filters = I(filters)
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
