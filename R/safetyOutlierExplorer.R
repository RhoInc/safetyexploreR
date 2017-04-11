#' Create a Safety Outlier Explorer widget
#'
#' This function creates a Safety Outlier Explorer using R htmlwidgets.  
#'
#' @param data A data frame containing the labs data. 
#' @param id   Participant ID variable name. Default is \code{"USUBJID"}.
#' @param time_var Timing of collection variable name(s).  Up to 3 may be specified. Default is \code{c("DY","VISITN","VISIT")}.
#' @param time_type Scale types for variables specified in \code{time_var}.  Defaults to \code{c('linear','ordinal','ordinal')}.
#' @param time_label Labels of variables specified in \code{time_var}. Defaults to \code{c('Study Day','Visit Number','Visit')}. If set to \code{NULL}, variable names will be used for labels.
#' @param time_label_rot Rotate x-axis tick labels 45 degrees?  Defaults to \code{c(FALSE, FALSE, TRUE)}.
#' @param time_label_padding X-axis padding for rotated labels in pixels. Defaults to \code{c(0, 0, 100)}.
#' @param measure  Name of measure variable name. Default is \code{"TEST"}.
#' @param value   Value of measure variable name. Default is \code{"STRESN"}.
#' @param unit   Unit of measure variable name. Default is \code{"STRESU"}.
#' @param normal_low   Optional: Variable name for column containing lower limit of normal values. Default is \code{"STNRLO"}.
#' @param normal_high  Optional: Variable name for column containing upper limit of normal values. Default is \code{"STNRHI"}.
#' @param start_value Value of variable defined in \code{measure} to be rendered in the plot when the widget loads. 
#' @param filters_var Optional vector of variable names to use for filters  (in addition to default filter on \code{measure}).  
#' @param filters_label Associated labels to use for filters. If left as \code{NULL}, variable names will be used as labels. 
#' @param details_var Optional vector of variable names to include in details listing. Defaults to \code{'AGE'}, \code{'SEX'}, and \code{'RACE'}.
#' @param details_label Associated labels/headers to use for details listing. Defaults to \code{'Age'}, \code{'Sex'}, and \code{'Race'}.  If set to \code{NULL}, variable names will be used as labels. 
#' @param multiples_width Adjust width of small multiple plots by adjusting a ratio of the original pixel value. Default is 1 (or 300 px).
#' @param multiples_height Adjust height of  small multiple plots by adjusting a ratio of the original pixel value. Default is 1 (or 100 px).
#' @param width Width in pixels 
#' @param height Height in pixels  
#' @param elementId The element ID for the widget.
#'
#' @examples
#' \dontrun{
#' # Run Safety Outlier Explorer with defaults
#' safetyOutlierExplorer(data=ADBS) 
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
                                  time_var = c("DY","VISITN","VISIT"),
                                  time_type = c('linear','ordinal','ordinal'),
                                  time_label = c('Study Day','Visit Number','Visit'),
                                  time_label_rot = c(FALSE, FALSE, TRUE),
                                  time_label_padding = c(0, 0, 100), 
                                  measure = "TEST",
                                  value = "STRESN",
                                  unit = "STRESU",
                                  normal_low ="STNRLO", 
                                  normal_high = "STNRHI", 
                                  start_value = NULL,
                                  filters_var = NULL, 
                                  filters_label = NULL,
                                  details_var = c('AGE','SEX','RACE'),
                                  details_label = c('Age','Sex','Race'),
                                  multiples_width = 1,
                                  multiples_height = 1,
                                  width = NULL, height = NULL, elementId = NULL) {

  
  # create list format for json - time settings
  time_settings <- data.frame(value_col = time_var, 
                              type = time_type,
                              label = time_label,  
                              rotate_tick_labels = time_label_rot,
                              vertical_space = time_label_padding)
  
  # create list format for json - filters
  if (!is.null(filters_label)){
    filters <- data.frame(value_col = filters_var, label = filters_var)
  } else{
    filters <- data.frame(value_col = filters_var, label = filters_label)    
  }
  
  # create list format for json - details
  if (!is.null(details_label)){
    details <- data.frame(value_col = details_var, label = details_var)    
  } else{
    details <- data.frame(value_col = details_var, label = details_label)    
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
        start_value = start_value,
        filters = I(filters),
        details = I(details),
        multiples_sizing = list(
          width = multiples_width*300,
          height = multiples_height*100
        )
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
