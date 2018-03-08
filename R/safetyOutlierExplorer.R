#' Create a Safety Outlier Explorer widget
#'
#' This function creates a Safety Outlier Explorer using R htmlwidgets.  
#'
#' @param data A data frame containing the labs data. 
#' @param id_col   Participant ID variable name. Default is \code{"USUBJID"}.
#' @param time_col Timing of collection variable name(s).  Up to 3 may be specified. Default is \code{c("VISIT","DY")}.
#' @param time_type Scale types for variables specified in \code{time_col}.  Defaults to \code{c("ordinal","linear")}.
#' @param time_label Labels of variables specified in \code{time_col}. Defaults to \code{c("Visit","Study Day")}. If set to \code{NULL}, variable names will be used for labels.
#' @param time_order_col Optional numeric variable with values corresponding to order of values for \code{time_col}. Should be set to \code{"null"} for linear variables.  Defaults to \code{"VISITNUM","NULL"}  
#' @param time_rotate_tick_labels Rotate x-axis tick labels 45 degrees?  Defaults to \code{c(TRUE, FALSE)}.
#' @param time_vertical_space X-axis padding for rotated labels in pixels. Defaults to \code{c(100, 0)}.
#' @param measure_col  Name of measure variable name. Default is \code{"TEST"}.
#' @param value_col   Value of measure variable name. Default is \code{"STRESN"}.
#' @param unit_col   Unit of measure variable name. Default is \code{"STRESU"}.
#' @param normal_col_low   Optional: Variable name for column containing lower limit of normal values. Default is \code{"STNRLO"}.
#' @param normal_col_high  Optional: Variable name for column containing upper limit of normal values. Default is \code{"STNRHI"}.
#' @param start_value Value of variable defined in \code{measure_col} to be rendered in the plot when the widget loads. 
#' @param filters_col Optional vector of variable names to use for filters  (in addition to default filter on \code{measure}).  
#' @param filters_label Associated labels to use for filters. If left as \code{NULL}, variable names will be used as labels. 
#' @param details_col Optional vector of variable names to include in details listing. Defaults to \code{'AGE'}, \code{'SEX'}, and \code{'RACE'}.
#' @param details_label Associated labels/headers to use for details listing. Defaults to \code{'Age'}, \code{'Sex'}, and \code{'Race'}.  If set to \code{NULL}, variable names will be used as labels. 
#' @param multiples_sizing_width Adjust width of small multiple plots by adjusting a ratio of the original pixel value. Default is 1 (or 300 px).
#' @param multiples_sizing_height Adjust height of  small multiple plots by adjusting a ratio of the original pixel value. Default is 1 (or 100 px).
#' @param visits_without_data Option to display visits without data. Defaults to \code{FALSE}.
#' @param unscheduled_visits Option to display unscheduled visits (values of \code{time_col} containing "unscheduled" or "early termination").. Defaults to \code{FALSE}.
#' @param width Width in pixels 
#' @param height Height in pixels  
#' @param elementId The element ID for the widget.
#'
#' @examples
#' \dontrun{
#' # Run Safety Outlier Explorer with defaults
#' safetyOutlierExplorer(data=ADBDS) 
#' 
#' # Run Safety Outlier Explorer with some customizations
#' safetyOutlierExplorer(data=ADBDS, filters_col = c('ARM','SEX','RACE')) 
#' }
#' 
#' @seealso aeExplorer, aeTimelines, safetyHistogram, safetyResultsOverTime, safetyShiftPlot
#' @source Safety Outlier Explorer: \url{https://github.com/RhoInc/safety-outlier-explorer}.
#'
#' @import htmlwidgets
#'
#' @export
safetyOutlierExplorer <- function(data, 
                                  id_col = "USUBJID",
                                  time_col = c("VISITN","DY"),
                                  time_type = c("ordinal","linear"),
                                  time_label = c("VISIT","STUDY DAY"),
                                  time_order_col = c("VISITNUM","null"),
                                  time_rotate_tick_labels = c(TRUE, FALSE),
                                  time_vertical_space = c(100, 0), 
                                  measure_col = "TEST",
                                  value_col = "STRESN",
                                  unit_col = "STRESU",
                                  normal_col_low ="STNRLO", 
                                  normal_col_high = "STNRHI", 
                                  start_value = NULL,
                                  filters_col = NULL, 
                                  filters_label = NULL,
                                  details_col = c('AGE','SEX','RACE'),
                                  details_label = c('Age','Sex','Race'),
                                  multiples_sizing_width = 1,
                                  multiples_sizing_height = 1,
                                  visits_without_data = FALSE,
                                  unscheduled_visits = FALSE,
                                  width = NULL, height = NULL, elementId = NULL) {

  
  # create array of objects format for json - time cols
  time_cols <- data.frame(value_col = time_col, 
                              type = time_type,
                              label = time_label,  
                             # order = time_order_col,
                              rotate_tick_labels = time_rotate_tick_labels,
                              vertical_space = time_vertical_space)
  
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
        time_cols = time_cols, 
        measure_col = measure_col,
        value_col = value_col,
        unit_col = unit_col,
        normal_col_low = normal_col_low,
        normal_col_high = normal_col_high,
        start_value = start_value,
        filters = I(filters),
        details = I(details),
        multiples_sizing = list(
          width = multiples_sizing_width*300,
          height = multiples_sizing_height*100
        ),
        visits_without_data = visits_without_data,
        unscheduled_visits = unscheduled_visits
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
