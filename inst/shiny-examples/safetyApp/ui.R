library(safetyexploreR)

ui = fluidPage(
  theme = shinythemes::shinytheme("readable"),
  
  titlePanel("Safety Explorer Shiny App"),
  sidebarLayout(
    sidebarPanel(
      div(style="display:inline-block",textInput('study', 'Enter your Study Name'),width=6),
      div(style="display:inline-block",actionButton("goButton", "Enter")),
      loadDataUI('datafile1','Upload AE data', accept=c('.csv', '.sas7bdat')),
      loadDataUI('datafile2','Upload LABs/VITALS data', accept=c('.csv', '.sas7bdat')),
      downloadButton("report", "Generate report"),
      br(),
      br(),
      bookmarkButton(id = 'bookmark',label = 'Save the state of this page')
      #reportUI('reportDL')
    ),
    mainPanel(
      h1(textOutput("study", container = span)),
      safetyWidgetsUI(id='widgets')
    )
  )
  )

