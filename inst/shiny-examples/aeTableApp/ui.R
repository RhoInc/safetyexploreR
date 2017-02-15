library(safetyexploreR)

ui = fluidPage(
  theme = shinythemes::shinytheme("lumen"),  
 # shinythemes::themeSelector(),
  titlePanel("AE Explorer Shiny App"),
  sidebarLayout(
    sidebarPanel(
      width=3,
      checkboxInput('example', 'Use Example Data'),
      fileInput('datafile','Upload a file',accept = c('.sas7bdat','.csv')),
      tags$script('
        Shiny.addCustomMessageHandler("resetFileInputHandler", function(x) {      
            var id = "#" + x + "_progress";
            var idBar = id + " .bar";
            $(id).css("visibility", "hidden");
            $(idBar).css("width", "0%");
        });
      '),

      uiOutput("id"),
      uiOutput("major"),
      uiOutput("minor"),
      uiOutput("group"),
       uiOutput("groups") ,
      conditionalPanel(
        condition="output.fileUploaded",
        selectInput("totalCol","Show total",c("Show","Hide"), selected='Show', width=200),
        selectInput("diffCol","Show differences",c("Show","Hide"), selected='Show', width=200),
        selectInput("prefTerms","Show preferred terms",c("Show","Hide"), selected='Hide', width=200),
        sliderInput("maxPrevalence","Prevalence threshold", min=0, max=100, step=5, value=0)
      ),
      uiOutput("filters"),
     textInput("study","Enter study name"),
     downloadReportUI("reportDL"),
     br(),
     br(),
     bookmarkButton(id = 'bookmark',label = 'Save the state of this page')
    ),
    mainPanel(
    #  h1(textOutput("study", container = span)),
      tabsetPanel( 
        tabPanel("AE Explorer",  
              #   aeExplorerOutput(outputId = 'ae1')),
             #  fluidRow(column(3, selectInput("totalCol","Show total",c("Show","Hide"), selected='Show'))),
              #          column(3, selectInput("diffCol","Show differences",c("Show","Hide"), selected='Show'))),
              #          column(3, offset=0, selectInput("prefTerms","Show preferred terms",c("Show","Hide"), selected='Hide'))),
               #         column(3, offset=0, uiOutput("filters"))),
             # fluidRow(column(12, div(aeExplorerOutput(outputId = 'ae1'), style="width:70%")))),
             fluidRow(column(12, aeExplorerOutput(outputId = 'ae1')))),
        tabPanel("Data view", div(DT::dataTableOutput("dt1"), style = "font-size: 70%; width: 50%")),
        tabPanel("Visualize Differences", plotlyOutput('bubbleplot', height='450px', width='1100px'))
        
      )
    )
  )
)

