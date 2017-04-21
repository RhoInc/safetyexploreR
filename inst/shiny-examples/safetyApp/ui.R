
ui = navbarPage("Safety Explorer Shiny App",
  theme = shinythemes::shinytheme("lumen"),
  
  tabPanel("Main",
  sidebarLayout(
    sidebarPanel(width=3,
      checkboxInput('example', 'Use Example Data'),
      fileInput('datafile1','Upload adverse events data', accept=c('.csv', '.sas7bdat')),
      fileInput('datafile2','Upload labs & vital signs data', accept=c('.csv', '.sas7bdat')),
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
      )
    ),
    mainPanel(
      h1(textOutput("study", container = span)),
      safetyWidgetsUI(id='widgets')
    )
  )
  ),
  tabPanel("About",
           fluidRow(
             tags$style(type='text/css', '#about {font-size:23px;}'),
             column(width=12, style='font-size:20px', uiOutput(outputId = "about")) 
           )
           )
)

