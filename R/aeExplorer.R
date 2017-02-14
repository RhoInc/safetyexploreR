#' Create an AE Explorer widget
#'
#' This function creates an AE Explorer using R htmlwidgets.  
#'
#' @param data  A data frame containing the Adverse Events data.  
#' @param id   Participant ID variable name. Default is \code{"USUBJID"}.
#' @param major Higher-level term variable name.  Default is \code{"AEBODSYS"}.
#' @param minor Lower-level term variable name.  Default is \code{"AEDECOD"}. 
#' @param group  Group variable name, each value of which displays in its own column in the AE table unless argument \code{groups} is defined. Default is \code{"ARM"}.
#' @param details An optional vector of variables to display in the detail listing.  If left as \code{NULL} or unspecified, all variables in input data will appear in detail listing.
#' @param groups An optional character vector specifying which groups to display. If left as \code{NULL} or unspecified, all classes from \code{group} variable will be shown
#' @param filters  An optional list containing individual lists for each desired filter.  
#' To specify a  filter, two arguments (\code{value_col} and \code{label}) are required.   
#' (e.g. \code{filters = list(list(value_col = "AESER", label = "Serious?"), list(value_col = "SEX", label = "Participant Sex"))})
#' @param totalCol Specify whether or not to render a total column. Accepts \code{"Show"} (default) or \code{"Hide"}. 
#' @param diffCol Specify whether or not to render a column of graphical differences. Accepts \code{"Show"} (default) or \code{"Hide"}. 
#' @param prefTerms Specify whether or not to initially display all lower-level rows. Accepts \code{"Show"} or \code{"Hide"} (default).  
#' @param maxPrevalence Filters out any higher- and lower-level rows without at least one group rate above specified value. Default is \code{0}.
#' @param width Width in pixels.
#' @param height Height in pixels.
#' @param elementId The element ID for the widget.
#'
#' @examples
#' \dontrun{
#' # Run AE Explorer with defaults
#' aeExplorer(data=ADAE)
#' 
#' # Run AE Explore with some customizations 
#' aeExplorer(data=ADAE, group="SEX", filters=list(list(value_col = "ARM", label = "Treatment Arm")), diffCol="Hide")
#' }
#'    
#' @seealso aeTimelines, safetyHistogram, safetyOutlierExplorer, safetyResultsOverTime, safetyShiftPlot
#' @source AE Explorer: \url{https://github.com/RhoInc/aeexplorer}.
#' 
#' @import htmlwidgets
#'
#' @export
aeExplorer <- function(data, 
                       id = "USUBJID",
                       major ="AEBODSYS",
                       minor = "AEDECOD",
                       group = "ARM",
                       details = NULL, 
                       groups = NULL, 
                       filters = NULL, 
                       totalCol = "Show",
                       diffCol = "Show",
                       prefTerms = "Hide",
                       maxPrevalence = 0,
                       width = NULL, height = NULL, elementId = NULL) {
  
  # forward options using x
  x = list(
    data=data,
    settings=jsonlite::toJSON(
      list(
      variables=list(id=id,
                     major=major,
                     minor=minor,
                     group=group,
                     details=I(details)
                    ),
       groups=I(groups),
       filters=I(filters),
       defaults=list(totalCol=totalCol,
                     diffCol=diffCol,
                     prefTerms=prefTerms,
                     maxPrevalence=maxPrevalence)
    ),
    null="null", auto_unbox=T
    )
  )

  # create widget
  htmlwidgets::createWidget(
    name = 'aeExplorer',
    x,
    width = width,
    height = height,
    package = 'safetyexploreR',
    elementId = elementId
  )
}



#' Shiny bindings for aeExplorer
#'
#' Output and render functions for using aeExplorer within Shiny
#' applications and interactive Rmd documents.
#'
#' @param outputId output variable to read from
#' @param width,height Must be a valid CSS unit (like \code{'100\%'},
#'   \code{'400px'}, \code{'auto'}) or a number, which will be coerced to a
#'   string and have \code{'px'} appended.
#' @param expr An expression that generates a aeExplorer
#' @param env The environment in which to evaluate \code{expr}.
#' @param quoted Is \code{expr} a quoted expression (with \code{quote()})? This
#'   is useful if you want to save an expression in a variable.
#'
#' @name aeExplorer-shiny
#'
#' @export
aeExplorerOutput <- function(outputId, width = '100%', height = '400px'){
  htmlwidgets::shinyWidgetOutput(outputId, 'aeExplorer', width, height, package = 'safetyexploreR')
}

#' @rdname aeExplorer-shiny
#' @export
renderAeExplorer <- function(expr, env = parent.frame(), quoted = FALSE) {
  if (!quoted) { expr <- substitute(expr) } # force quoted
  htmlwidgets::shinyRenderWidget(expr, aeExplorerOutput, env, quoted = TRUE)
}
