#' Create an AE Timelines widget
#'
#' This function creates an AE Timeline using R htmlwidgets.  
#'
#' @param data A data frame containing the Adverse Events data.  
#' @param id   Participant ID variable name. Default is \code{"USUBJID"}.
#' @param seq  Adverse event sequence number variable name.  Default is \code{"SESEQ"}
#' @param major Higher-level term variable name.  Default is \code{"AEBODSYS"}.
#' @param minor Lower-level term variable name.  Default is \code{"AEDECOD"}. 
#' @param start Study day of AE start. Default is \code{"ASTDY"}.
#' @param end Study day of AE end. Default is \code{"AENDY"}.
#' @param severity Adverse event severity variable name. Default is \code{"AESEV"}.
#' @param related Adverse event relatedness to treatment variable name. Default is \code{"AEREL"}
#' @param details Optional vector of variable names to include in details listing.
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
                        major = "AEBODSYS",
                        minor = "AEDECOD",
                        start = "ASTDY",
                        end = "AENDY",
                        severity = "AESEV",
                        related = "AEREL",
                        details = NULL, 
                        width = NULL, height = NULL, elementId = NULL) {

  # forward options using x
  x = list(
    data=data,
    settings=jsonlite::toJSON(
      list(
        id_col=id,
        seq_col=seq,
        soc_col=major,
        term_col=minor,
        stdy_col=start,
        endy_col=end,
        sev_col=severity,
        rel_col=related,
     #   filter_cols = I(filters),
        detail_cols = I(details)
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
