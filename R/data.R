#' Adverse events sample data
#'
#' A dataset containing simulated adverse events data.  The structure is 1 record per adverse event per participant.
#'
#' @format A data frame with 402 rows and 21 variables:
#' \describe{
#'   \item{USUBJID}{Unique participant ID}
#'   \item{AEBODSYS}{Adverse event major category}
#'   \item{AEDCOD}{Adverse event minor category}
#'   \item{ARM}{Adverse event reported term}
#'   ...
#' }
#' @source \url{https://github.com/RhoInc/viz-library}
"ADAE"


#' Safety measures sample data
#'
#' A dataset containing simulated safety data.  The structure is 1 record per measure per visit per participant.
#'
#' @format A data frame with 22695 rows and 18 variables:
#' \describe{
#'   \item{USUBJID}{Unique participant ID}
#'   \item{TEST}{Measure}
#'   \item{VALUE}{Value}
#'   \item{VISITN}{Timing of collection}
#'   ...
#' }
#' @source \url{https://github.com/RhoInc/viz-library}
"ADBDS"

