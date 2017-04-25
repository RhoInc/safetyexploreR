#' Adverse events sample data
#'
#' A dataset containing simulated adverse events data.  The structure is 1 record per adverse event per participant.
#'
#' @format A data frame with 402 rows and 21 variables:
#' \describe{
#'   \item{USUBJID}{Unique participant ID}
#'   \item{AEBODSYS}{Adverse event major category}
#'   \item{AEDECOD}{Adverse event minor category}
#'   \item{ARM}{Adverse event reported term}
#'   \item{SEX}{Sex}
#'   \item{RACE}{Race}
#'   \item{AGE}{Age}
#'   \item{RFSTDTC}{Participant enroll date}
#'   \item{SAFFL}{Safety population flag}
#'   \item{AEPTCD}{AE preferred term code}
#'   \item{AETERM}{Reported term of adverse event}
#'   \item{ASTDY}{Study day of AE start}
#'   \item{AENDY}{Study day of AE end}
#'   \item{AESER}{Serious}
#'   \item{AESEV}{Severity}
#'   \item{AEREL}{Relationship}
#'   \item{AEOUT}{Outcome}
#'   \item{AESTDT}{AE start date}
#'   \item{AEENDT}{AE end date}
#'   \item{AESEQ}{Seq number}
#'   \item{SITEID}{Site ID}
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
#'   \item{STRESN}{Value}
#'   \item{VISITN}{Visit number}
#'   \item{VISIT}{Visit}
#'   \item{DY}{Study day}
#'   \item{DT}{Date}
#'   \item{AGE}{Age}
#'   \item{SEX}{Sex}
#'   \item{RACE}{Race}
#'   \item{ARM}{Study arm}
#'   \item{RFSTDTC}{}
#'   \item{SAFFL}{Safety population}
#'   \item{CAT}{Specimen}
#'   \item{STNRLO}{Lower limit of normal}
#'   \item{STNRHI}{Upper limit of normal}
#'   \item{STRESU}{Measure units}
#'   \item{SITEID}{Site ID}
#' }
#' @source \url{https://github.com/RhoInc/viz-library}
"ADBDS"

