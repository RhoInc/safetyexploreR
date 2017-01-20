#' Create a Safety Outlier Explorer widget
#'
#' This function creates a Safety Outlier Explorer using R htmlwidgets.  
#'
#' @param data A data frame containing the labs data. 
#' @param id   Participant ID variable name. Default is \code{"USUBJID"}.
#' @param timing Timing of collection variable name(s).  Up to 3 may be specified. Default is \code{c("VISITN","VISIT","DY")}
#' @param measure  Name of measure variable name. Default is \code{"TEST"}.
#' @param value   Value of measure variable name. Default is \code{"STRESN"}.
#' @param unit   Unit of measure variable name. Default is \code{"STRESU"}.
#' @param normal_low   Optional: Variable name for column containing lower limit of normal values. Default is \code{"STRNLO"}.
#' @param normal_high  Optional: Variable name for column containing upper limit of normal values. Default is \code{"STRNHI"}.
#' @param width Width in pixels 
#' @param height Height in pixels  
#' @param elementId The element ID for the widget.
#'
#' @examples
#' \dontrun{
#' # Run Safety Outlier Explorer with defaults
#' safetyOutlierExplorer(data=LAB) 
#' }
#' 
#' @seealso aeExplorer, aeTimelines, safetyHistogram, safetyResultsOverTime, safetyShiftPlot
#' @source Safety Outlier Explorer: \url{https://github.com/RhoInc/safety-outlier-explorer}.
#'
#' @import htmlwidgets
#'
#' @export
safetyOutlierExplorer <- function(data, 
                                  id = "USUBJID",
                                  timing = c("VISITN","VISIT","DY"),
                                  measure = "TEST",
                                  value = "STRESN",
                                  unit = "STRESU",
                                  normal_low ="STRNLO", 
                                  normal_high = "STRNHI", 
                                  width = NULL, height = NULL, elementId = NULL) {

  # forward options using x
  x = list(
    data = data,
    settings = jsonlite::toJSON(
      list(
        id_col = id, 
        time_cols = timing, 
        measure_col = measure,
        value_col = value,
        unit_col = unit,
        normal_col_low = normal_low,
        normal_col_high = normal_high
      ),
      null="null", auto_unbox=T
    )
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
