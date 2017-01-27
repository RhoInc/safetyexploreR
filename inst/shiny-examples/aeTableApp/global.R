library(haven)
library(shinyjs)
library(tidyverse)
library(plotly)

## source modules
source('modules/downloadReport.R')

## enable bookmarkable state
enableBookmarking(store = "url")