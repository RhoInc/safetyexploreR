library(safetyexploreR)

ui = fluidPage(
  theme = shinythemes::shinytheme("lumen"),
  
  titlePanel("Safety Explorer Shiny App"),
  sidebarLayout(
    sidebarPanel(
      checkboxInput('example', 'Use Example Data'),
      loadDataUI('datafile1','Upload adverse events data', accept=c('.csv', '.sas7bdat')),
      loadDataUI('datafile2','Upload labs & vital signs data', accept=c('.csv', '.sas7bdat')),
      checkboxInput('report','Create Report'),
      conditionalPanel(
        condition="input.report==true",
        textInput('study', 'Enter Study Name'),
        textAreaInput('text1', 'Enter text for AE Explorer'),
        textAreaInput('text2', 'Enter text for AE Timelines'),
        textAreaInput('text3', 'Enter text for Safety Histogram'),
        textAreaInput('text4', 'Enter text for Safety Outlier Explorer'),
        textAreaInput('text5', 'Enter text for Safety Results Over Time'),
        textAreaInput('text6', 'Enter text for Safety Shift Plot'),
        downloadButton("reportDL", "Generate report")
      ),
      br(),
      br(),
      bookmarkButton(id = 'bookmark',label = 'Save the state of this page')
    ),
    mainPanel(
      h1(textOutput("study", container = span)),
      safetyWidgetsUI(id='widgets')
    )
  )
  )

