#' Create an AE Timelines widget
#'
#' This function creates an AE Timeline using R htmlwidgets.  
#'
#' @param data A data frame containing the Adverse Events data.  
#' @param id   Participant ID variable name. Default is \code{"USUBJID"}.
#' @param seq  Adverse event sequence number variable name.  Default is \code{"SESEQ"}
#' @param minor Lower-level term variable name.  Default is \code{"AEDECOD"}. 
#' @param start Study day of AE start. Default is \code{"ASTDY"}.
#' @param end Study day of AE end. Default is \code{"AENDY"}. 
#' @param color_var Name of variable that defines the color scale with its values. Default is \code{"AESEV"}.
#' @param color_label Legend label for color scale. Default is \code{"Severity/Intensity"}.
#' @param color_val Distinct ordering of values for color scale.  If left as \code{NULL}, all non-missing values will be used in alphabetical order.
#' @param color_codes Vector of HTML color codes to use.
#' @param highlight_var Name of variable that identifies specific adverse events that should be highlighted. Default is \code{'AESER'}.
#' @param highlight_label Legend label for highlighting. Default is \code{'Serious Event'}.
#' @param highlight_val Value of \code{highlight_var} which designates events to highlight.
#' @param highlight_detail Name of variable that describes event in more detail.
#' @param highlight_stroke, highlight_stroke_width, highlight_fill Attributes of highlighted events.
#' @param filters_var Columns to use for filters.  Defaults to \code{c('AESER','AESEV','USUBJID')}.
#' @param filters_label Associated labels to use for filters. If set to \code{NULL}, variable name(s) will be used.  Defaults to \code{c('Serious Event','Severity/Intensity','Subject Identifier')}. 
#' @param details_var Optional vector of variable names to include in details listing.
#' @param details_label Associated labels/headers to use for details listing.
#' @param width Width in pixels 
#' @param height Height in pixels  
#' @param elementId The element ID for the widget.
#'
#' @examples
#' \dontrun{
#' # Run AE Timeline with defaults
#' aeTimelines(data=ADAE)
#' 
#' # Run AE Timeline with some customizations 
#' aeTimelines(data=ADAE, details = c('ARM','SEX','RACE'))
#' }
#' 
#' @seealso aeExplorer, safetyHistogram, safetyOutlierExplorer, safetyResultsOverTime, safetyShiftPlot
#' @source AE Timelines: \url{https://github.com/RhoInc/ae-timelines}.
#' 
#' @import htmlwidgets
#'
#' @export
aeTimelines <- function(data, 
                        id = "USUBJID",
                        seq = "AESEQ",
                        minor = "AEDECOD",
                        start = "ASTDY",
                        end = "AENDY",
                        severity = "AESEV",
                        color_var = "AESEV",
                        color_label = "Severity/Intensity",
                        color_val = NULL,
                        color_codes = NULL, 
                        highlight_var = "AESER",
                        highlight_label = "Serious Event",
                        highlight_val = "Y",
                        highlight_detail = NULL,
                        highlight_stroke = "black",
                        highlight_stroke_width = 2,
                        highlight_fill = 'none',
                        filters_var = c('AESER','AESEV','USUBJID'),
                        filters_label = c('Serious Event','Severity/Intensity','Subject Identifier'),
                        details_var = NULL, 
                        details_label = NULL, 
                        width = NULL, height = NULL, elementId = NULL) {

  
  # create list format for json - colors
  if (is.null(color_codes)){
    cols <- c('#66bd63','#fdae61','#d73027','#377eb8','#984ea3','#ff7f00','#a65628','#f781bf','#999999')
  } else {
    cols <- color_codes
  }
  if (is.null(color_val)){
    vals <- levels(as.factor(data[,color_var]))[which(! levels(as.factor(data[,color_var])) %in% c('NA',''))]
  } else{
    vals <- color_val
  }
  color <- list(value_col = color_var, 
                  label = color_label, 
                  values = vals, 
                  colors = cols)

  
  # create list format for json - highlight
  highlight <- list(value_col = highlight_var, 
                    label = highlight_label,
                    value = highlight_val,
                    detail_col = highlight_detail,
                    attributes = list(stroke = highlight_stroke,
                                      `stroke-width` = highlight_stroke_width,
                                      fill = highlight_fill))
  
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
    data=data,
    settings=jsonlite::toJSON(
      list(
        id_col=id,
        seq_col=seq,
        term_col=minor,
        stdy_col=start,
        endy_col=end,
        color = color,
        highlight = highlight,
        filters = I(filters),
        details = I(details)
        ),
    null="null", auto_unbox=T
  )
  )

  # create widget
  htmlwidgets::createWidget(
    name = 'aeTimelines',
    x,
    width = width,
    height = height,
    package = 'safetyexploreR',
    elementId = elementId
  )
}

#' Shiny bindings for aeTimelines
#'
#' Output and render functions for using aeTimelines within Shiny
#' applications and interactive Rmd documents.
#'
#' @param outputId output variable to read from
#' @param width,height Must be a valid CSS unit (like \code{'100\%'},
#'   \code{'400px'}, \code{'auto'}) or a number, which will be coerced to a
#'   string and have \code{'px'} appended.
#' @param expr An expression that generates a aeTimelines
#' @param env The environment in which to evaluate \code{expr}.
#' @param quoted Is \code{expr} a quoted expression (with \code{quote()})? This
#'   is useful if you want to save an expression in a variable.
#'
#' @name aeTimelines-shiny
#'
#' @export
aeTimelinesOutput <- function(outputId, width = '100%', height = '400px'){
  htmlwidgets::shinyWidgetOutput(outputId, 'aeTimelines', width, height, package = 'safetyexploreR')
}

#' @rdname aeTimelines-shiny
#' @export
renderAeTimelines <- function(expr, env = parent.frame(), quoted = FALSE) {
  if (!quoted) { expr <- substitute(expr) } # force quoted
  htmlwidgets::shinyRenderWidget(expr, aeTimelinesOutput, env, quoted = TRUE)
}
