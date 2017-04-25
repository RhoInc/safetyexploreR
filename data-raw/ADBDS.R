URL <- "https://raw.githubusercontent.com/RhoInc/viz-library/master/data/safetyData/ADBDS.csv"
download.file(url=URL,
              destfile='data-raw/ADBDS.csv', method='auto')

ADBDS <- read.csv('data-raw/ADBDS.csv')

## remove non-ASCII strings
levels(ADBDS$STRESU)[levels(ADBDS$STRESU)=="°C"] <- 'degrees C'
levels(ADBDS$STRESU)[levels(ADBDS$STRESU)=="µmol/L"] <- 'umol/L'
levels(ADBDS$STRESU)[levels(ADBDS$STRESU)=="µkat/L"] <- 'ukat/L'

save(ADBDS, file = "data/ADBDS.rdata")
