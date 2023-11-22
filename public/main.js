var lang = 'en';

function localizedValue(key, lang) {
    const pack = localization[lang];
    if (!pack) { return key; }
    return pack[key] || key;
}

function localizeKey(key) {
    const elements = $(`[data-key="${key}"]`);
    const elementCount = elements.length;
    for (let i = 0; i < elementCount; i++) {
        $(elements[i]).html(localizedValue(key, lang));
    }
}

function localizeAll(lan) {
    lang = lan;
    const elements = $('[data-key]');
    const elementCount = elements.length;
    for (let i = 0; i < elementCount; i++) {
        key = $(elements[i]).attr('data-key');
        $(elements[i]).html(localizedValue(key, lan));
    }
}

function onEn() {
    lang = 'en';
    localizeAll(lang);
}

function onGe() {
    lang = 'ge';
    localizeAll(lang);
}

function onFr() {
    lang = 'fr';
    localizeAll(lang);
}

function onIt() {
    lang = 'it';
    localizeAll(lang);
}

$(function() {

    // running events
    var events = [];

    var gameInfo = {};

    var socket = io();

    socket.emit("subscribe", "consumer");

    // Socket events

    // get the current running events information
    socket.on("events", function(data) {
        //console.log("[on] events:" + JSON.stringify(data));
        events = data;

        const ne = str => str.replace(/\d+/g, n => n.padStart(8, "0"));

        events.sort(function(a,b){
            if(a.info.title< b.info.title) return -1;
            if(a.info.title >b.info.title) return 1;
            //if(a.info.eventTitle< b.info.eventTitle) return -1;
            //if(a.info.eventTitle >b.info.eventTitle) return 1;
            //return 0;
            return ne(a.info.eventTitle).localeCompare(ne(b.info.eventTitle));
          });
        /*  
        events.forEach((event) => {
            let disp = "";
            if (event.info.eventing == 1) {
                let dispstrs = ["JUMP", "", "CROSS", "DRESSAGE"]
                disp = "&nbsp;[<span data-key='" + dispstrs[event.info.discipline] + "'>" + dispstrs[event.info.discipline] + "</span>]";
            }
            event.info.eventTitle += disp;
        });
        */


        updateEventList();

        var url = new URL(location.href);
        var c = url.searchParams.get("eventid");

        if (c != "") joinToEvent(c);

    });

    // add new event started
    socket.on("start", function(data) {
        console.log("[on] start:" + JSON.stringify(data));
        events.push(data);
        updateEventList();
    });

    // an event is ended
    socket.on("end", function(data) {
        console.log("[on] end:" + JSON.stringify(data));

        let event = events.find((event) => {
            return (event.id == data.id);
        });

        event.info.live = 0;

        updateEventList();

       // $('#live-ico-' + eventInfo.id).hide();
    });

    // update event info
    socket.on("info", function(data) {
        //console.log('event info', data);

        // set eventInfo
        //eventInfo = data;

        $('#live-ico-' + data.id).show();
    });


    socket.on('connectedUserCount', function(data) {
        $("#connected-count1").html(data);
        $("#connected-count2").html(data);
    });


    socket.on('disconnect', function() {
        console.log('you have been disconnected');
    });

    socket.on('reconnect', function() {
        console.log('you have been reconnected');
        events = [];

        socket.emit("subscribe", "consumer");
    });

    socket.on('reconnect_error', function() {
        console.log('attempt to reconnect has failed');
    });


    ///////////////////////////////////////////////////
    // UI management function


    function formatDate(dateString) {
        var d = new Date(dateString.replace(/\s/, 'T'));

        return ("0" + d.getDate()).slice(-2) + "." + ("0" + (d.getMonth() + 1)).slice(-2) + "." + d.getFullYear();
    }

    function formatSimpleTime(date) {
        return `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
    }



    function updateEventList() {
        $('#live-events').html('');

        for (let i = 0; i < events.length; i++) {
            const event = events[i];

            //if (event.info.eventing == 0) {

                $('#live-events').append($('<tr class="d-flex">'));
                tr = $('#live-events tr:last');
                tr.append($('<td class="col-3">').html("&nbsp"));
                tr.append($('<td class="col-6">').html("&nbsp"));
                tr.append($('<td class="col-date">').html("&nbsp"));
                tr.append($('<td class="col-date">').html("&nbsp"));
                tr.append($('<td class="col-xls">').html("&nbsp"));

                let title = event.info.title + "<span id='live-ico-" + event.id + "' style='display:none; float: right;'><img src='images/giphy.gif' width=60 /></span>";

                tr.children("td:nth-child(1)").html(title);
                //tr.children("td").eq(0).html(title);

                const eventTitle = $('<div></div>');

                if (event.info.discipline == 0) {
                    eventTitle.append("<div class='disp-ico'><img src='images/jumping.png'/></div>");
                } else if (event.info.discipline == 2) {
                    eventTitle.append("<div class='disp-ico'><img src='images/cross.png'/></div>");
                } else if (event.info.discipline == 3) {
                    eventTitle.append("<div class='disp-ico'><img src='images/dressage.png'/></div>");
                }


                eventTitle.append(`<div  class="mb-2">${event.info.eventTitle}</div>`); //style='float:left;'
                // TODO: remove `hidden` class when the estimation calculation is fixed
                const eventProgress = $(`<div class="progress"><div class="progress-bar" role="progressbar" style="width: 70%">35 / 75</div></div> <div class="mt-2 hidden"><span id="event" data-key="ETA">Estimated Time of Completion: </span><span id="eta">11:45</span></div>`);
                if (gameInfo.eventId === event.id) {
                    //console.log('gameinfo = ', gameInfo);
                    eventTitle.append(eventProgress);
                }

                if (event.info.pdfs) {
                    Object.keys(event.info.pdfs).forEach(key => {
                        let pdf_name = event.info.pdfs[key];
                        pdf_name = pdf_name.replace(/\d+_/, "");
                        let pdf = $("<div class='disp-ico' style='clear:both;padding-left:25px;'><img style='width:18px;' src='images/pdf.png'/>&nbsp;" + pdf_name + "</div>");
                        eventTitle.append(pdf);

                        pdf.click(function() {
                            downloadPdf(event.info.pdfs[key]);
                            return false;
                        });  
                    });
                }
               
                tr.children("td:nth-child(2)").html($(eventTitle));
    
                tr.children("td:nth-child(3)").html(formatDate(event.info.startDate));
                tr.children("td:nth-child(4)").html(formatDate(event.info.endDate));
    
                tr.attr("data-ref", event.id);
    
                tr.click(function() {
                    eventId = $(this).attr("data-ref");
                    joinToEvent(eventId);
                });  
                
                if (event.info.live == 1)
                    $('#live-ico-' + event.id).show();
                else
                    $('#live-ico-' + event.id).hide();

                if (event.info.xlsname != "" && event.info.xlsname != undefined) {
                    let td = tr.children("td:nth-child(5)");
                    td.html("<img src='images/xls.png' width=20 />");
                    td.click(function() {
                        let eventId = $(this).parent().attr("data-ref");
                        downloadXls(eventId);
                        return false;
                    });
                }
        }

        updateEventProgress();

        $("#current_body").html('');
        $("#nextriders_body").html('');
        $("#finish_body").html('');
    }

    function updateEventProgress() {
        const eventCount = events.length;
        for (let i = 0; i < eventCount; i++) {
            const event = events[i];
            if (gameInfo.eventId === event.id) {
                const progress = Math.floor(100 * gameInfo.started_count / startlist.length);
                const now = new Date();
                const time = event.info.gameBeginTime || '';
                const match = time.match(/\[.*\]\s+(\d{1,2}:\d{1,2}:\d{1,2})\.\d+/);
                if (match && match.length) {
                    event.info.gameBeginTime = match[1];
                } else {
                    event.info.gameBeginTime = `${now.getHours() - 1}:${now.getMinutes()}:${now.getSeconds()}`;
                }

                const startDate = new Date(`${now.getFullYear}-${now.getMonth()}-${now.getDate()} ${event.info.gameBeginTime}`);
                const diff = (now.getTime() - startDate.getTime()) / 1000;
                const remainingProgress = 100 - progress;
                const remainingTime = diff * remainingProgress / 100;
                const endDate = new Date(now.getTime() + remainingTime);

                let progressElement = $(`#live-events tr:nth-child(${i+1}) td:nth-child(2) .progress-bar`);
                let etaElement = $(`#live-events tr:nth-child(${i+1}) td:nth-child(2) #eta`);
                progressElement.css('width', `${progress}%`);
                progressElement.html(`${gameInfo.started_count} / ${startlist.length}`);
                etaElement.html(formatSimpleTime(endDate));

                progressElement = $(".progress-wrapper .progress-bar");
                etaElement = $(".progress-wrapper #eta");
                progressElement.css('width', `${progress}%`);
                progressElement.html(`${gameInfo.started_count} / ${startlist.length}`);
                etaElement.html(formatSimpleTime(endDate));
            }
        }
        localizeKey('ETA');
    }

    function downloadXls(eventId) {
        location.href = "/xls/" + eventId;
    }

    function downloadPdf(file) {
        location.href = "/pdf/" + file;
    }


    function joinToEvent(eventId, discipline) {
        let event = events.find((event) => {
            return (event.id == eventId);
        });

        if (event === undefined) {
            //$("#error_noevent").show();
            return;
        }

        // 0: jumping, 2: cross, 3: dressage
        let uri = "";
        if (event.info.discipline == 0) { //jumping
            uri = "jumping";
        } else if (event.info.discipline == 2) {
            uri = "cross";
        } else if (event.info.discipline == 3) {
            uri = "dressage";
        }

        if (discipline != undefined) uri = discipline;

        if (uri != "")
            location.href = "/" + uri + "?eventid=" + event.id;

        return;
        
    }

    $('#event_list').show();
});


$(document).ready(() => {
    //var language = window.navigator.userLanguage || window.navigator.language;
    //en-US
    //en-GB
    //de
    //fr
    //it

    //const language = navigator.language;
    const language = window.navigator.userLanguage || window.navigator.language
    lang = language.match(/(\w+)(-\w+)?/)[1];
    $("#lang").val(lang);
    localizeAll(lang);
});