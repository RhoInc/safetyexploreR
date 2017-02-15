library(safetyexploreR)

server = function(input, output, session){
  
  datafile <- reactive({
  
    if(is.null(input$datafile)){
      return(NULL)
    }else{
      input$datafile
    }
  })
  
  
  myData <- reactive({		
      
    validate(
      need(! is.null(datafile()) | input$example,'')
    )
    

    if(input$example){
        return(ADAE)
      }
    else {
      if (length(grep(".csv", datafile(), ignore.case = TRUE)) > 0){
            return(
                data.frame(read.csv(datafile()$datapath, na.strings=NA))
                )
          }else if(length(grep(".sas7bdat", datafile(), ignore.case = TRUE)) > 0){
            return(
              data.frame(
                haven::read_sas(datafile()$datapath) 
              ))
          }
      }  
    })


  output$fileUploaded <- reactive({
    return(!is.null(myData()))
  })
  outputOptions(output, 'fileUploaded', suspendWhenHidden=FALSE)
  
  observe({
    input$example
    session$sendCustomMessage(type = "resetFileInputHandler", "datafile")  
  })
  observeEvent(!is.null(input$datafile), { 
    shinyjs::reset("example")
  })

  output$id <- renderUI({
    selectInput("id","Subject ID",names(myData()), selected=ifelse(sum(grepl("USUBJID", names(myData())))>0, 
                                                                  "USUBJID",names(myData())[1]) , 
                width=200)
  })
  output$major <- renderUI({
    selectInput("major","Higher-level term",names(myData()), selected=ifelse(sum(grepl("AEBODSYS", names(myData())))>0, 
                                                                            "AEBODSYS",names(myData())[1]), 
                width=200 )
  })
  output$minor <- renderUI({
    selectInput("minor","Level-level term",names(myData()), selected=ifelse(sum(grepl("AEDECOD", names(myData())))>0, 
                                                                           "AEDECOD",names(myData())[1]), 
                width=200)
  })
  output$group <- renderUI({
    selectInput("group","Group",names(myData()), selected=ifelse(sum(grepl("ARM", names(myData())))>0, 
                                                                "ARM",names(myData())[1]), 
                width=200)
  })

  output$filters <- renderUI({
    selectizeInput("filters","Filters",names(myData()), multiple=T, selected=NULL,  width=200)
  })

  id <- reactive({
    validate(
      need(!is.null(input$id), '')
    )
    input$id
  })
  major <- reactive({
    validate(
      need(!is.null(input$major), '')
    )
    input$major
  })
  minor <- reactive({
    validate(
      need(!is.null(input$minor), '')
    )
    input$minor
  })
  group <- reactive({
    validate(
      need(!is.null(input$group), '')
    )
    input$group
  })
  groups <- reactive({
    validate(
      need(!is.null(input$groups) | is.null(input$groups), '')
    )
    input$groups
  })
  filters <- reactive({
    validate(
      need(!is.null(input$filters) | is.null(input$filters), '')
    )
    input$filters
  })
  totalCol <- reactive({
    validate(
      need(!is.null(input$totalCol), '')
    )
    input$totalCol
  })
  diffCol <- reactive({
    validate(
      need(!is.null(input$diffCol), '')
    )
    input$diffCol
  })
  prefTerms <- reactive({
    validate(
      need(!is.null(input$prefTerms), '')
    )
    input$prefTerms
  })
  
  maxPrevalence <- reactive({
    validate(
      need(!is.null(input$maxPrevalence), '')
    )
    input$maxPrevalence
  })
  
    output$groups <- renderUI({
      selectizeInput("groups","Groups",choices=unique(myData()[,group()]), 
                     selected=unique(myData()[,group()]), 
                     multiple=T, width=200)
    })
  
    output$ae1 <- renderAeExplorer({
      groups <- NULL
      groups <- list()
      if(!is.null(groups())){
        for(i in 1:length(groups())){
          groups[[i]] <- list(key=groups()[i])
        }
      }
      
      filters <- NULL
      filters <- list()
      if(!is.null(filters())){
        for(i in 1:length(filters())){
          filters[[i]] <- list(value_col=filters()[i], label=filters()[i])
        }
      }
      
      aeExplorer(data = myData(), id=id(), major=major(), minor=minor(), group=group(),
                groups=groups,
                filters=filters,
                totalCol = totalCol(), 
                diffCol=diffCol(), 
                prefTerms=prefTerms(),
                maxPrevalence=maxPrevalence())
     }
     )
     
     output$dt1 <- DT::renderDataTable({
       DT::datatable(data = myData())
     }) 
     
     
     output$bubbleplot <- renderPlotly({
       filtered <- myData()[,c(id(), major(), minor(), group())]
       names(filtered) <- c('id','major','minor', 'group')
       filtered <- subset(filtered, group %in% groups())
       
       major_only <- filtered %>%
         mutate(minor=NA) %>%
         group_by(group) %>%
         mutate(tot = length(unique(id))) %>%
         group_by(id, major) %>%
         unique %>%
         group_by(major, group) %>%
         mutate(n = n(),
                m = tot-n) %>%
         ungroup %>%
         mutate(p = 100*n/tot,
                o = 100-p) %>%
         select(-id) %>%
         unique %>%
         filter(!major=='NA') %>%
         mutate(major_only=1)
       
       
       major_minor <-filtered %>%
         group_by(group) %>%
         mutate(tot = length(unique(id))) %>%
         group_by(id, major, minor) %>%
         unique %>%
         group_by(major, minor, group) %>%
         mutate(n = n(),
                m = tot-n) %>%
         ungroup %>%
         mutate(p = 100*n/tot,
                o = 100-p) %>%
         select(-id) %>%
         unique %>%
         filter(!major=='NA' & ! minor=='NA') %>%
         mutate(major_only=0)
       
       
       
       stack <- rbind(major_only, major_minor) %>% 
         arrange(desc(group)) %>% 
         group_by(major, minor) %>% 
         mutate(n_groups = n()) %>% 
         filter(! major == '')
       
       testf <- function(x){
         x <- x %>% arrange(desc(group))
         out <- data.frame(comparison=NULL, group1 =NULL, group2 = NULL, diff=NULL, test=NULL)
         n <- 1
         
         for (i in seq_along(x$group)){
           if(x$n_groups[1]>1){
             if(i<length(x$group)){
               group1 <- x$group[i]
               group2 <- x$group[i+1] 
             }
             if(i==length(x$group)){
               group1 <- x$group[1]
               group2 <- x$group[i] 
             }
             
             sub <- x[x$group==group1 | x$group==group2,]
             
             out[n, 'comparison'] <- paste0(group1,' vs. ', group2)
             out[n, 'group1'] <- paste(group1)
             out[n, 'group2'] <- paste(group2)
             out[n, 'test'] <- fisher.test(rbind(sub$m, sub$n))$p.value
             out[n, 'diff'] <- sub$p[1] - sub$p[2]
           }else{
             out[n, 'comparison'] <- NA
             out[n, 'group1'] <- NA
             out[n, 'group2'] <- NA
             out[n, 'test'] <- NA
             out[n, 'diff'] <- NA
           }
           n <- n+1
         }
         
         return(out)
       }
       
       res <- stack %>%
         group_by(major_only, major, minor) %>%
         filter(length(unique(group))>1) %>%
         arrange(desc(group)) %>% 
         nest() %>%
         mutate(out = map(data, ~testf(.))) %>%
         select(-data) %>% 
         unnest %>%
         mutate(test_transf = -log10(test)) %>%
         mutate(label = ifelse(major_only==1, paste0(major), paste0(major, ': ', minor))) 
       
       req(nrow(res) > 0)
      #  
      #  g <- res %>% filter(major_only==0 & !is.na(test_transf)) %>%
      #    ggplot(data=., aes(x=diff, y=test_transf, label=label, size = diff, color=diff)) +
      #     facet_wrap(~comparison, scales='free_y') +
      #    geom_point() +
      #    scale_size(range=range(res$diff)) +
      #    scale_fill_distiller()+
      #    labs(y='-log10(p-value)',
      #         x='Risk difference (%)') +
      #    theme_bw() +
      #    theme(legend.position='bottom')
      # 
      # ggplotly(g, tooltip = c('label'))
         numplots <- length(unique(res$comparison))
         plot_list <- vector("list", numplots)
         title_list = vector("list", numplots)
         for (i in unique(res$comparison)){
           plot_list[i] <-  plot_ly(data=subset(res, comparison==i),
                               x=~diff, y=~test_transf, type='scatter', mode='markers',
                               text=~label, hoverinfo='text',
                                color=~diff, colors='Spectral',
                               marker = list(size=~diff, opacity=0.7)) %>%
             layout(showlegend = FALSE) %>% 
             hide_colorbar() %>%  
             layout(xaxis=list(title=paste0(i,': Risk Diff')),
                    yaxis=list(title='-log10(P-value)'))
            
          # title_list[i] <- list(text=paste(i)
   
         }
         plot_list <- plot_list[!sapply(plot_list, is.null)] 
         sp <- subplot(plot_list, nrows=1, shareX=F, shareY=T, titleX=T) 
  
        sp

      
     
     
     })
     
    study <- reactive({
  #   validate(need(!is.NULL(input$study)), '')
      input$study
    })
     # produce report from input text and data files
     callModule(downloadReport, "reportDL", data=myData, study=study)  
     
     # Need to exclude the buttons from themselves being bookmarked
     setBookmarkExclude(c("bookmark1", "bookmark2"))
     # Trigger bookmarking with either button
     observeEvent(input$bookmark, {
       session$doBookmark()
     })
}