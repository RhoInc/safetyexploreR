#' Create a Safety Results Over Time widget
#'
#' This function creates a Safety Results Over Time widget using R htmlwidgets.  
#'
#' @param data A data frame containing the labs data. 
#' @param id   Participant ID variable name. Default is \code{"USUBJID"}.
#' @param time_var Timing of collection variable name. Default is \code{c("VISITN")}.
#' @param time_label Label of variable specified in \code{time_var}. Defaults to \code{c('Visit Number')}. If set to \code{NULL}, variable name will be used for labels.
#' @param time_order Option to specify order of x-axis using a character vector.
#' @param time_label_rot Rotate x-axis tick labels 45 degrees?  Defaults to \code{FALSE}.
#' @param time_label_padding X-axis padding for rotated labels in pixels. Defaults to \code{0}.
#' @param measure  Name of measure variable name. Default is \code{"TEST"}.
#' @param value   Value of measure variable name. Default is \code{"STRESN"}.
#' @param unit   Unit of measure variable name. Default is \code{"STRESU"}.
#' @param normal_low   Variable name for column containing lower limit of normal values. Default is \code{"STNRLO"}.
#' @param normal_high   Variable name for column containing upper limit of normal values. Default is \code{"STNRHI"}.
#' @param start_value Value of variable defined in \code{measure} to be rendered in the plot when the widget loads. 
#' @param groups_var Optional: name of column(s) to include as options for chart stratification.  Default is \code{"NONE"}.
#' @param groups_label Optional label for stratification variable(s).  Default is \code{"None"}. If set to \code{NULL}, variable name will be used as label.
#' @param filters_var Optional vector of variable names to use for filters
#' @param filters_label Associated labels to use for filters. If left as \code{NULL}, variable names will be used as labels. 
#' @param missingValues A vector of values found in \code{value} to be ignored when rendering the chat. Default is \code{c('','NA','N/A')}.
#' @param boxplots Logical indicating whether to render boxplots.  Default is \code{TRUE}.
#' @param violins Logical indicating whether to render violin plots.  Default is \code{FALSE}.
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
#' safetyResultsOverTime(data=ADBDS, groups_var=c("SEX","RACE","ARM"), boxplots=T, violins=T)
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
                                  time_var = "VISITN",
                                  time_label = "Visit Number",
                                  time_order = NULL,
                                  time_label_rot =  FALSE,
                                  time_label_padding = 0,
                                  measure = "TEST",
                                  value = "STRESN",
                                  unit = "STRESU",
                                  normal_low ="STNRLO", 
                                  normal_high = "STNRHI", 
                                  start_value = NULL,
                                  groups_var = "NONE",
                                  groups_label = "None",
                                  filters_var = NULL, 
                                  filters_label = NULL,
                                  missingValues = c('','NA','N/A'),
                                  boxplots = TRUE,
                                  violins = FALSE,
                                  width = NULL, height = NULL, elementId = NULL) {

  
  # create object format for json - time settings
  if (!is.null(time_order)){
    time_settings <- list(value_col = time_var, 
                                label = time_label, 
                                order = as.character(time_order),
                                rotate_tick_labels = time_label_rot,
                                vertical_space = time_label_padding)
  } else{
    time_settings <- list(value_col = time_var, 
                                label = time_label,
                                rotate_tick_labels = time_label_rot,
                                vertical_space = time_label_padding)
  }

  
  # create array of objects format for json - groups
  if (!is.null(groups_label)){
    groups <- data.frame(value_col = groups_var, label = groups_label)    
  } else{
    groups <- data.frame(value_col = groups_var, label = groups_var)    
  }
  
  # create array of objects format for json - filters
  if (!is.null(filters_label)){
    filters <- data.frame(value_col = filters_var, label = filters_label)
  } else{
    filters <- data.frame(value_col = filters_var, label = filters_var)    
  }
  
  
  # forward options using x
  x = list(
    data = data,
    settings = jsonlite::toJSON(
      list(
        id_col = id, 
        time_settings = time_settings, 
        measure_col = measure,
        value_col = value,
        unit_col = unit,
        normal_col_low = normal_low,
        normal_col_high = normal_high,
        groups = groups,
        filters = I(filters),
        start_value = start_value,
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
