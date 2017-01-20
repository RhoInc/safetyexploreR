#' Create a Safety Results Over Time widget
#'
#' This function creates a Safety Results Over Time widget using R htmlwidgets.  
#'
#' @param data A data frame containing the labs data. 
#' @param id   Participant ID variable name. Default is \code{"USUBJID"}.
#' @param timing Timing of collection variable names. Default is \code{"VISITN"}.
#' @param measure  Name of measure variable name. Default is \code{"TEST"}.
#' @param value   Value of measure variable name. Default is \code{"STRESN"}.
#' @param unit   Unit of measure variable name. Default is \code{"STRESU"}.
#' @param normal_low   Optional: Variable name for column containing lower limit of normal values. Default is \code{"STRNLO"}.
#' @param normal_high  Optional: Variable name for column containing upper limit of normal values. Default is \code{"STRNHI"}.
#' @param groups Vector of two or more variable names for columns defining subpopulations of interest.  Default is \code{c("SEX", "RACE")}.
#' @param start_value Optional: specifies a value of \code{measure} to be displayed when the chart is loaded.  
#' @param rotateX  Logical indicating whether to rotate the x-axis labels.  Default is \code{TRUE}. 
#' @param missingValues A vector of values found in \code{value} to be ignored when rendering the chat. Default is \code{c("NA","")}.
#' @param boxplots Logical indicating whether to render boxplots.  Default is \code{TRUE}.
#' @param violins Logical indicating whether to render violin plots.  Default is \code{FALSE}.
#' @param width Width in pixels 
#' @param height Height in pixels  
#' @param elementId The element ID for the widget.
#'
#' @examples
#' \dontrun{
#' # Run Safety Histogram with defaults
#' safetyResultsOverTime(data=LAB)
#' 
#' # Run Safety Histogram with some customizations 
#' safetyResultsOverTime(data=LAB, groups=c("SEX","RACE","ARM"), boxplots=T, violins=T)
#' }
#' 
#' @seealso aeExplorer, aeTimelines, safetyHistogram, safetyOutlierExplorer, safetyShiftPlot
#' @source Safety Results Over Time: \url{https://github.com/RhoInc/safety-results-over-time}.
#'
#' @import htmlwidgets
#'
#' @export
safetyResultsOverTime <- function(data, 
                                  id = "USUBJID",
                                  timing = "VISITN",
                                  measure = "TEST",
                                  value = "STRESN",
                                  unit = "STRESU",
                                  normal_low ="STRNLO", 
                                  normal_high = "STRNHI", 
                                  groups = c("SEX", "RACE"),
                                  start_value = NULL,
                                  rotateX = NULL,
                                  missingValues = c("NA",""),
                                  boxplots = TRUE,
                                  violins = FALSE,
                                  width = NULL, height = NULL, elementId = NULL) {

  # forward options using x
  x = list(
    data = data,
    settings = jsonlite::toJSON(
      list(
        id_col = id, 
        time_col = timing, 
        measure_col = measure,
        value_col = value,
        unit_col = unit,
        normal_col_low = normal_low,
        normal_col_high = normal_high,
        group_cols = groups,
      #  start_value = I(start_value),
      #  rotateX = I(rotateX),
        missingValues = missingValues,
        boxplots = boxplots,
        violins = violins
      ),
      null="null", auto_unbox=T
    )
  )

  # create widget
  htmlwidgets::createWidget(
    name = 'safetyResultsOverTime',
    x,
    width = width,
    height = height,
    package = 'safetyexploreR',
    elementId = elementId
  )
}

#' Shiny bindings for safetyResultsOverTime
#'
#' Output and render functions for using safetyResultsOverTime within Shiny
#' applications and interactive Rmd documents.
#'
#' @param outputId output variable to read from
#' @param width,height Must be a valid CSS unit (like \code{'100\%'},
#'   \code{'400px'}, \code{'auto'}) or a number, which will be coerced to a
#'   string and have \code{'px'} appended.
#' @param expr An expression that generates a safetyResultsOverTime
#' @param env The environment in which to evaluate \code{expr}.
#' @param quoted Is \code{expr} a quoted expression (with \code{quote()})? This
#'   is useful if you want to save an expression in a variable.
#'
#' @name safetyResultsOverTime-shiny
#'
#' @export
safetyResultsOverTimeOutput <- function(outputId, width = '100%', height = '400px'){
  htmlwidgets::shinyWidgetOutput(outputId, 'safetyResultsOverTime', width, height, package = 'safetyexploreR')
}

#' @rdname safetyResultsOverTime-shiny
#' @export
renderSafetyResultsOverTime <- function(expr, env = parent.frame(), quoted = FALSE) {
  if (!quoted) { expr <- substitute(expr) } # force quoted
  htmlwidgets::shinyRenderWidget(expr, safetyResultsOverTimeOutput, env, quoted = TRUE)
}
