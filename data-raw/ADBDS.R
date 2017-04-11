URL <- "https://raw.githubusercontent.com/RhoInc/viz-library/master/examples/0000-sample-data/safetyData/ADBDS.csv"
download.file(url=URL,
              destfile='data-raw/ADBDS.csv', method='auto')

ADBDS <- read.csv('data-raw/ADBDS.csv')

save(ADBDS, file = "data/ADBDS.rdata")
