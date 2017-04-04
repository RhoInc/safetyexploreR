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
#' @param placeholderFlag A character vector specifying the value of missing AEs.  Defaults to \code{c(NA,'')}.
#' @param filters_ptcpt_var,filters_ptcpt_var Participant-level filters. See details.
#' @param filters_event_var,filters_event_var Event-level filters. See details.
#' @param groups An option character vector specifying which values to display as columns for variable specified in \code{groups}.  If left as \code{NULL}, all groups will be displayed.
#' @param totalCol Specify whether or not to render a total column. Accepts \code{TRUE} (default) or \code{FALSE}. 
#' @param diffCol Specify whether or not to render a column of graphical differences. Accepts \code{TRUE} (default) or \code{FALSE}. 
#' @param prefTerms Specify whether or not to initially display all lower-level rows. Accepts \code{"TRUE"} or \code{"FALSE"} (default).  
#' @param maxPrevalence Filters out any higher- and lower-level rows without at least one group rate above specified value. Default is \code{0}.
#' @param maxGroups Number of maximum allowable unique values for variable specified in \code{group}.
#' @param h Adjust height of plotted points by adjusting a ratio of the original pixel value. Default is 1 (or 15 px).
#' @param w Adjust width of plotted points by adjusting a ratio of the original pixel value. Default is 1 (or 200 px).
#' @param r Adjust r of plotted points by adjusting a ratio of the original pixel value. Default is 1 (or 7 px).
#' @param margin Numeric vector specfiying the left and right margins for the dot plot.
#' @param diffMargin Numeric vector specifying the left and right margins for the difference diamonds plot.
#' @param validation Experimental setting that facilitates creating a comma-delimited data set of the current view of the data.  Default is \code{FALSE}.
#' @param width Width in pixels.
#' @param height Height in pixels.
#' @param elementId The element ID for the widget.
#'
#' @details 
#' \describe{
#'   \item{filters}{
#'   There are 4 arguments through which a user can specify filters on a participant and/or event level. 
#'   At least 1 filter is required. If no label is specified, the variable name will be used.  
#'   The default is 4 event-level filters.
#'   }
#' }
#'
#'
#' @examples
#' \dontrun{
#' # Run AE Explorer with defaults
#' aeExplorer(data=ADAE)
#' 
#' # Run AE Explore with some customizations 
#' aeExplorer(data=ADAE, group="ARM", groups=c('Treatment A','Placebo'))
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
                       filters_ptcpt_var = NULL,
                       filters_ptcpt_label = NULL,
                       filters_event_var =  c('AESER','AESEV','AEREL','AEOUT'),
                       filters_event_label = c('Serious?','Severity','Relationship','Outcome'),
                       groups = NULL, 
                       placeholderFlag = c('NA',''),
                       filters = NULL, 
                       totalCol = TRUE,
                       diffCol = TRUE,
                       prefTerms = FALSE,
                       maxPrevalence = 0,
                       maxGroups = 6, 
                       h = 1, 
                       w = 1,
                       r = 1,
                       margin = c(40, 40), 
                       diffMargin = c(5, 5),  
                       validation = FALSE,
                       width = NULL, height = NULL, elementId = NULL) {

  
  
  # create data.frame format for json - FILTERS
  if (!is.null(filters_ptcpt_var)){
    if (! is.null(filters_ptcpt_label)){
      filters_ptcpt <- data.frame(value_col = filters_ptcpt_var, label = filters_ptcpt_label, type = 'participant')
    }
    else {
      filters_ptcpt <- data.frame(value_col = filters_ptcpt_var, label = filters_ptcpt_var, type = 'participant')
    }
  } else {
    filters_ptcpt <- NULL
    
    if (!is.null(filters_event_var)){
      if (! is.null(filters_event_label)){
        filters_event <- data.frame(value_col = filters_event_var, label = filters_event_label, type = 'event')
      }
      else {
        filters_event <- data.frame(value_col = filters_event_var, label = filters_event_var, type = 'event')
      }
    } else {
      filters_event <- NULL
    } 
  }

  filters <- rbind(filters_ptcpt, filters_event)

  # create data.frame format for json - groups 
  if (!is.null(groups)){
    groups_l <- list() 
    for(i in 1:length(groups)){
      groups_l[[i]] <- list(key=groups[i])
    }
  }else{
    groups_l <- NULL
  }
  
  # create data.frame format for json - MISSING VALS 
  placeholderFlag <- list(value_col = major, values=placeholderFlag)
  
  
  # create data.frame format for json - MARGINS
  margin <- list(left=margin[1], right=margin[2])
  diffMargin <- list(left=diffMargin[1], right=diffMargin[2])
  
  
  
  # forward options using x
  x = list(
    data=data,
    settings=jsonlite::toJSON(
      list(
      variables=list(id=id,
                     major=major,
                     minor=minor,
                     group=group,
                     details=I(details),
                     filters=I(filters)
                    ),
       groups=I(groups_l), 
       defaults=list(totalCol=totalCol,
                     diffCol=diffCol,
                     prefTerms=prefTerms,
                     maxPrevalence=maxPrevalence,
                     maxGroups = maxGroups, 
                     placeholderFlag = placeholderFlag),
      plotSettings=list(h=h*15,
                        w=w*200, 
                        margin=margin,
                        diffMargin=diffMargin,
                        r=r*7),
      validation=validation
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
