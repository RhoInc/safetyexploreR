URL <- "https://raw.githubusercontent.com/RhoInc/viz-library/master/data/safetyData/ADAE.csv"
download.file(url=URL,
              destfile='data-raw/ADAE.csv', method='auto')

ADAE <- read.csv('data-raw/ADAE.csv', stringsAsFactors = FALSE)
ADAE$ASEQ <- NULL 
ADAE$AETERM[grep("pelvic floor", ADAE$AETERM)] <- "Weakness in the pelvic floor"

save(ADAE, file = "data/ADAE.rdata")



