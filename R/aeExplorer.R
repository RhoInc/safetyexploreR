#' Create an AE Explorer widget
#'
#' This function creates an interactive AE Table using R htmlwidgets.  
#'
#' @param data  A data frame containing the Adverse Events data.  
#' @param id_col   Participant ID variable name. Default is \code{"USUBJID"}.
#' @param major_col Higher-level term variable name.  Default is \code{"AEBODSYS"}.
#' @param minor_col Lower-level term variable name.  Default is \code{"AEDECOD"}. 
#' @param group_col  Group variable name, each value of which displays in its own column in the AE table unless argument \code{groups} is defined. Default is \code{"ARM"}.
#' @param groups An option character vector specifying which values to display as columns for variable specified in \code{groups}.  If left as \code{NULL}, all groups will be displayed.
#' @param details_col Optional vector of variable names to include in details listing.
#' @param filters_ptcpt_col,filters_ptcpt_label Participant-level filters. See details.
#' @param filters_event_col,filters_event_label Event-level filters. See details.
#' @param missingValues A character vector specifying the value of missing AEs.  Defaults to \code{ c('','NA','N/A')}.
#' @param showTotalCol Specify whether or not to render a total column. Accepts \code{TRUE} (default) or \code{FALSE}. 
#' @param showDiffCol Specify whether or not to render a column of graphical differences. Accepts \code{TRUE} (default) or \code{FALSE}. 
#' @param showPrefTerms Specify whether or not to initially display all lower-level rows. Accepts \code{"TRUE"} or \code{"FALSE"} (default).  
#' @param maxPrevalence Filters out any higher- and lower-level rows without at least one group rate above specified value. Default is \code{0}.
#' @param maxGroups Number of maximum allowable unique values for variable specified in \code{group}.
#' @param plotSettings_h Adjust height of plotted points by adjusting a ratio of the original pixel value. Default is \code{1} (or 15 px).
#' @param plotSettings_w Adjust width of plotted points by adjusting a ratio of the original pixel value. Default is \code{1} (or 200 px).
#' @param plotSettings_r Adjust radius of plotted points by adjusting a ratio of the original pixel value. Default is \code{1} (or 7 px).
#' @param plotSettings_diffMargin Numeric vector specifying the left and right margins for the difference diamonds plot. default is \code{c(5,5)}.
#' @param validation Experimental setting that facilitates creating a comma-delimited data set of the current view of the data.  Default is \code{FALSE}.
#' @param width Width in pixels.
#' @param height Height in pixels.
#' @param elementId The element ID for the widget.
#'
#' @details 
#' \describe{
#'   \item{filters}{
#'   There are 4 arguments through which a user can specify filters on a participant and/or event level. 
#'   If no label is specified, the variable name will be used.  
#'   The default is 4 event-level filters.  If these filters are not desired, or the default variables do not exist
#'   in dataset, the event level filters must be set to NULL by the user.
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
#' aeExplorer(data=ADAE, group_col="ARM", filters_ptcpt_col = c('SEX','RACE'))
#' }
#'    
#' @seealso aeTimelines, safetyHistogram, safetyOutlierExplorer, safetyResultsOverTime, safetyShiftPlot
#' @source AE Explorer: \url{https://github.com/RhoInc/aeexplorer}.
#' 
#' @import htmlwidgets
#'
#' @export
aeExplorer <- function(data, 
                       id_col = "USUBJID",
                       major_col ="AEBODSYS",
                       minor_col = "AEDECOD",
                       group_col = "ARM",
                       groups = NULL, 
                       details_col = NULL, 
                       filters_ptcpt_col = NULL,
                       filters_ptcpt_label = NULL,
                       filters_event_col =  c('AESER','AESEV','AEREL','AEOUT'),
                       filters_event_label = c('Serious?','Severity','Relationship','Outcome'),
                       missingValues = c('','NA','N/A'),
                       showTotalCol = TRUE,
                       showDiffCol = TRUE,
                       showPrefTerms = FALSE,
                       maxPrevalence = 0,
                       maxGroups = 6, 
                       plotSettings_h = 1, 
                       plotSettings_w = 1,
                       plotSettings_r = 1,
                       plotSettings_diffMargin = c(5, 5),  
                       validation = FALSE,
                       width = NULL, height = NULL, elementId = NULL) {

  
  
  # create array of objects format for json - FILTERS
  if (is.null(filters_ptcpt_label)) {filters_ptcpt_label <- filters_ptcpt_col} 
  if (is.null(filters_event_label)) {filters_event_label <- filters_event_col}
  
  if (!is.null(filters_ptcpt_col) & is.null(filters_event_col)){
    filters_ptcpt <- data.frame(value_col = filters_ptcpt_col, label = filters_ptcpt_label, type = 'participant')
    filters_event <- NULL
  } else if(is.null(filters_ptcpt_col) & ! is.null(filters_event_col)){
    filters_ptcpt <- NULL
    filters_event <- data.frame(value_col = filters_event_col, label = filters_event_label, type = 'event')
  } else if(! is.null(filters_ptcpt_col) & ! is.null(filters_event_col)){
    filters_ptcpt <- data.frame(value_col = filters_ptcpt_col, label = filters_ptcpt_label, type = 'participant')
    filters_event <- data.frame(value_col = filters_event_col, label = filters_event_label, type = 'event')
  }else {
    filters_ptcpt <- NULL
    filters_event <- NULL
  }
 
  filters <- rbind(filters_ptcpt, filters_event)
  if (is.null(filters)){
    filters <- list()
  }
  

  # create key/value pair format for json - groups 
  if (!is.null(groups)){
    groups_l <- list() 
    for(i in 1:length(groups)){
      groups_l[[i]] <- list(key=groups[i])
    }
  }else{
    groups_l <- list()
  }
  
  # create object format for json - MISSING VALS 
  missingValues <- list(value_col = major_col, values=missingValues)
  
  
  # create object format for json - MARGINS
 # plotSettings_margin <- list(left=plotSettings_margin[1], right=plotSettings_margin[2])
  plotSettings_diffMargin <- list(left=plotSettings_diffMargin[1], right=plotSettings_diffMargin[2])
  
  
  # force array format for json - DETAILS
  if(!is.null(details_col)){
    if(length(details_col)==1){
      details_col_array <- list(details_col)
    } else {
      details_col_array <- details_col
    }
  } else {
    details_col_array <- NULL
  }
   
  
  # forward options using x
  x = list(
    data=data,
    settings=jsonlite::toJSON(
      list(
      variables=list(id=id_col,
                     major=major_col,
                     minor=minor_col,
                     group=group_col,
                     details=details_col_array,
                     filters=filters
                    ),
       groups=groups_l, 
       defaults=list(totalCol=showTotalCol,
                     diffCol=showDiffCol,
                     prefTerms=showPrefTerms,
                     maxPrevalence=maxPrevalence,
                     maxGroups = maxGroups, 
                     placeholderFlag = missingValues),
      plotSettings=list(h=plotSettings_h*15,
                        w=plotSettings_w*200, 
                      #  margin=plotSettings_margin,
                        diffMargin=plotSettings_diffMargin,
                        r=plotSettings_r*7),
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
