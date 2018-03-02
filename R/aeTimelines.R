#' Create an AE Timelines widget
#'
#' This function creates an AE Timeline using R htmlwidgets.  
#'
#' @param data A data frame containing the Adverse Events data.  
#' @param id_col   Participant ID variable name. Default is \code{"USUBJID"}.
#' @param seq_col  Adverse event sequence number variable name.  Default is \code{"SESEQ"}
#' @param term_col Column name corresponding to reported term of the adverse event.  Default is \code{"AETERM"}. 
#' @param stdy_col Study day of AE start. Default is \code{"ASTDY"}.
#' @param endy_col Study day of AE end. Default is \code{"AENDY"}. 
#' @param color_col Name of variable that defines the color scale with its values. Default is \code{"AESEV"}.
#' @param color_label Legend label for color scale. Default is \code{"Severity/Intensity"}.
#' @param color_values Distinct ordering of values for color scale.  If left as \code{NULL}, all non-missing values will be used in alphabetical order.
#' @param color_codes Vector of HTML color codes to use.
#' @param highlight_col Name of variable that identifies specific adverse events that should be highlighted. Default is \code{'AESER'}.
#' @param highlight_label Legend label for highlighting. Default is \code{'Serious Event'}.
#' @param highlight_value Value of \code{highlight_col} which designates events to highlight.
#' @param highlight_detail_col Name of variable that describes event in more detail.
#' @param highlight_stroke Attributes of highlighted events.
#' @param highlight_stroke_width Attributes of highlighted events.
#' @param highlight_fill Attributes of highlighted events.
#' @param filters_col Columns to use for filters.  Defaults to \code{c('AESER','AESEV','USUBJID')}.
#' @param filters_label Associated labels to use for filters. If set to \code{NULL}, variable name(s) will be used.  Defaults to \code{c('Serious Event','Severity/Intensity','Subject Identifier')}. 
#' @param details_col Optional vector of variable names to include in details listing.
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
#' aeTimelines(data=ADAE, details_col = c('ARM','SEX','RACE'))
#' }
#' 
#' @seealso aeExplorer, safetyHistogram, safetyOutlierExplorer, safetyResultsOverTime, safetyShiftPlot
#' @source AE Timelines: \url{https://github.com/RhoInc/ae-timelines}.
#' 
#' @import htmlwidgets
#'
#' @export
aeTimelines <- function(data, 
                        id_col = "USUBJID",
                        seq_col = "AESEQ",
                        term_col = "AEDECOD",
                        stdy_col = "ASTDY",
                        endy_col = "AENDY",
                        color_col = "AESEV",
                        color_label = "Severity/Intensity",
                        color_values = NULL,
                        color_codes = NULL, 
                        highlight_col = "AESER",
                        highlight_label = "Serious Event",
                        highlight_value = "Y",
                        highlight_detail_col = NULL,
                        highlight_stroke = "black",
                        highlight_stroke_width = 2,
                        highlight_fill = 'none',
                        filters_col = c('AESER','AESEV','USUBJID'),
                        filters_label = c('Serious Event','Severity/Intensity','Subject Identifier'),
                        details_col = NULL, 
                        details_label = NULL, 
                        width = NULL, height = NULL, elementId = NULL) {

  
  # create object format for json - colors
  if (is.null(color_codes)){
    cols <- c('#66bd63','#fdae61','#d73027','#377eb8','#984ea3','#ff7f00','#a65628','#f781bf','#999999')
  } else {
    cols <- color_codes
  }
  if (is.null(color_values)){
    vals <- levels(as.factor(data[,color_col]))[which(! levels(as.factor(data[,color_col])) %in% c('NA',''))]
  } else{
    vals <- color_values
  }
  color <- list(value_col = color_col, 
                  label = color_label, 
                  values = vals, 
                  colors = cols)

  
  # create object format for json - highlight
  highlight <- list(value_col = highlight_col, 
                    label = highlight_label,
                    value = highlight_value,
                    detail_col = highlight_detail_col,
                    attributes = list(stroke = highlight_stroke,
                                      `stroke-width` = highlight_stroke_width,
                                      fill = highlight_fill))
  
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
  
  # coerce NA to "NA"
  data[is.na(data)] <- "NA" 

  
  # forward options using x
  x = list(
    data=data,
    settings=jsonlite::toJSON(
      list(
        id_col=id_col,
        seq_col=seq_col,
        term_col=term_col,
        stdy_col=stdy_col,
        endy_col=endy_col,
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
