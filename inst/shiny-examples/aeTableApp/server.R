library(safetyexploreR)

server = function(input, output, session){
  
  ## data upload ----
  datafile <-  reactive({
    
    if(is.null(input$datafile)){
      return(NULL)
    }else{
      input$datafile
    }
  })
  
  ## Create reactive data based on data upload OR example data selection ----
  myData <-  reactive({	
    
    validate(
      need(! is.null(datafile()) | input$dataButton=='Use example data','')
    )
    
    if(input$dataButton == 'Use example data'){
      return(data.frame(ADAE))
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
      }else{return(NULL)}
    }  
  })

  
  ## selections for AE Explorer ----
  observe({
    dd <- myData()
    
    isolate({
      choices_major <- setdiff(names(dd), c(input$id_col))
      choices_minor <- setdiff(names(dd), c(input$id_col, input$major_col))
      choices_group <- setdiff(names(dd), c(input$id_col, input$major_col, input$minor_col))
    })
    
    updateSelectInput(session, inputId = 'id_col', choices = names(dd), 
                      selected = ifelse(sum(grepl("USUBJID", names(dd)))>0, "USUBJID",names(dd)[1]))
    updateSelectInput(session, inputId = 'major_col', choices = choices_major, 
                      selected = ifelse(sum(grepl("AEBODSYS", names(dd)))>0, "AEBODSYS",choices_major[1]))
    updateSelectInput(session, inputId = 'minor_col', choices = choices_minor, 
                      selected = ifelse(sum(grepl("AEDECOD", names(dd)))>0, "AEDECOD", choices_minor[1]))
    updateSelectInput(session, inputId = 'group_col', choices = choices_group, 
                      selected = ifelse(sum(grepl("ARM", names(dd)))>0, "ARM", choices_group[1]))
    updateSelectInput(session, inputId = 'filters_ptcpt_col', choices = names(dd))
    
    if (sum(c('AESER','AESEV','AEREL','AEOUT') %in% names(dd))==4){
      updateSelectInput(session, inputId = 'filters_event_col', choices = names(dd),
                        selected = c('AESER','AESEV','AEREL','AEOUT')) 
    } else {
      updateSelectInput(session, inputId = 'filters_event_col', choices = names(dd), selected = NULL) 
    }
    
    updateSelectInput(session, inputId = 'details_col', choices = names(dd), selected = NULL) 
  })
  
  choices_groups <- reactive({
    isolate({ dd <- myData() })
    if(! input$group_col==''){
      choices_groups <- unique(dd[,input$group_col])
    } else{
      choices_groups <- NULL
    }
    return(choices_groups)
  })
  
  observe({
    isolate({ dd <- myData() })
    choices_groups()
    
    updateSelectInput(session, inputId = 'groups', choices = choices_groups(), selected = choices_groups())
  })

  
  observe({
    print(input$groups)
    print(input$group_col)
  })
  
  filters_event_label <- reactive({
    if (identical(input$filters_event, c('AESER','AESEV','AEREL','AEOUT'))){
      filters_event_label <- c('Serious?','Severity','Relationship','Outcome')
    } else{
      filters_event_label <- NULL
    }
    
    return(filters_event_label)
  })
  
  
  missingValues <- reactive({
    mv <- input$missingValues
    if ('empty string' %in% mv){
      mv[which(mv=='empty string')] <- ""
    }
    return(mv)
  })
  
  output$fileUploaded <- reactive({
    return(!is.null(myData()))
  })
  
  
  showPrefTerms <- reactive({
    out <- ifelse('Preferred Terms' %in% input$show, T, F)
    return(out)
  })
  showTotalCol <- reactive({
    out <- ifelse('Total Column' %in% input$show, T, F)
    return(out)
  })
  showDiffCol <- reactive({
    out <- ifelse('Difference Column' %in% input$show, T, F)
    return(out)
  })

  
  group_inputs <- reactiveValues(value = NULL)
  observe({
    input$group_col
    if(is.null(input$group_col) || input$group_col == ''){
      group_inputs$val <- NULL 
    }
    else {
      dd <- myData()
      group_inputs$val <- unique(dd[,input$group_col])
    }
  })
  observe({
    input$groups
    group_inputs$val <- input$groups
  })
  
  outputOptions(output, 'fileUploaded', suspendWhenHidden=FALSE)
  
  
  output$ae1 <- safetyexploreR::renderAeExplorer({
    
    validate(
      need(!is.null(myData()),''),
      need(!is.null(input$id_col),''),
      need(!is.null(input$major_col),''),
      need(!is.null(input$minor_col),''),
      need(!is.null(input$group_col),''),
      need(!is.null(input$groups),''),
      need(sum(!c(input$id_col, input$major_col, input$minor_col, input$group_col) %in% names(myData()))==0,'')
    )
  
    
    safetyexploreR::aeExplorer(data = isolate(myData()),
                               id_col = input$id_col,
                               major_col = input$major_col,
                               minor_col = input$minor_col,
                               group_col = input$group_col,
                               filters_ptcpt_col = input$filters_ptcpt_col,
                               filters_ptcpt_label = NULL,
                               filters_event_col = input$filters_event_col,
                               filters_event_label = filters_event_label(),
                               details_col = input$details_col, 
                               groups = group_inputs$val,
                               missingValues = missingValues(),
                               showPrefTerms = showPrefTerms(),
                               showTotalCol = showTotalCol(),
                               showDiffCol = showDiffCol(),
                               plotSettings_h = input$plotSettings_h,
                               plotSettings_w = input$plotSettings_w,
                               plotSettings_r = input$plotSettings_r)
  }
  )
     
 
     output$dt1 <- DT::renderDataTable({
       
       validate(
         need(myData(), '')
       )
       DT::datatable(data = myData(), style="bootstrap", class="compact", width='100%')
     })


     output$bubbleplot <- renderPlotly({
       
       validate(
         need(!is.null(myData()),''),
         need(!is.null(input$id_col),''),
         need(!is.null(input$major_col),''),
         need(!is.null(input$minor_col),''),
         need(!is.null(input$group_col),''),
         need(!is.null(input$groups),''),
         need(sum(!c(input$id_col, input$major_col, input$minor_col, input$group_col) %in% names(myData()))==0,'')
       )
       
       filtered <- myData()[,c(input$id_col, input$major_col, input$minor_col, input$group_col)]
       names(filtered) <- c('id','major','minor', 'group')
       filtered <- subset(filtered, group %in% group_inputs$val)
       res <- NULL

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

         numplots <- NULL
         plot_list <- NULL
         title_list<- NULL
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
             layout(xaxis=list(title=paste0(i,': Risk Diff'),
                               titlefont=list(size=10),
                               tickangle=24,
                               tickfont = list(size=10)),
                    yaxis=list(title='-log10(P-value)'))


         }
         plot_list <- plot_list[!sapply(plot_list, is.null)]
         sp <- subplot(plot_list, nrows=1, shareX=F, shareY=T, titleX=T)

        sp

    })
     
     

     
     observeEvent(input$report==TRUE,
                  { 
                    output$reportDL <- downloadHandler(
                      filename = "ae_report.html",
                      content = function(file) {
                        # Copy the report file to a temporary directory before processing it, in case we don't
                        # have write permissions to the current working dir (which can happen when deployed).
                        tempReport <- file.path(tempdir(), "report.Rmd")
                        file.copy("template/ae_report.Rmd", tempReport, overwrite = TRUE)
                        
                        params <- list(data=myData(), 
                                       study=input$study,
                                       id_col = input$id_col,
                                       major_col = input$major_col,
                                       minor_col = input$minor_col,
                                       group_col = input$group_col,
                                       filters_ptcpt_col = input$filters_ptcpt_col,
                                       filters_event_col = input$filters_event_col,
                                       filters_event_label = filters_event_label(),
                                       details_col = input$details_col,
                                       groups = input$groups, 
                                       missingValues = missingValues(),
                                       showPrefTerms = showPrefTerms(),
                                       showTotalCol = showTotalCol(),
                                       showDiffCol = showDiffCol(),
                                       plotSettings_h = input$plotSettings_h,
                                       plotSettings_w = input$plotSettings_w,
                                       plotSettings_r = input$plotSettings_r)
                        
                        rmarkdown::render(tempReport,
                                          output_file = file,
                                          params = params,  ## pass in params
                                          envir = new.env(parent = globalenv())  ## eval in child of global env
                        )
                      }
                    )
                  })
   
     
     output$about <- renderUI({
       HTML("<h1> <b> About the AE Explorer Shiny App </b> </h1>  
            <p> <code>safetyexploreR</code> is an R package built using the HTML Widgets framework.  
            <code>safetyexploreR</code> serves as an interface for 
            <a href='http://github.com/RhoInc'> Rho's </a>safety explorer suite, 
            a set of tools facilitating the exploration of adverse events, lab and 
            vital sign data.  The underlying tools are built using 
            <a href='http://openresearchsoftware.metajnl.com/articles/10.5334/jors.127/'>Webcharts</a>, a JavaScript 
            library based on D3.</p>  
            <p> This shiny app allows the user to interact with the AE Table (sourced from
            <code>safetyexploreR::aeExplorer()</code>) in real time.  The sidebar contains
            a custom data upload, as well as various parameters that the user can play with to customize the table. 
            Additional panels allow the user to further explore the data.</p>
            <p> The <code>safetyexploreR</code> package is being developed on
            <a href='https://github.com/RhoInc/safetyexploreR'>GitHub</a>. Please contact
            <a href='mailto:rebecca_krouse@rhoworld.com?Subject=Longitudinal%20Model%20App'>Becca Krouse</a> 
            with any questions or comments. </p>")
     })
}