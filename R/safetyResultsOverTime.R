#' Create a Safety Results Over Time widget
#'
#' This function creates a Safety Results Over Time widget using R htmlwidgets.  
#'
#' @param data A data frame containing the labs data. 
#' @param id_col   Participant ID variable name. Default is \code{"USUBJID"}.
#' @param time_col Timing of collection variable name. Default is \code{c("VISIT")}.
#' @param time_label Label of variable specified in \code{time_col}. Defaults to \code{c('Visit')}. If set to \code{NULL}, variable name will be used for labels.
#' @param time_order_col Optional numeric variable with values corresponding to order of values for \code{time_col}. Defaults to \code{"VISITNUM"}  
#' @param time_order Option to specify order of x-axis using a character vector.
#' @param time_rotate_tick_labels Rotate x-axis tick labels 45 degrees?  Defaults to \code{FALSE}.
#' @param time_vertical_space X-axis padding for rotated labels in pixels. Defaults to \code{0}.
#' @param measure_col  Name of measure variable name. Default is \code{"TEST"}.
#' @param value_col   Value of measure variable name. Default is \code{"STRESN"}.
#' @param unit_col   Unit of measure variable name. Default is \code{"STRESU"}.
#' @param normal_col_low   Variable name for column containing lower limit of normal values. Default is \code{"STNRLO"}.
#' @param normal_col_high   Variable name for column containing upper limit of normal values. Default is \code{"STNRHI"}.
#' @param start_value Value of variable defined in \code{measure_col} to be rendered in the plot when the widget loads. 
#' @param groups_col Optional: name of column(s) to include as options for chart stratification.  Default is \code{NULL}.
#' @param groups_label Optional label for stratification variable(s).  Default is \code{NULL}. If set to \code{NULL} and \code{groups_col} is specified, variable name will be used as label.
#' @param filters_col Optional vector of variable names to use for filters
#' @param filters_label Associated labels to use for filters. If left as \code{NULL}, variable names will be used as labels. 
#' @param missingValues A vector of values found in \code{value_col} to be ignored when rendering the chat. Default is \code{c('','NA','N/A')}.
#' @param boxplots Logical indicating whether to render boxplots.  Default is \code{TRUE}.
#' @param violins Logical indicating whether to render violin plots.  Default is \code{FALSE}.
#' @param visits_without_data Option to display visits without data. Defaults to \code{FALSE}.
#' @param unscheduled_visits Option to display unscheduled visits (values of \code{time_col} containing "unscheduled" or "early termination").. Defaults to \code{FALSE}.
#' @param width Width in pixels 
#' @param width Width in pixels 
#' @param height Height in pixels  
#' @param elementId The element ID for the widget.
#'
#' @examples
#' \dontrun{
#' # Run Safety Histogram with defaults
#' safetyResultsOverTime(data=ADBDS)
#' 
#' # Run Safety Histogram with some customizations 
#' safetyResultsOverTime(data=ADBDS, groups_col=c("SEX","RACE","ARM"), boxplots=T, violins=T)
#' }
#' 
#' @seealso aeExplorer, aeTimelines, safetyHistogram, safetyOutlierExplorer, safetyShiftPlot
#' @source Safety Results Over Time: \url{https://github.com/RhoInc/safety-results-over-time}.
#'
#' @import htmlwidgets
#'
#' @export
safetyResultsOverTime <- function(data, 
                                  id_col = "USUBJID",
                                  time_col = "VISIT",
                                  time_label = "Visit",
                                  time_order_col = "VISITNUM",
                                  time_order = NULL,
                                  time_rotate_tick_labels =  FALSE,
                                  time_vertical_space = 0,
                                  measure_col = "TEST",
                                  value_col = "STRESN",
                                  unit_col = "STRESU",
                                  normal_col_low ="STNRLO", 
                                  normal_col_high = "STNRHI", 
                                  start_value = NULL,
                                  groups_col = NULL,
                                  groups_label = NULL,
                                  filters_col = NULL, 
                                  filters_label = NULL,
                                  missingValues = c('','NA','N/A'),
                                  boxplots = TRUE,
                                  violins = FALSE,
                                  visits_without_data = FALSE,
                                  unscheduled_visits = FALSE,
                                  width = NULL, height = NULL, elementId = NULL) {

  
  # create object format for json - time settings
  if (!is.null(time_order)){
    time_settings <- list(value_col = time_col, 
                                label = time_label, 
                                order = as.character(time_order),
                                order_col = time_order_col,
                                rotate_tick_labels = time_rotate_tick_labels,
                                vertical_space = time_vertical_space)
  } else{
    time_settings <- list(value_col = time_col, 
                                label = time_label,
                                order = time_order,
                                order_col = time_order_col,
                                rotate_tick_labels = time_rotate_tick_labels,
                                vertical_space = time_vertical_space)
  }

  
  # create array of objects format for json - groups
  if (!is.null(groups_label)){
    groups <- data.frame(value_col = groups_col, label = groups_label)    
  } else{
    groups <- data.frame(value_col = groups_col, label = groups_col)    
  }
  
  # create array of objects format for json - filters
  if (!is.null(filters_label)){
    filters <- data.frame(value_col = filters_col, label = filters_label)
  } else{
    filters <- data.frame(value_col = filters_col, label = filters_col)    
  }
  
  # coerce NA to "NA"
  if ('NA' %in% missingValues){
    data[is.na(data)] <- "NA" 
  }
  
  # forward options using x
  x = list(
    data = data,
    settings = jsonlite::toJSON(
      list(
        id_col = id_col, 
        time_settings = time_settings, 
        measure_col = measure_col,
        value_col = value_col,
        unit_col = unit_col,
        normal_col_low = normal_col_low,
        normal_col_high = normal_col_high,
        groups = groups,
        filters = I(filters),
        start_value = start_value,
        missingValues = missingValues,
        boxplots = boxplots,
        violins = violins,
        visits_without_data = visits_without_data,
        unscheduled_visits = unscheduled_visits 
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
