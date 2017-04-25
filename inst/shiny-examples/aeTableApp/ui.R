library(safetyexploreR)

navbarPage("AE Explorer Shiny App",
           theme = shinythemes::shinytheme("lumen"),  
           tabPanel("Main",
                    sidebarLayout(
                      sidebarPanel(
                        width=3,
                        radioButtons('dataButton',NULL, c('Use example data', 'Upload your own data set')),
                        conditionalPanel(
                          condition = "input.dataButton=='Upload your own data set'",
                          fileInput('datafile','Upload a file',accept = c('.sas7bdat','.csv'))
                        ),
                        selectInput("id_col","Participant ID", choices=NULL),
                        selectInput("major_col","Higher-level term", choices=NULL),
                        selectInput("minor_col","Lower-level term", choices=NULL),
                        selectInput("group_col","Group column", choices=NULL),
                        selectInput("groups","Groups", choices=NULL, multiple=T),
                        div(style="display: inline-block;width: 170px;", 
                            selectInput("filters_ptcpt_col","Participant Filters",choices=NULL, multiple=T)
                        ),
                        div(style="display: inline-block;width: 170px;", 
                            selectInput("filters_event_col","Event Filters",choices=NULL, multiple=T)
                        ),
                      #  selectInput("filters_ptcpt_col","Participant Filters",choices=NULL, multiple=T),
                      #  selectInput("filters_event_col","Event Filters",choices=NULL, multiple=T),
                        selectInput("details_col","Variables to include in details listing",choices=NULL, multiple=T),
                        selectInput("missingValues","Value for missing AEs",
                                    choices=c('empty string','NA','N/A'), selected=c('empty string','NA','N/A'), multiple=T),
                        div(style="display: inline-block;width: 100px;", 
                          numericInput("plotSettings_h","Height of points", value=1, min=0, max=10, step=0.2, width=100)
                          ),
                        div(style="display: inline-block;width: 100px;", 
                          numericInput("plotSettings_w","Width of points", value=1, min=0, max=10, step=0.2, width=200)
                        ),
                        div(style="display: inline-block;width: 100px;", 
                          numericInput("plotSettings_r","Radius of points", value=1, min=0, max=10, step=0.2, width=200)
                        ),
                       checkboxInput('report','Create Report'),
                        conditionalPanel(
                          condition="input.report==true",
                          textInput("study","Enter study name"),
                          downloadButton("reportDL", "Generate report")
                        )
                      ),
                      mainPanel(
                        tabsetPanel( 
                          tabPanel("AE Explorer",  
                                   fluidRow(column(12, style="font-weight:'bold'",                        
                                                   conditionalPanel(
                                                     condition="output.fileUploaded",
                                                     checkboxGroupInput("show","Choose outcome:",
                                                                        choices = c("Preferred Terms","Total Column","Difference Column"),
                                                                        selected = c("Total Column","Difference Column"),
                                                                        inline=T)
                                                   ))),
                                   fluidRow(column(12, aeExplorerOutput(outputId = 'ae1')))
                                   ),
                          tabPanel("Data view", div(DT::dataTableOutput("dt1"), style = "font-size: 70%; width: 50%")),
                          tabPanel("Visualize Differences", plotlyOutput('bubbleplot', height='450px', width='1100px'))
                          
                        )
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

