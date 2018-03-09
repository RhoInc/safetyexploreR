#' Adverse events sample data
#'
#' A dataset containing simulated adverse events data.  The structure is 1 record per adverse event per participant.
#'
#' @format A data frame with 402 rows and 21 variables:
#' \describe{
#'   \item{USUBJID}{Unique participant ID}
#'   \item{SITEID}{Site ID - numeric}
#'   \item{SITE}{Site ID - character}
#'   \item{AGE}{Age}
#'   \item{SEX}{Sex}
#'   \item{RACE}{Race}
#'   \item{ARM}{Adverse event reported term}
#'   \item{RFSTDTC}{Participant enroll date}
#'   \item{SAFFL}{Safety population flag}
#'   \item{ASTDT}{AE start date}
#'   \item{ASTDY}{Study day of AE start}
#'   \item{AENDT}{AE end date}
#'   \item{AENDY}{Study day of AE end}
#'   \item{AETERM}{Reported term of adverse event}
#'   \item{AEDECOD}{Adverse event minor category}
#'   \item{AEBODSYS}{Adverse event major category}
#'   \item{AESER}{Serious}
#'   \item{AEONGO}{}
#'   \item{AESEV}{Severity}
#'   \item{AEREL}{Relationship}
#'   \item{AEOUT}{Outcome}
#'   \item{AESEQ}{Seq number}
#'   
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
#'   \item{SITEID}{Site ID - numeric}
#'   \item{SITE}{Site ID - character}
#'   \item{AGE}{Age}
#'   \item{SEX}{Sex}
#'   \item{RACE}{Race}
#'   \item{ARM}{Study arm}
#'   \item{RFSTDTC}{Participant enroll date}
#'   \item{SAFFL}{Safety population}
#'   \item{VISIT}{Visit}
#'   \item{VISITNUM}{Visit Number}
#'   \item{VISITN}{Visit Number}
#'   \item{DT}{Date}
#'   \item{DY}{Study day}
#'   \item{CAT}{Specimen}
#'   \item{TEST}{Measure}
#'   \item{STRESU}{Measure units}
#'   \item{STRESN}{Value}
#'   \item{STNRLO}{Lower limit of normal}
#'   \item{STNRHI}{Upper limit of normal}

#' }
#' @source \url{https://github.com/RhoInc/viz-library}
"ADBDS"

